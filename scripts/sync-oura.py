#!/usr/bin/env python3
"""Sync Oura ring data directly to the dashboard SQLite DB.

Reads OURA_TOKEN from the environment (or .env.local at the project root).
Get a personal access token at https://cloud.ouraring.com/personal-access-tokens.

Writes directly to SQLite (WAL mode) instead of round-tripping through the
Next.js API. The HTTP-callback version used to deadlock when the API route
called execSync (Node main thread blocked, Python callback timed out).
"""
import json
import os
import sqlite3
import sys
import time
import urllib.request
from datetime import datetime, timedelta


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, os.pardir))
DB_PATH = os.path.join(PROJECT_ROOT, "data", "dashboard.db")


def load_env_file(path):
    """Tiny .env.local reader — we don't pull in python-dotenv as a dep."""
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k, v = k.strip(), v.strip().strip('"').strip("'")
            if k and k not in os.environ:
                os.environ[k] = v


load_env_file(os.path.join(PROJECT_ROOT, ".env.local"))

TOKEN = os.environ.get("OURA_TOKEN", "").strip()
if not TOKEN:
    print(
        "error: OURA_TOKEN is not set. Add it to .env.local or export it.\n"
        "Get a token at https://cloud.ouraring.com/personal-access-tokens",
        file=sys.stderr,
    )
    sys.exit(1)

OURA_HEADERS = {"Authorization": f"Bearer {TOKEN}"}


def fetch_oura(endpoint, start, end):
    url = (
        f"https://api.ouraring.com/v2/usercollection/{endpoint}"
        f"?start_date={start}&end_date={end}"
    )
    try:
        req = urllib.request.Request(url, headers=OURA_HEADERS)
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())["data"]
    except Exception as e:
        print(f"  warning {endpoint}: {e}")
        return []


def sync_day(conn, date):
    sleep_data = fetch_oura("daily_sleep", date, date)
    ready_data = fetch_oura("daily_readiness", date, date)
    # daily_activity end_date is exclusive, need next day
    next_day = (datetime.strptime(date, "%Y-%m-%d") + timedelta(days=1)).strftime("%Y-%m-%d")
    act_data = fetch_oura("daily_activity", date, next_day)

    sleep = next((x for x in sleep_data if x["day"] == date), None)
    ready = next((x for x in ready_data if x["day"] == date), None)
    act = next((x for x in act_data if x["day"] == date), None)

    if not any([sleep, ready, act]):
        print(f"  {date}: no data")
        return

    ready_contribs = (ready.get("contributors") or {}) if ready else {}
    payload = {
        "id": str(int(time.time() * 1000)),
        "date": date,
        "sleep_score": sleep.get("score") if sleep else None,
        "readiness": ready.get("score") if ready else None,
        "hrv": ready_contribs.get("hrv_balance") if ready else None,
        "resting_hr": ready_contribs.get("resting_heart_rate") if ready else None,
        "steps": (act.get("steps") or None) if act else None,
        "raw_json": json.dumps({"sleep": sleep, "readiness": ready, "activity": act}),
    }

    conn.execute(
        """
        INSERT INTO health_logs (id, date, sleep_score, readiness, hrv, resting_hr, steps, raw_json)
        VALUES (:id, :date, :sleep_score, :readiness, :hrv, :resting_hr, :steps, :raw_json)
        ON CONFLICT(date) DO UPDATE SET
          sleep_score = excluded.sleep_score,
          readiness   = excluded.readiness,
          hrv         = excluded.hrv,
          resting_hr  = excluded.resting_hr,
          steps       = excluded.steps,
          raw_json    = excluded.raw_json
        """,
        payload,
    )
    conn.commit()
    print(f"  ok {date} sleep={payload['sleep_score']} ready={payload['readiness']}")


def main():
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 7
    today = datetime.now()

    if not os.path.exists(DB_PATH):
        print(f"error: db not found at {DB_PATH}", file=sys.stderr)
        print("hint: open the dashboard once (npm run dev) to initialise the schema.", file=sys.stderr)
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA busy_timeout = 5000")
    try:
        print(f"Syncing {days} days...")
        for i in range(days - 1, -1, -1):
            sync_day(conn, (today - timedelta(days=i)).strftime("%Y-%m-%d"))
        print("Done.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
