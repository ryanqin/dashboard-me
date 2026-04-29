'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface HealthLog { sleep_score: number | null; readiness: number | null; resting_hr: number | null }
interface TrackerLog { trackerId: string; date: string; value: number }
interface Tracker { id: string; name: string; emoji: string; unit: string; dailyTarget: number }

function StatBar({ label, value, max, color = 'bg-black' }: { label: string; value: number; max: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-mono font-bold">{value}<span className="text-gray-300">/{max}</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}


// Placeholder demo persona — swap these out for your own. Everything else on
// this page is derived from real tracker / health data, so the page comes alive
// once you start logging.
const DEMO_PROFILE = {
  emoji: '🌿',
  name: '路游',
  altName: 'Demo User',
  status: '示例账户',
  basicInfo: [
    ['年龄', '25岁'],
    ['身高', '178 cm'],
    ['体重', '73 kg'],
    ['MBTI', 'ENTP'],
    ['星座', '天秤☀️ 巨蟹🌙 处女↑'],
    ['思维', '空间型 / 工作记忆紧凑'],
    ['特质', '深度专注 → 续航有限'],
    ['重启方式', '攀岩 / 长跑 / 写作'],
  ],
  mainQuest: {
    title: '今年完成 60 个 Mini Habits 周期',
    sub: 'consistency × compounding',
    badges: ['进行中 × 4', '已完成 12'],
  },
  kernel: {
    coreIdentity: '披着温和外衣的现实系统重构者。用极高共情力感知世界温度，用最冷酷的底层逻辑丈量世界骨架。',
    cards: [
      { title: '🖥️ 硬件', main: 'GPU 超强 — 视觉空间建模，复杂信息瞬间降维为沙盘', sub: 'RAM 紧凑 — 多变量易触发过载保护' },
      { title: '⚙️ 操作系统', main: 'Ni+Fe — 宏观探索 × 精准感知人性', sub: 'Ti+♑ — 冷酷审视教条，元认知无死角' },
      { title: '⚡ 动力系统', main: '脑内已推演完 → 多巴胺断供', sub: '外界极限压力 → 强制唤醒行动力' },
      { title: '🧗 爱好', main: '攀岩 — 专注当下，放空大脑', sub: '纯粹的身体运动，不想别的' },
    ],
  },
}


export default function ProfilePage() {
  const [health, setHealth] = useState<HealthLog | null>(null)
  const [logs, setLogs] = useState<TrackerLog[]>([])
  const [trackers, setTrackers] = useState<Tracker[]>([])
  const [goals, setGoals] = useState<{long:{id:string;title:string;note:string;since:string}[];short:{id:string;title:string;note:string;due:string|null;urgent:boolean}[]}>({long:[],short:[]})

  useEffect(() => {
    fetch('/api/health?days=1').then(r=>r.json()).then(d => d[0] && setHealth(d[0]))
    fetch('/api/tracker-logs').then(r=>r.json()).then(setLogs)
    fetch('/api/trackers').then(r=>r.json()).then(setTrackers)
    fetch('/api/goals').then(r=>r.json()).then(setGoals).catch(()=>{})
  }, [])

  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()
  const todayLogs = logs.filter(l => l.date === today)

  // RPG stats derived from real data
  const sleep = health?.sleep_score ?? 0
  const readiness = health?.readiness ?? 0
  const codingStreak = (() => {
    const t = trackers.find(t => t.id === 'coding-practice')
    if (!t) return 0
    const dates = new Set(logs.filter(l=>l.trackerId===t.id).map(l=>l.date))
    let s = 0; const d = new Date()
    for (let i=0;i<30;i++) {
      if (dates.has(d.toISOString().split('T')[0])) { s++; d.setDate(d.getDate()-1) } else break
    }
    return s
  })()

  const HP  = Math.round((sleep * 0.5 + readiness * 0.5))       // 体力
  const MP  = Math.min(100, readiness + codingStreak * 3)        // 精力
  const STR = Math.min(100, todayLogs.filter(l=>l.trackerId==='morning-exercise').length > 0 ? 80 : 40)
  const INT = Math.min(100, 60 + (todayLogs.filter(l=>['coding-practice','inference-engineering'].includes(l.trackerId)).length * 15))
  const WIS = Math.min(100, 55 + codingStreak * 5)

  const totalTasks = trackers.length
  const doneTasks  = trackers.filter(t => {
    const v = todayLogs.filter(l=>l.trackerId===t.id).reduce((s,l)=>s+l.value,0)
    return v >= t.dailyTarget
  }).length

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-6">
        <span className="font-black text-lg">⚡ 个人面板</span>
        <div className="flex gap-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-black">首页</Link>
          <Link href="/hardwork" className="hover:text-black">苦功夫</Link>
          <Link href="/jobs" className="hover:text-black">求职</Link>
          <Link href="/coding" className="hover:text-black">刷题</Link>
          <Link href="/health" className="hover:text-black">健康</Link>
          <Link href="/sculpt" className="hover:text-black">塑型</Link>
          <Link href="/library" className="hover:text-black">图书馆</Link>
          <span className="font-medium text-black">档案</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[260px_1fr] gap-5">

          {/* Left: Character card */}
          <div className="space-y-4">
            {/* Avatar + name */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-3">
                {DEMO_PROFILE.emoji}
              </div>
              <div className="font-black text-xl">{DEMO_PROFILE.name}</div>
              <div className="text-gray-400 text-xs mt-0.5">{DEMO_PROFILE.altName}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-xs rounded-full">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                {DEMO_PROFILE.status}
              </div>
            </div>

            {/* Attributes */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="text-xs font-bold text-gray-500 mb-3">今日属性</div>
              <div className="space-y-3">
                <StatBar label="❤️  HP（体力）" value={HP}  max={100} color="bg-red-400" />
                <StatBar label="💙 MP（精力）" value={MP}  max={100} color="bg-blue-400" />
                <StatBar label="⚔️  STR（力量）" value={STR} max={100} color="bg-orange-400" />
                <StatBar label="🧠 INT（智力）" value={INT} max={100} color="bg-purple-400" />
                <StatBar label="🌀 WIS（智慧）" value={WIS} max={100} color="bg-green-400" />
              </div>
              <div className="text-xs text-gray-300 mt-3">基于健康数据 + 今日行动</div>
            </div>

            {/* Basic info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="text-xs font-bold text-gray-500 mb-3">基础信息</div>
              <div className="space-y-1.5 text-sm">
                {DEMO_PROFILE.basicInfo.map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-medium text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4">
            {/* Current quest */}
            <div className="bg-black text-white rounded-2xl p-5">
              <div className="text-xs text-gray-400 mb-2">⚔️ 主线任务</div>
              <div className="font-black text-lg">{DEMO_PROFILE.mainQuest.title}</div>
              <div className="text-gray-400 text-sm mt-1">{DEMO_PROFILE.mainQuest.sub}</div>
              <div className="mt-3 flex gap-2">
                {DEMO_PROFILE.mainQuest.badges.map(b => (
                  <span key={b} className="text-xs bg-white/10 px-2 py-1 rounded-full">{b}</span>
                ))}
              </div>
            </div>

            {/* 目标 */}
            <div className="space-y-2">
              {goals.short.filter(g => g.urgent).map(g => (
                <div key={g.id} className="bg-amber-50 border border-amber-300 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full font-bold">TOP PRIORITY</span>
                    {g.due && <span className="text-xs text-amber-600">Due {g.due}</span>}
                  </div>
                  <div className="font-black text-base">{g.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{g.note}</div>
                </div>
              ))}
            </div>

            {/* 系统内核 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="text-xs font-bold text-gray-500 mb-3">🧬 系统内核</div>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-xs font-bold mb-1">核心定位</div>
                  <div className="text-sm text-gray-600">{DEMO_PROFILE.kernel.coreIdentity}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_PROFILE.kernel.cards.slice(0, 2).map(c => (
                    <div key={c.title} className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-xs font-bold mb-1">{c.title}</div>
                      <div className="text-xs text-gray-500">{c.main}</div>
                      <div className="text-xs text-gray-400 mt-1">{c.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_PROFILE.kernel.cards.slice(2, 4).map(c => (
                    <div key={c.title} className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-xs font-bold mb-1">{c.title}</div>
                      <div className="text-xs text-gray-500">{c.main}</div>
                      <div className="text-xs text-gray-400 mt-1">{c.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Today quests */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-gray-500">📋 今日支线</div>
                <div className="text-xs text-gray-400">{doneTasks}/{totalTasks} 完成</div>
              </div>
              <div className="space-y-2">
                {trackers.map(t => {
                  const val = todayLogs.filter(l=>l.trackerId===t.id).reduce((s,l)=>s+l.value,0)
                  const done = val >= t.dailyTarget
                  return (
                    <div key={t.id} className={`flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 ${done ? 'opacity-50' : ''}`}>
                      <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${done ? 'bg-black border-black text-white' : 'border-gray-300'}`}>
                        {done ? '✓' : ''}
                      </span>
                      <span className="text-sm flex-1">{t.emoji} {t.name}</span>
                      <span className="text-xs text-gray-400">{val}/{t.dailyTarget} {t.unit === 'minutes' ? 'm' : t.unit === 'pages' ? 'p' : t.unit === 'problems' ? 'q' : '×'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
