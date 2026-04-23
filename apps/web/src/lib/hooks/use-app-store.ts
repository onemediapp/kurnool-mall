'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ActiveTab = 'shop' | 'service'
export type Language = 'en' | 'te'

interface AppState {
  activeTab: ActiveTab
  language: Language
  setActiveTab: (tab: ActiveTab) => void
  setLanguage: (lang: Language) => void
  t: (en: string, te: string) => string
}

const isBrowser = typeof window !== 'undefined'

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeTab: 'shop',
      language: 'en',
      setActiveTab: (activeTab) => set({ activeTab }),
      setLanguage: (language) => set({ language }),
      t: (en, te) => (get().language === 'te' ? te : en),
    }),
    {
      name: 'kurnool-mall-app',
      storage: createJSONStorage(() =>
        isBrowser ? window.sessionStorage : (undefined as unknown as Storage)
      ),
      partialize: (s) => ({ language: s.language, activeTab: s.activeTab }),
    }
  )
)
