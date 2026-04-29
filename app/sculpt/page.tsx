'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { WorkRecord } from '../types'
import { getRecords, saveRecord, deleteRecord, getTodayStats, formatMinutes, getToday } from '../lib'

function Nav() {
  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-6">
      <span className="font-black text-lg tracking-tight">⚡ 个人面板</span>
      <div className="flex gap-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-black transition-colors">首页</Link>
        <Link href="/hardwork" className="hover:text-black transition-colors">苦功夫</Link>
        <Link href="/jobs" className="hover:text-black transition-colors">求职</Link>
        <Link href="/coding" className="hover:text-black transition-colors">刷题</Link>
        <Link href="/health" className="hover:text-black transition-colors">健康</Link>
        <Link href="/sculpt" className="font-medium text-black">塑型</Link>
        <Link href="/library" className="hover:text-black transition-colors">图书馆</Link>
        <Link href="/profile" className="hover:text-black transition-colors">档案</Link>
      </div>
    </nav>
  )
}

const EXERCISES = [
  {
    id: 'lateral-raise',
    emoji: '🦾',
    name: '哑铃侧平举',
    en: 'Lateral Raises',
    target: '三角肌中束',
    goal: '倒三角宽度',
    sets: '3 组 × 20 次',
    weight: '3–5 kg',
    cue: '手背向两侧"延展"，不是"上提"',
    climbing: '提高肩膀在高处抓点时的横向稳定性',
    visual: '视觉上横向拉开肩膀最快的动作，是倒三角的顶角',
  },
  {
    id: 'pullup',
    emoji: '🧗',
    name: '窄距引体向上',
    en: 'Narrow Grip Pull-ups + Eccentric',
    target: '背阔肌',
    goal: '倒三角线条',
    sets: '3–5 组',
    weight: '自重',
    cue: '顶部停留 2 秒，用 5 秒极慢放下（离心）',
    climbing: '模拟 Lock-off 锁定动作，单手挂点时更稳',
    visual: '离心训练深度刻画背部线条，干练且宽',
  },
  {
    id: 'diamond-pushup',
    emoji: '💎',
    name: '钻石俯卧撑',
    en: 'Diamond Push-ups',
    target: '胸肌内侧 + 三头',
    goal: '拮抗肌平衡',
    sets: '3 组至力竭',
    weight: '自重',
    cue: '攀岩结束后进行，双手食指拇指成菱形',
    climbing: '强化 Compression 挤压力量，保护肩膀平衡，预防圆肩',
    visual: '紧致胸内侧，平整有型，不显臃肿',
  },
  {
    id: 'hanging-leg-raise',
    emoji: '🏹',
    name: '悬垂举腿',
    en: 'Hanging Leg Raises',
    target: '核心 / 腹肌',
    goal: '收紧腰部',
    sets: '3 组 × 15 次',
    weight: '自重',
    cue: '上半身不动，用核心带起腿部',
    climbing: '解决"掉脚"问题，增强仰角岩壁上的张力',
    visual: '视觉上收窄腰线，强化腹肌',
  },
]

