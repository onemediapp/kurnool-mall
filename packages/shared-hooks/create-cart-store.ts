import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem } from '@kurnool-mall/shared-types'
import type { StorageAdapter } from './types'

export interface CartState {
  items: CartItem[]
  vendor_id: string | null

  addItem: (item: CartItem) => { success: boolean; message?: string }
  removeItem: (product_id: string) => void
  updateQuantity: (product_id: string, qty: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export interface CreateCartStoreOptions {
  /** Platform storage adapter — localStorage, AsyncStorage, etc. */
  storage: StorageAdapter
  /** Persisted key. Defaults to 'kurnool-mall-cart'. */
  name?: string
}

export function createCartStore({
  storage,
  name = 'kurnool-mall-cart',
}: CreateCartStoreOptions) {
  return create<CartState>()(
    persist(
      (set, get) => ({
        items: [],
        vendor_id: null,

        addItem: (item: CartItem) => {
          const state = get()

          if (
            state.vendor_id &&
            state.vendor_id !== item.vendor_id &&
            state.items.length > 0
          ) {
            return {
              success: false,
              message: 'Cart has items from another shop. Clear cart to continue.',
            }
          }

          const existing = state.items.find((i) => i.product_id === item.product_id)

          if (existing) {
            const newQty = Math.min(existing.quantity + item.quantity, item.max_qty)
            set({
              items: state.items.map((i) =>
                i.product_id === item.product_id ? { ...i, quantity: newQty } : i
              ),
            })
          } else {
            set({
              items: [
                ...state.items,
                { ...item, quantity: Math.min(item.quantity, item.max_qty) },
              ],
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

        totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

        totalPrice: () =>
          get().items.reduce((sum, i) => sum + i.price_selling * i.quantity, 0),
      }),
      {
        name,
        storage: createJSONStorage(() => storage),
      }
    )
  )
}

export type CartStore = ReturnType<typeof createCartStore>
