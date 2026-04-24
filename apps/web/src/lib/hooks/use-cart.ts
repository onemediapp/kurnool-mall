'use client'

import { createCartStore } from '@kurnool-mall/shared-hooks'

const ssrSafeStorage: Storage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  length: 0,
}

export const useCartStore = createCartStore({
  storage: typeof window !== 'undefined' ? window.localStorage : ssrSafeStorage,
})
