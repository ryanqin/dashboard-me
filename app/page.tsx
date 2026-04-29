'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tracker, TrackerLog } from './types'
import { getTrackers, getTrackerLogs } from './tracker-lib'
import Nav from './components/dashboard/Nav'
import TodaySummary from './components/dashboard/TodaySummary'
import HardworkSummary from './components/dashboard/HardworkSummary'
import JobsSummary from './components/dashboard/JobsSummary'
import HealthSummary from './components/dashboard/HealthSummary'
import TimeAllocation from './components/dashboard/TimeAllocation'

export default function Dashboard() {
  const [trackers, setTrackers] = useState<Tracker[]>([])
  const [logs, setLogs] = useState<TrackerLog[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [t, l] = await Promise.all([getTrackers(), getTrackerLogs()])
    setTrackers(t); setLogs(l); setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {!loading && <TodaySummary logs={logs} trackers={trackers} />}
        <div className="grid grid-cols-2 gap-4">
          {!loading && <HardworkSummary logs={logs} trackers={trackers} />}
          <JobsSummary />
        </div>
        <HealthSummary />
        {!loading && <TimeAllocation logs={logs} trackers={trackers} />}
      </div>
    </div>
  )
}
