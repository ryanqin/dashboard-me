import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '14')
  const safeDays = Math.max(1, Math.min(30, days))
  const script = path.join(process.cwd(), 'scripts/sync-oura.py')

  // spawn (not execSync) so Node's event loop stays responsive while Oura
  // is being fetched. Python writes directly to the SQLite DB now, so no
  // HTTP callback is needed — no more self-deadlock.
  const result = await new Promise<{ ok: boolean; error?: string; output?: string }>((resolve) => {
    const child = spawn('python3', [script, String(safeDays)], { timeout: 60000 })
    const chunks: Buffer[] = []
    const errChunks: Buffer[] = []
    child.stdout.on('data', (d) => chunks.push(d))
    child.stderr.on('data', (d) => errChunks.push(d))
    child.on('close', (code) => {
      const output = Buffer.concat(chunks).toString()
      const err = Buffer.concat(errChunks).toString()
      if (code === 0) resolve({ ok: true, output })
      else resolve({ ok: false, error: err || `exit ${code}`, output })
    })
    child.on('error', (e) => resolve({ ok: false, error: String(e) }))
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }
  return NextResponse.json({ ok: true, days: safeDays, output: result.output })
}
