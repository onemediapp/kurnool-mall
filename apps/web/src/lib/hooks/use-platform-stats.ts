'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import type { PlatformStats } from '@kurnool-mall/shared-types'

const POLL_INTERVAL = 30_000 // 30 seconds

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  async function fetchStats() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_platform_stats')
      if (!error && data) {
        setStats(data as PlatformStats)
        setLastUpdated(new Date())
      }
    } catch {
      // Silently fail — show stale data
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  return { stats, isLoading, lastUpdated }
}
