import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { StorageAdapter } from './types'

export interface WishlistState {
  productIds: string[]
  toggle: (productId: string) => void
  isWishlisted: (productId: string) => boolean
  sync: () => Promise<void>
}

export interface CreateWishlistStoreOptions {
  storage: StorageAdapter
  /** Resolver returning the current SupabaseClient (late-bound so the store can
   *  be created before the client is ready). */
  getSupabase: () => SupabaseClient
  /** Edge Functions base URL, e.g. https://xxxx.supabase.co/functions/v1 */
  apiUrl: string
  name?: string
}

export function createWishlistStore({
  storage,
  getSupabase,
  apiUrl,
  name = 'km-wishlist',
}: CreateWishlistStoreOptions) {
  return create<WishlistState>()(
    persist(
      (set, get) => ({
        productIds: [],

        toggle(productId: string) {
          const current = get().productIds
          const exists = current.includes(productId)

          set({
            productIds: exists
              ? current.filter((id) => id !== productId)
              : [...current, productId],
          })

          const supabase = getSupabase()
          supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session) return
            await fetch(`${apiUrl}/toggle-wishlist`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ product_id: productId }),
            }).catch(() => {
              set({ productIds: current })
            })
          })
        },

        isWishlisted(productId: string) {
          return get().productIds.includes(productId)
        },

        async sync() {
          const supabase = getSupabase()
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const { data } = await supabase
            .from('wishlists')
            .select('product_id')
            .eq('user_id', user.id)

          if (data) {
            const serverIds = (data as Array<{ product_id: string }>).map(
              (r) => r.product_id
            )
            const localIds = get().productIds
            const merged = Array.from(new Set([...serverIds, ...localIds]))
            set({ productIds: merged })
          }
        },
      }),
      {
        name,
        version: 1,
        storage: createJSONStorage(() => storage),
      }
    )
  )
}

export type WishlistStore = ReturnType<typeof createWishlistStore>
