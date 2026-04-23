'use client'

import { createUseRealtimeOrders } from '@kurnool-mall/shared-hooks'
import { createClient } from '@kurnool-mall/supabase-client/browser'

export const useRealtimeOrders = createUseRealtimeOrders({
  getSupabase: () => createClient(),
})
