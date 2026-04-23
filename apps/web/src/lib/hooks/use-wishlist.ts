'use client'

import { createWishlistStore } from '@kurnool-mall/shared-hooks'
import { createClient } from '@kurnool-mall/supabase-client/browser'

const ssrSafeStorage: Storage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  length: 0,
}

export const useWishlistStore = createWishlistStore({
  storage: typeof window !== 'undefined' ? window.localStorage : ssrSafeStorage,
  getSupabase: () => createClient(),
  apiUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`,
})
