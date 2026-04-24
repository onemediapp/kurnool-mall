import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Order } from '@kurnool-mall/shared-types'

export interface UseRealtimeOrdersOptions {
  vendorId: string | null
  onNewOrder?: (order: Order) => void
}

export interface CreateRealtimeOrdersOptions {
  /** Late-bound supabase resolver so the hook can be created before the
   *  client is ready (matches Expo app init order). */
  getSupabase: () => SupabaseClient
}

export function createUseRealtimeOrders({ getSupabase }: CreateRealtimeOrdersOptions) {
  return function useRealtimeOrders({
    vendorId,
    onNewOrder,
  }: UseRealtimeOrdersOptions) {
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
      if (!vendorId) return

      const supabase = getSupabase()
      const channel = supabase
        .channel(`vendor-orders-${vendorId}`)
        .on(
          'postgres_changes' as never,
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `vendor_id=eq.${vendorId}`,
          },
          (payload: { new: Order }) => {
            onNewOrder?.(payload.new)
          }
        )
        .subscribe((status: string) => {
          setIsConnected(status === 'SUBSCRIBED')
        })

      return () => {
        supabase.removeChannel(channel)
      }
    }, [vendorId, onNewOrder])

    return { isConnected }
  }
}
