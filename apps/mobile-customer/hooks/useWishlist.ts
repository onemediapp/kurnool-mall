import { createWishlistStore } from '@kurnool-mall/shared-hooks'
import { asyncStorageAdapter } from '@/lib/async-storage-adapter'
import { supabase } from '@/lib/supabase'

export const useWishlist = createWishlistStore({
  storage: asyncStorageAdapter,
  getSupabase: () => supabase,
  apiUrl: process.env.EXPO_PUBLIC_API_URL!,
})
