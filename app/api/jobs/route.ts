import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  return NextResponse.json(getDb().prepare('SELECT * FROM jobs ORDER BY updated_at DESC').all())
}

export async function POST(req: NextRequest) {
  const { company, role, stage, url, note, applied_at } = await req.json()
  const id = Date.now().toString()
  getDb().prepare(
    'INSERT INTO jobs (id, company, role, stage, url, note, applied_at) VALUES (?,?,?,?,?,?,?)'
  ).run(id, company, role, stage || 'applied', url || null, note || null, applied_at || null)
  return NextResponse.json({ id, company, role, stage, url, note })
}

export async function PATCH(req: NextRequest) {
  const { id, ...fields } = await req.json()
  const sets = Object.keys(fields).map(k => `${k}=?`).join(', ')
  getDb().prepare(`UPDATE jobs SET ${sets}, updated_at=datetime('now') WHERE id=?`)
    .run(...Object.values(fields), id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  getDb().prepare('DELETE FROM jobs WHERE id = ?').run(id)
  return NextResponse.json({ ok: true })
}
