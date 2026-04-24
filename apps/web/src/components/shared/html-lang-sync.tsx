'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/hooks/use-app-store'

export function HtmlLangSync() {
  const language = useAppStore((s) => s.language)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
    }
  }, [language])
  return null
}
