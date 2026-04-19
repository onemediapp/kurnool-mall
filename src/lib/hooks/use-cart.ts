'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/lib/types'

interface CartState {
  items: CartItem[]
  vendor_id: string | null

  addItem: (item: CartItem) => { success: boolean; message?: string }
  removeItem: (product_id: string) => void
  updateQuantity: (product_id: string, qty: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      vendor_id: null,

      addItem: (item: CartItem) => {
        const state = get()

        // Enforce single-vendor cart
        if (state.vendor_id && state.vendor_id !== item.vendor_id && state.items.length > 0) {
          return {
            success: false,
            message: 'Cart has items from another shop. Clear cart to continue.',
          }
        }

        const existing = state.items.find((i) => i.product_id === item.product_id)

        if (existing) {
          // Increment quantity, capped at max_qty
          const newQty = Math.min(existing.quantity + item.quantity, item.max_qty)
          set({
            items: state.items.map((i) =>
              i.product_id === item.product_id ? { ...i, quantity: newQty } : i
            ),
          })
        } else {
          set({
            items: [...state.items, { ...item, quantity: Math.min(item.quantity, item.max_qty) }],
            vendor_id: item.vendor_id,
          })
        }

        return { success: true }
      },

      removeItem: (product_id: string) => {
        const state = get()
        const newItems = state.items.filter((i) => i.product_id !== product_id)
        set({
          items: newItems,
          vendor_id: newItems.length === 0 ? null : state.vendor_id,
        })
      },

      updateQuantity: (product_id: string, qty: number) => {
        if (qty <= 0) {
          get().removeItem(product_id)
          return
        }
        const state = get()
        set({
          items: state.items.map((i) =>
            i.product_id === product_id
              ? { ...i, quantity: Math.min(qty, i.max_qty) }
              : i
          ),
        })
      },

      clearCart: () => {
        set({ items: [], vendor_id: null })
      },

      totalItems: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      totalPrice: () => {
        return get().items.reduce((sum, i) => sum + i.price_selling * i.quantity, 0)
      },
    }),
    {
      name: 'kurnool-mall-cart',
    }
  )
)
