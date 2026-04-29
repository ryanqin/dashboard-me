'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function JobsSummary() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  useEffect(() => {
    fetch('/api/jobs').then(r => r.json()).then((jobs: {stage: string}[]) => {
      const c: Record<string, number> = {}
      jobs.forEach(j => { c[j.stage] = (c[j.stage] || 0) + 1 })
      setCounts(c)
    })
  }, [])

  const items = [
    { label: '面试中', key: 'interview', color: 'text-green-600' },
    { label: '已投递', key: 'applied', color: 'text-blue-600' },
    { label: '已拒', key: 'rejected', color: 'text-gray-400' },
  ]

  return (
    <Link href="/jobs" className="block bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="text-xs font-medium text-gray-400 mb-3">求职</div>
      <div className="flex gap-6">
        {items.map(item => (
          <div key={item.key}>
            <div className={`text-2xl font-black ${item.color}`}>{counts[item.key] ?? 0}</div>
            <div className="text-xs text-gray-400 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
    </Link>
  )
}
