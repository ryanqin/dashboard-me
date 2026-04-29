import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '7')
  const rows = getDb().prepare(
    'SELECT * FROM health_logs ORDER BY date DESC LIMIT ?'
  ).all(days)
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { date, sleep_score, readiness, hrv, resting_hr, steps, raw_json } = body
  const id = Date.now().toString()
  getDb().prepare(`
    INSERT INTO health_logs (id, date, sleep_score, readiness, hrv, resting_hr, steps, raw_json)
    VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(date) DO UPDATE SET
      sleep_score=excluded.sleep_score, readiness=excluded.readiness,
      hrv=excluded.hrv, resting_hr=excluded.resting_hr,
      steps=excluded.steps, raw_json=excluded.raw_json
  `).run(id, date, sleep_score, readiness, hrv, resting_hr, steps, raw_json ? JSON.stringify(raw_json) : null)
  return NextResponse.json({ ok: true })
}
