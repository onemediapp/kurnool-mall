'use client'

import { createContext, useState, useEffect, ReactNode } from 'react'

export type UIMode = 'shopping' | 'services'

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

      if (stored && preferences.rememberMode) {
        const prefs = JSON.parse(stored) as UIPreferences
        setPreferencesState(prefs)

        if (storedMode) {
          setModeState(storedMode as UIMode)
        }
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
      }}
    >
      {children}
    </UIContext.Provider>
  )
}
