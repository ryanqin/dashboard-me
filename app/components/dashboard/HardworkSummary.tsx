'use client'

import Link from 'next/link'
import { Tracker, TrackerLog } from '@/app/types'
import { getToday } from '@/app/lib'

export default function HardworkSummary({ logs, trackers }: { logs: TrackerLog[]; trackers: Tracker[] }) {
  const today = getToday()
  const todayLogs = logs.filter(l => l.date === today)
  const sorted = [...trackers].sort((a, b) => ((b as {priority?:boolean}).priority ? 1 : 0) - ((a as {priority?:boolean}).priority ? 1 : 0))

  return (
    <Link href="/hardwork" className="block bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="text-xs font-medium text-gray-400 mb-3">苦功夫</div>
      <div className="space-y-2">
        {sorted.map(t => {
          const val = todayLogs.filter(l => l.trackerId === t.id).reduce((s, l) => s + l.value, 0)
          const pct = Math.min(1, t.dailyTarget > 0 ? val / t.dailyTarget : 0)
          const done = pct >= 1
          const isPriority = (t as {priority?:boolean}).priority
          return (
            <div key={t.id} className="flex items-center gap-3">
              <span className="text-sm w-5 shrink-0">{t.emoji}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${done ? 'bg-black' : isPriority ? 'bg-amber-400' : 'bg-gray-400'}`}
                  style={{ width: `${pct * 100}%` }} />
              </div>
              <span className={`text-xs w-14 text-right shrink-0 ${done ? 'font-bold' : 'text-gray-400'}`}>
                {val}/{t.dailyTarget} {done ? '✓' : ''}
              </span>
            </div>
          )
        })}
      </div>
    </Link>
  )
}
