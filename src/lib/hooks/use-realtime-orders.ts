'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/lib/types'

interface UseRealtimeOrdersOptions {
  vendorId: string | null
  onNewOrder?: (order: Order) => void
}

export function useRealtimeOrders({ vendorId, onNewOrder }: UseRealtimeOrdersOptions) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!vendorId) return

    const supabase = createClient()
    const channelName = `vendor-orders-${vendorId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          onNewOrder?.(payload.new as Order)
        },
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [vendorId, onNewOrder])

  return { isConnected }
}