function ExerciseCard({ ex }: { ex: typeof EXERCISES[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(x => !x)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
        <span className="text-2xl">{ex.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">{ex.name}
            <span className="text-gray-400 font-normal ml-1.5 text-xs">{ex.en}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{ex.target} · {ex.sets}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{ex.goal}</div>
        </div>
        <span className="text-gray-300 text-xs ml-2">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-3 bg-gray-50/50">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <div className="text-xs text-gray-400 mb-1">做法要点</div>
              <div className="text-sm font-medium">{ex.sets}</div>
              {ex.weight !== '自重' && <div className="text-xs text-gray-400 mt-0.5">重量：{ex.weight}</div>}
              <div className="text-xs text-gray-500 mt-2 leading-relaxed">💡 {ex.cue}</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <div className="text-xs text-gray-400 mb-1">攀岩收益</div>
              <div className="text-xs text-gray-600 leading-relaxed">🧗 {ex.climbing}</div>
            </div>
          </div>
          <div className="bg-indigo-50 rounded-xl px-4 py-3">
            <div className="text-xs text-indigo-400 mb-1">视觉加成</div>
            <div className="text-xs text-indigo-700 leading-relaxed">✨ {ex.visual}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SculptPage() {
  const [records, setRecords] = useState<WorkRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [logOpen, setLogOpen] = useState(false)
  const [minutes, setMinutes] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const today = getToday()

  const refresh = useCallback(async () => {
    setLoading(true)
    try { setRecords(await getRecords()) } finally { setLoading(false) }
  }, [])
  useEffect(() => { refresh() }, [refresh])

  const stats = getTodayStats(records)
  const todayMins = stats.records.filter(r => r.category === '塑型').reduce((s, r) => s + r.minutes, 0)
  const todayRecs = stats.records.filter(r => r.category === '塑型')

  async function handleLog(e: React.FormEvent) {
    e.preventDefault()
    const mins = parseInt(minutes)
    if (!mins || mins <= 0) return
    setSaving(true)
    try {
      const r = await saveRecord({ date: today, category: '塑型', minutes: mins, note: note.trim() || undefined })
      setRecords(prev => [...prev, r])
      setMinutes(''); setNote(''); setLogOpen(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    await deleteRecord(id)
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white text-black">
        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight">塑型</h1>
              <p className="text-gray-400 text-sm mt-0.5">倒三角 · 攀岩力量 · 干练线条</p>
            </div>
            {!loading && todayMins > 0 && (
              <div className="text-right">
                <div className="text-2xl font-black">{formatMinutes(todayMins)}</div>
                <div className="text-xs text-gray-400">今日塑型</div>
              </div>
            )}
          </div>

          {/* 动作库 */}
          <div className="mb-8 space-y-3">
            <div className="text-sm font-bold text-gray-700 mb-3">训练动作</div>
            {EXERCISES.map(ex => <ExerciseCard key={ex.id} ex={ex} />)}
          </div>

          {/* 记录时间 */}
          <div className="mb-6">
            <button onClick={() => setLogOpen(x => !x)}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl hover:border-gray-400 transition-colors text-sm">
              <span className="font-medium text-gray-600">🏋️ 记录塑型时间</span>
              <span className="text-gray-300 text-xs">{logOpen ? '收起 ▲' : '展开 ▼'}</span>
            </button>
            {logOpen && (
              <form onSubmit={handleLog} className="border border-t-0 border-gray-200 rounded-b-xl px-4 pb-4 pt-3 -mt-1">
                <div className="flex gap-2 mb-2">
                  <input type="number" value={minutes} onChange={e => setMinutes(e.target.value)}
                    placeholder="时长（分钟）" min={1} max={999} required
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" />
                  <div className="flex gap-1">
                    {[20, 30, 45, 60].map(m => (
                      <button key={m} type="button" onClick={() => setMinutes(m.toString())}
                        className="px-2 py-1 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">{m}</button>
                    ))}
                  </div>
                </div>
                <input type="text" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="备注（如：侧平举+引体）"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-black" />
                <button type="submit" disabled={saving || !minutes}
                  className="w-full bg-black text-white rounded-lg py-2.5 text-sm font-bold hover:bg-gray-800 disabled:opacity-40">
                  {saving ? '保存中...' : '＋ 记录'}
                </button>
              </form>
            )}
          </div>

          {/* 今日记录 */}
          {!loading && todayRecs.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-bold text-gray-700 mb-2">今日记录</div>
              {todayRecs.slice().reverse().map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 group">
                  <span className="text-lg">🏋️</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">塑型 · {formatMinutes(r.minutes)}</div>
                    {r.note && <div className="text-xs text-gray-400 truncate">{r.note}</div>}
                  </div>
                  <button onClick={() => handleDelete(r.id)}
                    className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs transition-colors">删除</button>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </>
  )
}
