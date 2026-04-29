import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

type LogRow = {
  id: string
  tracker_id: string
  date: string
  value: number
  note: string | null
  created_at: string
}

function toCamel(r: LogRow) {
  return { id: r.id, trackerId: r.tracker_id, date: r.date, value: r.value, note: r.note, createdAt: r.created_at }
}

export async function GET(req: NextRequest) {
  const trackerId = req.nextUrl.searchParams.get('trackerId')
  const db = getDb()
  const rows = (trackerId
    ? db.prepare('SELECT * FROM tracker_logs WHERE tracker_id = ? ORDER BY date').all(trackerId)
    : db.prepare('SELECT * FROM tracker_logs ORDER BY date').all()
  ) as LogRow[]
  return NextResponse.json(rows.map(toCamel))
}

export async function POST(req: NextRequest) {
  const { trackerId, date, value, note } = await req.json()
  const id = Date.now().toString()
  getDb().prepare(
    'INSERT INTO tracker_logs (id, tracker_id, date, value, note) VALUES (?, ?, ?, ?, ?)'
  ).run(id, trackerId, date, value || 0, note || null)
  const row = getDb().prepare('SELECT * FROM tracker_logs WHERE id = ?').get(id) as LogRow
  return NextResponse.json(toCamel(row))
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  getDb().prepare('DELETE FROM tracker_logs WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
