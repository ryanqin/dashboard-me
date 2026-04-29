import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.join(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const DB_PATH = path.join(DATA_DIR, 'dashboard.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  initSchema(_db)
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    -- ── Hardwork tracker ─────────────────────────
    CREATE TABLE IF NOT EXISTS trackers (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      emoji       TEXT NOT NULL DEFAULT '🎯',
      unit        TEXT NOT NULL DEFAULT 'minutes',
      daily_target INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tracker_logs (
      id          TEXT PRIMARY KEY,
      tracker_id  TEXT NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
      date        TEXT NOT NULL,
      value       INTEGER NOT NULL DEFAULT 0,
      note        TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS work_records (
      id          TEXT PRIMARY KEY,
      date        TEXT NOT NULL,
      category    TEXT NOT NULL,
      minutes     INTEGER NOT NULL,
      note        TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Job hunter ───────────────────────────────
    CREATE TABLE IF NOT EXISTS jobs (
      id          TEXT PRIMARY KEY,
      company     TEXT NOT NULL,
      role        TEXT NOT NULL,
      stage       TEXT NOT NULL DEFAULT 'applied',
      url         TEXT,
      note        TEXT,
      applied_at  TEXT,
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Health ───────────────────────────────────
    CREATE TABLE IF NOT EXISTS health_logs (
      id          TEXT PRIMARY KEY,
      date        TEXT NOT NULL UNIQUE,
      sleep_score INTEGER,
      readiness   INTEGER,
      hrv         INTEGER,
      resting_hr  INTEGER,
      steps       INTEGER,
      raw_json    TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ── Coding Practice ────────────────────────────
    CREATE TABLE IF NOT EXISTS coding_problems (
      id          INTEGER PRIMARY KEY,
      title       TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'todo',
      score       INTEGER,
      note        TEXT,
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Seed coding problems
  const problems = [
    '01 Dynamic Batching',
    '02 Continuous Batching',
    '03 Priority Queue SLA',
    '04 KV Cache Manager',
    '05 Token Budget Controller',
    '06 GPU Bin-Packing',
    '07 Autoscaler',
    '08 Circuit Breaker',
    '09 Canary Deployment',
    '10 Speculative Decoding',
    '11 Prefill-Decode Disaggregation',
    '12 Multi-LoRA Router',
  ]

  const insertStmt = db.prepare('INSERT OR IGNORE INTO coding_problems (id, title) VALUES (?, ?)')
  problems.forEach((title, idx) => {
    insertStmt.run(idx + 1, title)
  })
}
