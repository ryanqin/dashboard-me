'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface HealthLog {
  date: string
  sleep_score: number | null
  readiness: number | null
  hrv: number | null
  resting_hr: number | null
  steps: number | null
}

function scoreColor(score: number | null | undefined): string {
  if (!score) return 'bg-gray-50 text-gray-300'
  if (score >= 80) return 'bg-green-50 text-green-700'
  if (score >= 60) return 'bg-yellow-50 text-yellow-700'
  return 'bg-red-50 text-red-600'
}

function ScoreChip({ score }: { score: number | null | undefined }) {
  return (
    <span className={`inline-flex items-center justify-center w-10 h-7 rounded-md font-black text-sm ${scoreColor(score)}`}>
      {score ?? '—'}
    </span>
  )
}

function StatCell({
  label, value, chip, unit, format,
}: {
  label: string
  value: number | null | undefined
  chip?: boolean
  unit?: string
  format?: (v: number) => string
}) {
  const shown = value == null ? '—' : format ? format(value) : String(value)
  const chipClass = chip ? scoreColor(value) : 'bg-gray-50 text-gray-700'
  return (
    <div className={`rounded-lg px-3 py-2 ${chipClass}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-60">{label}</div>
      <div className="font-black text-xl leading-tight tabular-nums">
        {shown}
        {unit && value != null && <span className="text-xs font-medium opacity-60 ml-0.5">{unit}</span>}
      </div>
    </div>
  )
}

function MiniBar({ value, max, color = 'bg-black' }: { value: number; max: number; color?: string }) {
  return (
    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div className={`${color} h-full rounded-full transition-all`}
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  )
}

function TrendChart({ data, k, color = '#000' }: {
  data: HealthLog[]; k: keyof HealthLog; color?: string
}) {
  const values = data.map(d => d[k] as number | null).filter(v => v != null) as number[]
  if (values.length < 2) return <div className="text-gray-200 text-xs text-center py-4">数据不足</div>

  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const pad = Math.max(5, Math.round((rawMax - rawMin) * 0.3))
  const minV = Math.max(0, rawMin - pad)
  const maxV = Math.min(100, rawMax + pad)
  const range = maxV - minV || 1

  // Horizontal plot area: leave ~16px on the right for the y-axis tick values.
  const W = 280, PLOT_W = 258, PLOT_X0 = 4
  const points = data.map((d, i) => {
    const v = d[k] as number | null
    const x = (i / (data.length - 1)) * PLOT_W + PLOT_X0
    const y = v != null ? 5 + (1 - (v - minV) / range) * 48 : null
    return { x, y, v, date: d.date }
  })
  const valid = points.filter(p => p.y != null)
  const pathD = valid.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  // Pick ~5 evenly-spaced x-axis labels (always include first + last) so long
  // ranges stay readable instead of overlapping into a solid smear.
  const TARGET_TICKS = 5
  const tickSet = new Set<number>([0, points.length - 1])
  for (let i = 1; i < TARGET_TICKS - 1; i++) {
    tickSet.add(Math.round((i * (points.length - 1)) / (TARGET_TICKS - 1)))
  }
  const dotRadius = points.length > 20 ? 1.8 : 2.6

  return (
    <svg width="100%" viewBox={`0 0 ${W} 78`} className="overflow-visible">
      {[minV, Math.round((minV + maxV) / 2), maxV].map((v, i) => {
        const y = 5 + (1 - (v - minV) / range) * 48
        return (
          <g key={i}>
            <line x1="0" y1={y} x2={PLOT_X0 + PLOT_W} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={PLOT_X0 + PLOT_W + 3} y={y + 3} fontSize="7" fill="#d1d5db" textAnchor="start">{v}</text>
          </g>
        )
      })}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {valid.map((p) => (
        <circle key={p.date} cx={p.x} cy={p.y!} r={dotRadius} fill={color} />
      ))}
      {points.map((p, i) =>
        tickSet.has(i) ? (
          <text key={p.date} x={p.x} y="74" textAnchor="middle" fontSize="8" fill="#9ca3af">
            {p.date.slice(5)}
          </text>
        ) : null,
      )}
    </svg>
  )
}

export default function HealthPage() {
  const [logs, setLogs] = useState<HealthLog[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/health?days=30')
    const data = await res.json()
    setLogs(data.slice().reverse()) // oldest first for chart
    setLoading(false)
  }

  async function syncToday() {
    setSyncing(true)
    await fetch('/api/health/sync?days=14', { method: 'POST' })
    await load()
    localStorage.setItem('health_last_sync', Date.now().toString())
    setSyncing(false)
  }

  useEffect(() => {
    load()
    // Auto-backfill: sync last 14 days on page load, but throttle to once per 4h.
    const COOLDOWN_MS = 4 * 60 * 60 * 1000
    const last = parseInt(localStorage.getItem('health_last_sync') || '0')
    if (Date.now() - last > COOLDOWN_MS) {
      setSyncing(true)
      fetch('/api/health/sync?days=14', { method: 'POST' })
        .then(() => load())
        .then(() => localStorage.setItem('health_last_sync', Date.now().toString()))
        .finally(() => setSyncing(false))
    }
  }, [])

  const latest = logs.length > 0 ? [...logs].reverse()[0] : null
  const prev    = logs.length > 1 ? [...logs].reverse()[1] : null

  function delta(a: number | null, b: number | null) {
    if (!a || !b) return null
    const d = a - b
    return d > 0 ? `+${d}` : `${d}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-6">
        <span className="font-black text-lg">⚡ 个人面板</span>
        <div className="flex gap-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-black">首页</Link>
          <Link href="/hardwork" className="hover:text-black">苦功夫</Link>
          <Link href="/jobs" className="hover:text-black">求职</Link>
          <Link href="/coding" className="hover:text-black">刷题</Link>
          <span className="font-medium text-black">健康</span>
          <Link href="/sculpt" className="hover:text-black">塑型</Link>
          <Link href="/library" className="hover:text-black">图书馆</Link>
          <Link href="/profile" className="hover:text-black">档案</Link>
        </div>
        <button onClick={syncToday} disabled={syncing}
          className="ml-auto text-xs px-3 py-1.5 bg-black text-white rounded-lg disabled:opacity-40">
          {syncing ? '同步中...' : '🔄 同步今日'}
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">

        {/* Today — unified stat list, no giant boxes */}
        {latest && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold">今日状态 · {latest.date}</div>
              {prev && (
                <div className="text-xs text-gray-400">
                  vs 昨日：睡眠 {delta(latest.sleep_score, prev.sleep_score) ?? '—'}
                  ·  准备度 {delta(latest.readiness, prev.readiness) ?? '—'}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <StatCell label="睡眠"     value={latest.sleep_score} chip />
              <StatCell label="准备度"   value={latest.readiness}   chip />
              <StatCell label="HRV"      value={latest.hrv} />
              <StatCell label="静息心率" value={latest.resting_hr} unit="bpm" />
              <StatCell label="步数"     value={latest.steps} format={(v) => v.toLocaleString()} />
            </div>
          </div>
        )}

        {/* Trend charts */}
        {logs.length >= 2 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-3">
              <div className="text-xs font-medium text-gray-500 mb-2">😴 睡眠趋势</div>
              <TrendChart data={logs} k="sleep_score" color="#000" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-3">
              <div className="text-xs font-medium text-gray-500 mb-2">⚡ 准备度趋势</div>
              <TrendChart data={logs} k="readiness" color="#16a34a" />
            </div>
          </div>
        )}

        {/* History table — header and rows share the same grid template so columns always line up */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-xs font-medium text-gray-500 mb-2">历史记录 · 最近 {logs.length} 天</div>
          {/* Header row uses the exact same grid-cols as data rows */}
          <div className="grid grid-cols-[4rem_1fr_1fr_1fr_1fr_1fr] gap-2 pb-1.5 mb-1 border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-wider">
            <span>日期</span>
            <span className="text-center">睡眠</span>
            <span className="text-center">准备度</span>
            <span className="text-center">HRV</span>
            <span className="text-right">步数</span>
            <span className="text-right">心率</span>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-7 bg-gray-50 rounded animate-pulse"/>)}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {[...logs].reverse().map(log => (
                <div key={log.date}
                     className="grid grid-cols-[4rem_1fr_1fr_1fr_1fr_1fr] items-center gap-2 py-1 text-xs">
                  <span className="text-gray-400 tabular-nums">{log.date.slice(5)}</span>
                  <span className="text-center">
                    <span className={`inline-block w-9 text-center font-bold rounded px-1 py-0.5 ${scoreColor(log.sleep_score)}`}>
                      {log.sleep_score ?? '—'}
                    </span>
                  </span>
                  <span className="text-center">
                    <span className={`inline-block w-9 text-center font-bold rounded px-1 py-0.5 ${scoreColor(log.readiness)}`}>
                      {log.readiness ?? '—'}
                    </span>
                  </span>
                  <span className="text-center text-gray-600 tabular-nums">{log.hrv ?? '—'}</span>
                  <span className="text-right text-gray-500 tabular-nums">
                    {log.steps ? log.steps.toLocaleString() : '—'}
                  </span>
                  <span className="text-right text-gray-500 tabular-nums">
                    {log.resting_hr ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
