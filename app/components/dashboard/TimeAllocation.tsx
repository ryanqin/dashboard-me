'use client'

import { useState, useEffect } from 'react'
import { Tracker, TrackerLog } from '@/app/types'
import { getToday } from '@/app/lib'

export default function TimeAllocation({ logs, trackers }: { logs: TrackerLog[]; trackers: Tracker[] }) {
  const today = getToday()
  const [records, setRecords] = useState<{id:string;date:string;category:string;minutes:number;note:string|null}[]>([])
  useEffect(() => {
    fetch('/api/work-records').then(r=>r.json()).then(setRecords)
  }, [])

  // Tracker minute logs today
  const trackerItems = trackers
    .filter(t => t.unit === 'minutes')
    .map(t => ({
      name: t.name,
      emoji: t.emoji,
      mins: logs.filter(l => l.trackerId === t.id && l.date === today).reduce((s,l) => s+l.value, 0)
    }))
    .filter(x => x.mins > 0)

  // Work records today
  const recordItems = records
    .filter(r => r.date === today)
    .map(r => ({ name: r.note || r.category, emoji: r.category === '编程' ? '💻' : r.category === '学习' ? '📚' : r.category === '健身' ? '🏋️' : r.category === '写作' ? '✍️' : '📌', mins: r.minutes }))

  // Merge by name
  const merged: Record<string, {name:string;emoji:string;mins:number}> = {}
  ;[...trackerItems, ...recordItems].forEach(item => {
    if (merged[item.name]) merged[item.name].mins += item.mins
    else merged[item.name] = { ...item }
  })
  const items = Object.values(merged).sort((a,b) => b.mins - a.mins)
  const total = items.reduce((s,x) => s+x.mins, 0)

  if (items.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium text-gray-400">今日时间分配</div>
        <div className="text-xs text-gray-400">{total >= 60 ? `${Math.floor(total/60)}h${total%60 ? `${total%60}m` : ''}` : `${total}m`} 共计</div>
      </div>
      <div className="space-y-2">
        {items.map(item => {
          const pct = Math.round(item.mins / total * 100)
          return (
            <div key={item.name}>
              <div className="flex justify-between text-xs mb-0.5">
                <span>{item.emoji} {item.name}</span>
                <span className="text-gray-400">{item.mins >= 60 ? `${Math.floor(item.mins/60)}h${item.mins%60?`${item.mins%60}m`:''}` : `${item.mins}m`} · {pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-black rounded-full" style={{width:`${pct}%`}} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
