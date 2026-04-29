import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

type RecordRow = {
  id: string
  date: string
  category: string
  minutes: number
  note: string | null
  created_at: string
}

function toCamel(r: RecordRow) {
  return { id: r.id, date: r.date, category: r.category, minutes: r.minutes, note: r.note, createdAt: r.created_at }
}

export async function GET() {
  const rows = getDb().prepare('SELECT * FROM work_records ORDER BY date DESC').all() as RecordRow[]
  return NextResponse.json(rows.map(toCamel))
}

export async function POST(req: NextRequest) {
  const { date, category, minutes, note } = await req.json()
  const id = Date.now().toString()
  getDb().prepare(
    'INSERT INTO work_records (id, date, category, minutes, note) VALUES (?, ?, ?, ?, ?)'
  ).run(id, date, category, minutes, note || null)
  const row = getDb().prepare('SELECT * FROM work_records WHERE id = ?').get(id) as RecordRow
  return NextResponse.json(toCamel(row))
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  getDb().prepare('DELETE FROM work_records WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
