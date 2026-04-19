'use client'

import { useContext } from 'react'
import { UIContext, type UIModeContextType } from '@/lib/context/UIContextProvider'

export function useUIMode(): UIModeContextType {
  const context = useContext(UIContext)

  if (!context) {
    throw new Error('useUIMode must be used within UIContextProvider')
  }

  return context
}
