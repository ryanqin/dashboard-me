'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Job {
  id: string; company: string; role: string; stage: string
  url?: string; note?: string; applied_at?: string; updated_at: string
}

const STAGES = ['all', 'interview', 'applied', 'rejected'] as const
const STAGE_STYLE: Record<string, string> = {
  interview: 'bg-green-50 text-green-700 border-green-200',
  applied:   'bg-blue-50 text-blue-700 border-blue-200',
  offer:     'bg-purple-50 text-purple-700 border-purple-200',
  rejected:  'bg-gray-100 text-gray-400 border-gray-200',
}
const STAGE_DOT: Record<string, string> = {
  interview: 'bg-green-500', applied: 'bg-blue-400',
  offer: 'bg-purple-500', rejected: 'bg-gray-300',
}

function StageBadge({ stage }: { stage: string }) {
  const style = STAGE_STYLE[stage] || 'bg-gray-100 text-gray-500 border-gray-200'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${style}`}>
      {stage}
    </span>
  )
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ company: '', role: '', url: '', stage: 'applied', note: '' })

  async function load() {
    setLoading(true)
    const res = await fetch('/api/jobs')
    setJobs(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/jobs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, applied_at: new Date().toISOString() }),
    })
    setForm({ company: '', role: '', url: '', stage: 'applied', note: '' })
    setAdding(false)
    load()
  }

  async function handleStage(id: string, stage: string) {
    await fetch('/api/jobs', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stage }),
    })
    setJobs(prev => prev.map(j => j.id === id ? { ...j, stage } : j))
  }

  async function handleDelete(id: string) {
    await fetch('/api/jobs', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  const counts = jobs.reduce((acc, j) => {
    acc[j.stage] = (acc[j.stage] || 0) + 1; return acc
  }, {} as Record<string, number>)

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.stage === filter)
  const sorted = [...filtered].sort((a, b) => {
    const order = { interview: 0, offer: 1, applied: 2, rejected: 3 }
    return (order[a.stage as keyof typeof order] ?? 9) - (order[b.stage as keyof typeof order] ?? 9)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-6">
        <span className="font-black text-lg">⚡ 个人面板</span>
        <div className="flex gap-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-black">首页</Link>
          <Link href="/hardwork" className="hover:text-black">苦功夫</Link>
          <span className="font-medium text-black">求职</span>
          <Link href="/coding" className="hover:text-black">刷题</Link>
          <Link href="/health" className="hover:text-black">健康</Link>
          <Link href="/sculpt" className="hover:text-black">塑型</Link>
          <Link href="/library" className="hover:text-black">图书馆</Link>
          <Link href="/profile" className="hover:text-black">档案</Link>
        </div>
        <button onClick={() => setAdding(x => !x)}
          className="ml-auto text-xs px-3 py-1.5 bg-black text-white rounded-lg">
          {adding ? '取消' : '＋ 新增'}
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '全部', key: 'all', count: jobs.length, color: 'border-gray-200' },
            { label: '面试中', key: 'interview', count: counts.interview || 0, color: 'border-green-300' },
            { label: '已投递', key: 'applied', count: counts.applied || 0, color: 'border-blue-300' },
            { label: '已拒', key: 'rejected', count: counts.rejected || 0, color: 'border-gray-200' },
          ].map(s => (
            <button key={s.key} onClick={() => setFilter(s.key)}
              className={`bg-white rounded-xl border p-3 text-left transition-all ${
                filter === s.key ? `${s.color} ring-1 ring-offset-1 ring-gray-300` : 'border-gray-200 hover:border-gray-300'
              }`}>
              <div className="text-2xl font-black">{s.count}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </button>
          ))}
        </div>

        {/* Add form */}
        {adding && (
          <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
            <div className="text-sm font-bold mb-1">新增投递</div>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                placeholder="公司" required className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" />
              <input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                placeholder="职位" required className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                placeholder="链接（可选）" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" />
              <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black">
                <option value="applied">已投递</option>
                <option value="interview">面试中</option>
                <option value="offer">Offer</option>
                <option value="rejected">已拒</option>
              </select>
            </div>
            <input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="备注（可选）" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" />
            <button type="submit" className="w-full bg-black text-white rounded-lg py-2 text-sm font-bold">添加</button>
          </form>
        )}

        {/* Job list */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-2">{[1,2,3,4,5].map(i=><div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse"/>)}</div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-12 text-gray-300 text-sm">暂无记录</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sorted.map(job => (
                <div key={job.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${STAGE_DOT[job.stage] || 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{job.company}</span>
                      <span className="text-gray-400 text-xs truncate">{job.role}</span>
                    </div>
                    {job.note && <div className="text-xs text-gray-400 truncate">{job.note}</div>}
                  </div>
                  {/* Fixed-width badge column */}
                  <div className="w-20 flex justify-end shrink-0">
                    <StageBadge stage={job.stage} />
                  </div>
                  {/* Hover actions — fixed width so rows stay aligned */}
                  <div className="w-28 flex items-center gap-1 justify-end shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <select
                      value={job.stage}
                      onChange={e => handleStage(job.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-1.5 py-1 focus:outline-none">
                      <option value="applied">applied</option>
                      <option value="interview">interview</option>
                      <option value="offer">offer</option>
                      <option value="rejected">rejected</option>
                    </select>
                    {job.url && (
                      <a href={job.url} target="_blank" className="text-xs text-gray-400 hover:text-black">↗</a>
                    )}
                    <button onClick={() => handleDelete(job.id)}
                      className="text-xs text-gray-300 hover:text-red-400">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
