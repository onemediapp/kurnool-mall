import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { StorageAdapter } from './types'

export type ActiveTab = 'shop' | 'service'
export type Language = 'en' | 'te'

export interface AppState {
  activeTab: ActiveTab
  language: Language
  setActiveTab: (tab: ActiveTab) => void
  setLanguage: (lang: Language) => void
  t: (en: string, te: string) => string
}

export interface CreateAppStoreOptions {
  storage: StorageAdapter
  name?: string
}

export function createAppStore({
  storage,
  name = 'kurnool-mall-app',
}: CreateAppStoreOptions) {
  return create<AppState>()(
    persist(
      (set, get) => ({
        activeTab: 'shop',
        language: 'en',
        setActiveTab: (activeTab) => set({ activeTab }),
        setLanguage: (language) => set({ language }),
        t: (en, te) => (get().language === 'te' ? te : en),
      }),
      {
        name,
        storage: createJSONStorage(() => storage),
        partialize: (s) => ({ language: s.language, activeTab: s.activeTab }),
      }
    )
  )
}

export type AppStore = ReturnType<typeof createAppStore>
