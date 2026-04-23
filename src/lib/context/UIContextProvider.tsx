'use client'

import { createContext, useState, useEffect, ReactNode } from 'react'

export type UIMode = 'shopping' | 'services'
export type Language = 'en' | 'te'

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

export const UIContext = createContext<UIModeContextType | null>(null)

interface UIContextProviderProps {
  children: ReactNode
  defaultMode?: UIMode
}

export function UIContextProvider({
  children,
  defaultMode = 'shopping',
}: UIContextProviderProps) {
  const [mode, setModeState] = useState<UIMode>(defaultMode)
  const [language, setLanguageState] = useState<Language>('en')
  const [preferences, setPreferencesState] = useState<UIPreferences>({
    lastMode: defaultMode,
    defaultMode,
    rememberMode: true,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('uiPreferences')
      const storedMode = localStorage.getItem('uiMode')
      const storedLanguage = localStorage.getItem('uiLanguage')

      if (stored && preferences.rememberMode) {
        const prefs = JSON.parse(stored) as UIPreferences
        setPreferencesState(prefs)

        if (storedMode) {
          setModeState(storedMode as UIMode)
        }
      }

      if (storedLanguage === 'en' || storedLanguage === 'te') {
        setLanguageState(storedLanguage)
      }
    } catch (error) {
      console.warn('Failed to load UI preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save mode to localStorage
  const setMode = (newMode: UIMode) => {
    setModeState(newMode)

    try {
      localStorage.setItem('uiMode', newMode)

      const updatedPrefs = { ...preferences, lastMode: newMode }
      setPreferencesState(updatedPrefs)
      localStorage.setItem('uiPreferences', JSON.stringify(updatedPrefs))
    } catch (error) {
      console.warn('Failed to save UI preference:', error)
    }
  }

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem('uiLanguage', lang)
    } catch (error) {
      console.warn('Failed to save language:', error)
    }
  }

  const t = (en: string, te: string): string => (language === 'te' ? te : en)

  const handleSetPreferences = (newPrefs: UIPreferences) => {
    setPreferencesState(newPrefs)
    try {
      localStorage.setItem('uiPreferences', JSON.stringify(newPrefs))
    } catch (error) {
      console.warn('Failed to save preferences:', error)
    }
  }

  return (
    <UIContext.Provider
      value={{
        mode,
        setMode,
        preferences,
        setPreferences: handleSetPreferences,
        isLoading,
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </UIContext.Provider>
  )
}
