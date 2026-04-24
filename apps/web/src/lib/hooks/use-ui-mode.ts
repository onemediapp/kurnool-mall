'use client'

import { useAppStore, type ActiveTab, type Language } from './use-app-store'

export type UIMode = 'shopping' | 'services'
export { type Language }

export interface UIPreferences {
  lastMode: UIMode
  defaultMode: UIMode
  rememberMode: boolean
}

export interface UIModeContextType {
  mode: UIMode
  setMode: (mode: UIMode) => void
  preferences: UIPreferences
  setPreferences: (prefs: UIPreferences) => void
  isLoading: boolean
  language: Language
  setLanguage: (lang: Language) => void
  t: (en: string, te: string) => string
}

const tabToMode = (tab: ActiveTab): UIMode =>
  tab === 'service' ? 'services' : 'shopping'
const modeToTab = (mode: UIMode): ActiveTab =>
  mode === 'services' ? 'service' : 'shop'

export function useUIMode(): UIModeContextType {
  const activeTab = useAppStore((s) => s.activeTab)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const t = useAppStore((s) => s.t)

  const mode = tabToMode(activeTab)
  const setMode = (m: UIMode) => setActiveTab(modeToTab(m))

  const preferences: UIPreferences = {
    lastMode: mode,
    defaultMode: 'shopping',
    rememberMode: true,
  }

  const setPreferences = (prefs: UIPreferences) => {
    if (prefs.lastMode !== mode) setMode(prefs.lastMode)
  }

  return {
    mode,
    setMode,
    preferences,
    setPreferences,
    isLoading: false,
    language,
    setLanguage,
    t,
  }
}
