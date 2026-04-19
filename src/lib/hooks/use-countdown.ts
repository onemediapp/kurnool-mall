'use client'

import { useEffect, useState } from 'react'
import { getCountdown } from '@/lib/utils'

export function useCountdown(endsAt: string) {
  const [time, setTime] = useState(() => getCountdown(endsAt))

  useEffect(() => {
    if (time.expired) return
    const interval = setInterval(() => {
      const next = getCountdown(endsAt)
      setTime(next)
      if (next.expired) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [endsAt, time.expired])

  return time
}
