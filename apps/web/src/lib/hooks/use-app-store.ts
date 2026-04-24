'use client'

import { createAppStore } from '@kurnool-mall/shared-hooks'
export type { ActiveTab, Language } from '@kurnool-mall/shared-hooks'

const ssrSafeStorage: Storage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  length: 0,
}

// Web uses sessionStorage (matches prior behavior). Mobile constructs its own
// useAppStore with AsyncStorage.
export const useAppStore = createAppStore({
  storage: typeof window !== 'undefined' ? window.sessionStorage : ssrSafeStorage,
})
