# dashboard-me

> **苦功夫，每一分钟都算数.** A local-first personal dashboard wired around the **Mini Habits** model — set the daily floor absurdly low, show up every day, let consistency compound.

A small, honest tool you open every morning. Trackers, a job pipeline, a coding-practice log, an optional Oura sync, a markdown reader. One SQLite file, no SaaS, runs on `localhost:3001`.

## Philosophy

Mechanically the dashboard borrows from BJ Fogg / Stephen Guise's **Mini Habits** model: every tracker's daily target is set so low that *showing up* always wins (one problem, one push-up, one page, one minute). Consistency does the compounding.

Tonally it does the opposite. Header says **苦功夫** (kǔ gōngfu — "grinding craft"), empty state says **每一分钟都算数** (every minute counts), the streak counter goes orange when you cross seven days. The contrast is the point — Mini Habits as the engine, 苦功夫 as the windshield.

Architecturally, every module is a vertical slice (page + API route + table) — small enough to extend on a Sunday.

## Modules

| Module | Path | What it does |
|---|---|---|
| 苦功夫 Hardwork | `/hardwork` | Custom trackers (minutes / pages / problems / times) with live timers, daily target rings, 7-day mini-history, free-form time log with category breakdown, ad-hoc event capture, 14-day bar history. |
| 求职 Jobs | `/jobs` | Pipeline board: applied / interview / offer / rejected with stage cycling, counts, filtering, inline edit. |
| 刷题 Coding | `/coding` | Practice tracker. Twelve problems seeded by default (dynamic batching → multi-LoRA router). Status cycles todo → in_progress → done; score + note inline. Edit `lib/db.ts` to seed your own. |
| 健康 Health | `/health` | Sleep / readiness / HRV / resting HR / steps. Optional — pull data via `scripts/sync-oura.py` (Oura Ring API). |
| 塑型 Sculpt | `/sculpt` | A small static catalog of upper-body exercises plus a free-form time log. Customise the routine in `app/sculpt/page.tsx`. |
| 图书馆 Library | `/library` | Reads markdown books from a configurable directory. Per-chapter notes + reading progress in localStorage. A sample book ships in `examples/library/`. |
| 档案 Profile | `/profile` | RPG-stat sheet derived from real data: HP from sleep, INT from coding logs, etc. Long/short-term goals from `data/goals.json`. The placeholder persona at the top is meant to be edited in `app/profile/page.tsx`. |
| 首页 Home | `/` | Today's summary: tracker progress bars, jobs glance, latest health row, time allocation pie. |

## Tech stack

- **Next.js 16** (App Router, React 19) — *note: this repo deliberately tracks bleeding-edge Next; see `AGENTS.md`*
- **TypeScript 5**
- **Tailwind CSS 4**
- **better-sqlite3 12** with WAL mode — single local file at `data/dashboard.db`
- **Python 3** for the Oura sync (writes to SQLite directly to avoid an HTTP-callback deadlock — the script's docstring tells the story)
- **react-markdown** for the library reader
- **localStorage** for: timer state, reading progress, per-chapter notes

No ORM, no auth, no remote services beyond the optional Oura API.

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3001
```

The SQLite file and schema are created automatically on first request — no migration step.

Production-style:

```bash
npm run build
npm start            # http://localhost:3001
./deploy.sh          # build + restart on :3001 with a server.log/server.pid
```

## Optional configuration

Copy `.env.example` to `.env.local` and fill in what you need:

```bash
cp .env.example .env.local
```

### Oura health sync

```bash
# in .env.local
OURA_TOKEN=your_personal_access_token
```

Get a token at <https://cloud.ouraring.com/personal-access-tokens>. Then:

```bash
python3 scripts/sync-oura.py 7    # last 7 days
```

Or just hit "🔄 同步今日" on the `/health` page — it shells out to the same script. Without a token, the health module just shows empty rows.

### Library

The library reader looks for markdown books in `LIBRARY_PATH`, defaulting to `~/Projects/dashboard-me-library`. A sample book ships in `examples/library/` — point at it directly to see the reader work:

```bash
# in .env.local
LIBRARY_PATH=/absolute/path/to/dashboard-me/examples/library
```

Each book is a directory containing a `book.json` plus markdown chapter files:

```
examples/library/
└── mini-habits-primer/
    ├── book.json          # { id, title, author, cover, chapters: [...] }
    ├── 01-why-tiny.md
    ├── 02-the-floor.md
    └── 03-streaks.md
```

## Adding a new module

The mesh stays mesh-shaped because every module is the same five things:

1. `app/<name>/page.tsx` — the page
2. `app/api/<name>/route.ts` — the API
3. A table in `lib/db.ts` (added to `initSchema`)
4. A link in `app/components/dashboard/Nav.tsx`
5. *Optional:* a `<Name>Summary.tsx` in `app/components/dashboard/` mounted on the home page

That's the whole convention.

## Customising

- **Profile persona** — edit the `DEMO_PROFILE` constant at the top of `app/profile/page.tsx`. Everything else on that page is computed from real data.
- **Goals** — edit `data/goals.json`. Set `urgent: true` on a short-term goal to make it pop on the profile page.
- **Coding problems** — edit the `problems` array in `lib/db.ts`. New rows are inserted via `INSERT OR IGNORE`, so you can extend the list without losing your existing scores.
- **Sculpt routine** — the exercise catalogue lives directly in `app/sculpt/page.tsx`.
- **Tracker categories** — Chinese categories are defined in `app/types.ts` (`Category` union + `CATEGORY_EMOJI`). Swap them out if you don't read Chinese.

## License

MIT.
