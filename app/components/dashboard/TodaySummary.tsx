'use client'

import { useState, useEffect } from 'react'
import { Tracker, TrackerLog } from '@/app/types'
import { getToday } from '@/app/lib'

export default function TodaySummary({ logs, trackers }: { logs: TrackerLog[]; trackers: Tracker[] }) {
  const today = getToday()
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate()-1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()
  const todayLogs = logs.filter(l => l.date === today)
  const yesterdayLogs = logs.filter(l => l.date === yesterday)
  const totalMins = todayLogs.filter(l => trackers.find(t => t.id === l.trackerId && t.unit === 'minutes'))
    .reduce((s, l) => s + l.value, 0)
  const completedCount = trackers.filter(t => {
    const v = todayLogs.filter(l => l.trackerId === t.id).reduce((s, l) => s + l.value, 0)
    return v >= t.dailyTarget
  }).length
  const yesterdayDone = trackers.filter(t => {
    const v = yesterdayLogs.filter(l => l.trackerId === t.id).reduce((s, l) => s + l.value, 0)
    return v >= t.dailyTarget
  }).length

  const [health, setHealth] = useState<{ sleep_score: number | null; readiness: number | null } | null>(null)
  useEffect(() => {
    fetch('/api/health?days=1').then(r => r.json()).then(d => { if (d.length > 0) setHealth(d[0]) })
  }, [])

  const sleepColor = !health?.sleep_score ? '' : health.sleep_score >= 80 ? 'text-green-600' : health.sleep_score >= 60 ? 'text-yellow-500' : 'text-red-500'
  const readyColor = !health?.readiness ? '' : health.readiness >= 80 ? 'text-green-600' : health.readiness >= 60 ? 'text-yellow-500' : 'text-red-500'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
      {/* 主要指标 */}
      <div className="flex items-end gap-6 mb-3">
        <div>
          <div className={`text-3xl font-black leading-none ${completedCount === trackers.length && trackers.length > 0 ? 'text-green-600' : ''}`}>
            {completedCount}<span className="text-lg text-gray-300 font-normal">/{trackers.length}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">今日完成</div>
        </div>
        <div className="w-px h-8 bg-gray-100 self-center" />
        <div>
          <div className={`text-3xl font-black leading-none ${sleepColor}`}>{health?.sleep_score ?? '—'}</div>
          <div className="text-xs text-gray-400 mt-1">睡眠</div>
        </div>
        <div>
          <div className={`text-3xl font-black leading-none ${readyColor}`}>{health?.readiness ?? '—'}</div>
          <div className="text-xs text-gray-400 mt-1">准备度</div>
        </div>
      </div>
      {/* 次要信息 */}
      <div className="flex gap-4 text-xs text-gray-400 border-t border-gray-50 pt-2">
        <span>昨日 <span className={`font-medium ${yesterdayDone === trackers.length && trackers.length > 0 ? 'text-green-500' : 'text-gray-600'}`}>{trackers.length === 0 ? '—' : `${yesterdayDone}/${trackers.length}`}</span></span>
        <span>·</span>
        <span>今日时长 <span className="font-medium text-gray-600">{totalMins === 0 ? '0m' : totalMins >= 60 ? `${Math.floor(totalMins/60)}h${totalMins%60 ? `${totalMins%60}m` : ''}` : `${totalMins}m`}</span></span>
        <span>·</span>
        <span className="ml-auto">{today.slice(5)} {new Date().toLocaleDateString('zh', { weekday: 'short' })}</span>
      </div>
    </div>
  )
}
