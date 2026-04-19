'use client'

import { useUIMode } from '@/lib/hooks/use-ui-mode'
import { motion } from 'framer-motion'
import { Search, MapPin } from 'lucide-react'
import Link from 'next/link'
import { NotificationBell } from '@/components/shared'
import { cn } from '@/lib/utils'

export function ModeToggleHeader() {
  const { mode, setMode } = useUIMode()

  const tabs = [
    { id: 'shopping' as const, label: '🛍️ Shopping' },
    { id: 'services' as const, label: '🔧 Services' },
  ]

  const searchPlaceholder =
    mode === 'shopping'
      ? 'Search products, shops...'
      : 'Search services, providers...'

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-50">
      {/* Top header with location and notification */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-extrabold text-[#1A56DB]">Kurnool Mall</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">Kurnool, Andhra Pradesh</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex gap-1 mb-3 relative bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={cn(
                'flex-1 py-2 px-3 rounded-md font-medium text-sm transition-colors z-10 relative',
                mode === tab.id
                  ? 'text-[#1A56DB]'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {tab.label}
            </button>
          ))}

          {/* Active indicator background */}
          <motion.div
            layoutId="tabBg"
            className="absolute inset-y-1 bg-white rounded-md shadow-sm"
            animate={{
              left: mode === 'shopping' ? '4px' : 'calc(50% + 4px)',
              right: mode === 'shopping' ? 'calc(50% + 2px)' : '4px',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ pointerEvents: 'none' }}
          />
        </div>

        {/* Search Bar */}
        <Link
          href="/search"
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-xl px-4 py-2.5 transition-colors"
        >
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-400 flex-1">{searchPlaceholder}</span>
          <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-gray-400">
            📋
          </div>
        </Link>
      </div>

      {/* Mode-specific filter pills */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {mode === 'shopping' ? (
          <>
            <FilterPill icon="🏷️" label="Offers" />
            <FilterPill icon="🌟" label="New" />
            <FilterPill icon="⭐" label="Best Sellers" />
            <FilterPill icon="🔥" label="Trending" />
          </>
        ) : (
          <>
            <FilterPill icon="🏠" label="Home" />
            <FilterPill icon="💍" label="Events" />
            <FilterPill icon="🔌" label="Electrical" />
            <FilterPill icon="🚗" label="Automotive" />
          </>
        )}
      </div>
    </header>
  )
}

function FilterPill({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors whitespace-nowrap">
      {icon} {label}
    </button>
  )
}
