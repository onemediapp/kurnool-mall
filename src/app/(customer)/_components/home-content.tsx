'use client'

import { useUIMode } from '@/lib/hooks/use-ui-mode'
import dynamic from 'next/dynamic'
import { useEffect, useState, Suspense } from 'react'

const ShoppingHomeContent = dynamic(() => import('./shopping-home-content'), {
  ssr: true,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 rounded-full border-2 border-[#1A56DB] border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-600">Loading shopping...</p>
      </div>
    </div>
  ),
})

const ServicesHomeContent = dynamic(() => import('./services-home-content'), {
  ssr: true,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 rounded-full border-2 border-[#1A56DB] border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-600">Loading services...</p>
      </div>
    </div>
  ),
})

export function HomeContent() {
  const { mode, isLoading } = useUIMode()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-2 border-[#1A56DB] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {mode === 'shopping' && <ShoppingHomeContent />}
      {mode === 'services' && <ServicesHomeContent />}
    </>
  )
}
