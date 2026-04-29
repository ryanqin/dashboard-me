'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Problem {
  id: number
  title: string
  status: 'todo' | 'in_progress' | 'done'
  score: number | null
  note: string | null
  updated_at: string
}

const STATUS_STYLE = {
  todo:        'bg-gray-100 text-gray-400 border-gray-200',
  in_progress: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  done:        'bg-green-50 text-green-700 border-green-200',
}

const STATUS_LABEL = {
  todo: '未开始',
  in_progress: '进行中',
  done: '已完成',
}

const STATUS_CYCLE: Record<string, string> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
}

function StatusBadge({ status }: { status: Problem['status'] }) {
  const style = STATUS_STYLE[status]
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${style}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}

export default function CodingPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<{ id: number; field: 'score' | 'note' } | null>(null)
  const [editValue, setEditValue] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/coding')
    setProblems(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleStatusClick(id: number, current: string) {
    const next = STATUS_CYCLE[current] || 'todo'
    await fetch('/api/coding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    })
    setProblems(prev => prev.map(p => p.id === id ? { ...p, status: next as Problem['status'] } : p))
  }

  function handleEditStart(id: number, field: 'score' | 'note', current: number | string | null) {
    setEditing({ id, field })
    setEditValue(current?.toString() || '')
  }

  async function handleEditSave() {
    if (!editing) return
    const { id, field } = editing
    const value = field === 'score' ? (editValue ? parseInt(editValue) : null) : editValue || null
    await fetch('/api/coding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: value }),
    })
    setProblems(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    setEditing(null)
    setEditValue('')
  }

  function handleEditCancel() {
    setEditing(null)
    setEditValue('')
  }

  const completed = problems.filter(p => p.status === 'done').length
  const avgScore = (() => {
    const scored = problems.filter(p => p.score !== null && p.status === 'done')
    if (scored.length === 0) return 0
    return Math.round(scored.reduce((s, p) => s + (p.score || 0), 0) / scored.length)
  })()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-6">
        <span className="font-black text-lg">⚡ 个人面板</span>
        <div className="flex gap-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-black">首页</Link>
          <Link href="/hardwork" className="hover:text-black">苦功夫</Link>
          <Link href="/jobs" className="hover:text-black">求职</Link>
          <span className="font-medium text-black">刷题</span>
          <Link href="/health" className="hover:text-black">健康</Link>
          <Link href="/sculpt" className="hover:text-black">塑型</Link>
          <Link href="/library" className="hover:text-black">图书馆</Link>
          <Link href="/profile" className="hover:text-black">档案</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-3xl font-black leading-none">
                {completed}<span className="text-lg text-gray-300 font-normal">/12</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">已完成</div>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div>
              <div className="text-3xl font-black leading-none">{avgScore}</div>
              <div className="text-xs text-gray-400 mt-1">平均分</div>
            </div>
            <div className="flex-1" />
            <a
              href="https://github.com/your-username/coding-practice"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-black transition-colors"
            >
              题库 ↗
            </a>
          </div>
        </div>

        {/* Problems table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-2">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium w-12">#</th>
                  <th className="px-4 py-3 font-medium">题目</th>
                  <th className="px-4 py-3 font-medium w-24">状态</th>
                  <th className="px-4 py-3 font-medium w-20">分数</th>
                  <th className="px-4 py-3 font-medium">备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {problems.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-400">{p.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{p.title}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleStatusClick(p.id, p.status)}
                        className="cursor-pointer"
                      >
                        <StatusBadge status={p.status} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editing?.id === p.id && editing.field === 'score' ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={handleEditSave}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleEditSave()
                            if (e.key === 'Escape') handleEditCancel()
                          }}
                          min={0}
                          max={100}
                          autoFocus
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-black"
                        />
                      ) : (
                        <div
                          onClick={() => handleEditStart(p.id, 'score', p.score)}
                          className="cursor-text hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1"
                        >
                          {p.score !== null ? (
                            <span className="font-medium">{p.score}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editing?.id === p.id && editing.field === 'note' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={handleEditSave}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleEditSave()
                            if (e.key === 'Escape') handleEditCancel()
                          }}
                          autoFocus
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-black"
                        />
                      ) : (
                        <div
                          onClick={() => handleEditStart(p.id, 'note', p.note)}
                          className="cursor-text hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1 truncate"
                        >
                          {p.note ? (
                            <span className="text-gray-600">{p.note}</span>
                          ) : (
                            <span className="text-gray-300">点击添加备注</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}
