import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  return NextResponse.json(
    getDb().prepare('SELECT * FROM coding_problems ORDER BY id').all()
  )
}

export async function PATCH(req: NextRequest) {
  const { id, status, score, note } = await req.json()
  const db = getDb()

  const updates: string[] = []
  const values: any[] = []

  if (status !== undefined) {
    updates.push('status = ?')
    values.push(status)
  }
  if (score !== undefined) {
    updates.push('score = ?')
    values.push(score)
  }
  if (note !== undefined) {
    updates.push('note = ?')
    values.push(note)
  }

  if (updates.length > 0) {
    db.prepare(`
      UPDATE coding_problems
      SET ${updates.join(', ')}, updated_at = datetime('now')
      WHERE id = ?
    `).run(...values, id)
  }

  return NextResponse.json({ ok: true })
}
