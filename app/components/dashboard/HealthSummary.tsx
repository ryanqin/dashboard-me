'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HealthSummary() {
  const [data, setData] = useState<{date:string; sleep_score:number|null; readiness:number|null; resting_hr:number|null; steps:number|null}[]>([])
  useEffect(() => { fetch('/api/health?days=5').then(r=>r.json()).then(setData) }, [])
  const latest = data[0]
  if (!latest) return null

  return (
    <Link href="/health" className="block bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium text-gray-400">健康 · {latest.date.slice(5)}</div>
        <div className="flex gap-1">
          {data.slice(0, 5).reverse().map(d => {
            const s = d.sleep_score ?? 0
            const color = s >= 80 ? 'bg-green-400' : s >= 60 ? 'bg-yellow-400' : 'bg-red-400'
            return <div key={d.date} className={`w-2 h-6 rounded-sm ${color}`} title={`${d.date.slice(5)}: ${s}`} />
          })}
        </div>
      </div>
      <div className="flex gap-6">
        <div>
          <div className={`text-2xl font-black ${(latest.sleep_score??0)>=80?'text-green-600':(latest.sleep_score??0)>=60?'text-yellow-600':'text-red-500'}`}>{latest.sleep_score ?? '—'}</div>
          <div className="text-xs text-gray-400">睡眠</div>
        </div>
        <div>
          <div className={`text-2xl font-black ${(latest.readiness??0)>=80?'text-green-600':(latest.readiness??0)>=60?'text-yellow-600':'text-red-500'}`}>{latest.readiness ?? '—'}</div>
          <div className="text-xs text-gray-400">准备度</div>
        </div>
        {latest.steps && <div>
          <div className="text-2xl font-black">{latest.steps.toLocaleString()}</div>
          <div className="text-xs text-gray-400">步数</div>
        </div>}
        {latest.resting_hr && <div>
          <div className="text-2xl font-black">{latest.resting_hr}</div>
          <div className="text-xs text-gray-400">心率</div>
        </div>}
      </div>
    </Link>
  )
}
