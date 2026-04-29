import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

type TrackerRow = {
  id: string
  name: string
  emoji: string
  unit: string
  daily_target: number
  created_at: string
}

function toCamel(r: TrackerRow) {
  return { id: r.id, name: r.name, emoji: r.emoji, unit: r.unit, dailyTarget: r.daily_target, createdAt: r.created_at }
}

export async function GET() {
  const rows = getDb().prepare('SELECT * FROM trackers ORDER BY created_at').all() as TrackerRow[]
  return NextResponse.json(rows.map(toCamel))
}

export async function POST(req: NextRequest) {
  const { name, emoji, unit, dailyTarget } = await req.json()
  const id = Date.now().toString()
  getDb().prepare(
    'INSERT INTO trackers (id, name, emoji, unit, daily_target) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name, emoji || '🎯', unit || 'minutes', dailyTarget || 1)
  const row = getDb().prepare('SELECT * FROM trackers WHERE id = ?').get(id) as TrackerRow
  return NextResponse.json(toCamel(row))
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  getDb().prepare('DELETE FROM trackers WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
