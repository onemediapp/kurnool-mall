'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'

interface WishlistState {
  productIds: string[]
  toggle: (productId: string) => void
  isWishlisted: (productId: string) => boolean
  sync: () => Promise<void>
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],

      toggle(productId: string) {
        const current = get().productIds
        const exists = current.includes(productId)

        // Optimistic local update
        set({
          productIds: exists
            ? current.filter((id) => id !== productId)
            : [...current, productId],
        })

        // Async DB sync
        const supabase = createClient()
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (!session) return
          const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/toggle-wishlist`
          await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ product_id: productId }),
          }).catch(() => {
            // Revert on failure
            set({ productIds: current })
          })
        })
      },

      isWishlisted(productId: string) {
        return get().productIds.includes(productId)
      },

      async sync() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('wishlists')
          .select('product_id')
          .eq('user_id', user.id)

        if (data) {
          const serverIds = data.map((r: { product_id: string }) => r.product_id)
          const localIds = get().productIds
          // Merge: union of both
          const merged = Array.from(new Set([...serverIds, ...localIds]))
          set({ productIds: merged })
        }
      },
    }),
    {
      name: 'km-wishlist',
      version: 1,
    },
  ),
)
