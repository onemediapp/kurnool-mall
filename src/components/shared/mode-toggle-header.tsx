'use client'

import { useUIMode } from '@/lib/hooks/use-ui-mode'
import { motion } from 'framer-motion'
import { Search, MapPin, ChevronDown, Mic, ShoppingBag, Wrench } from 'lucide-react'
import Link from 'next/link'
import { NotificationBell } from '@/components/shared'
import { cn } from '@/lib/utils'

export function ModeToggleHeader() {
  const { mode, setMode } = useUIMode()

  const tabs = [
    { id: 'shopping' as const, label: 'Shopping', icon: ShoppingBag, emoji: '🛍️' },
    { id: 'services' as const, label: 'Services', icon: Wrench, emoji: '🔧' },
  ]

  const searchPlaceholder =
    mode === 'shopping'
      ? 'Search "organic vegetables"'
      : 'Search "AC servicing"'

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-gray-100/80">
      {/* ── Top row: Location + Notifications ─── */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/account/addresses"
            className="flex items-center gap-2 flex-1 min-w-0 group active:scale-[0.98] transition-transform"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(79,70,229,0.25)]">
              <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-wide">
                  Delivering in 15 min
                </span>
              </div>
              <div className="flex items-center gap-0.5 -mt-0.5">
                <span className="text-sm font-bold text-gray-900 truncate">
                  Kurnool, Andhra Pradesh
                </span>
                <ChevronDown className="h-4 w-4 text-gray-700 flex-shrink-0" strokeWidth={2.5} />
              </div>
            </div>
          </Link>
          <NotificationBell />
        </div>
      </div>

      {/* ── Mode Toggle (snappy pill transition) ─── */}
      <div className="px-4 pb-2.5">
        <div className="relative flex gap-1 bg-gray-100/80 rounded-xl p-1">
          {tabs.map((tab) => {
            const active = mode === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-semibold text-sm transition-colors z-10 relative active:scale-[0.97]',
                  active ? 'text-brand-600' : 'text-gray-500',
                )}
              >
                <span className="text-base leading-none">{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
          <motion.div
            className="absolute inset-y-1 bg-white rounded-lg shadow-[0_2px_8px_rgba(16,24,40,0.08)]"
            initial={false}
            animate={{
              left: mode === 'shopping' ? '0.25rem' : '50%',
              right: mode === 'shopping' ? '50%' : '0.25rem',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.6 }}
            style={{ pointerEvents: 'none' }}
          />
        </div>
      </div>

      {/* ── Search Bar (iOS-style premium) ─── */}
      <div className="px-4 pb-3">
        <Link
          href="/search"
          className="group flex items-center gap-2.5 bg-white border border-gray-200 hover:border-brand-300 rounded-2xl px-4 py-3 transition-all active:scale-[0.99] shadow-soft"
        >
          <Search className="h-4 w-4 text-brand-500 flex-shrink-0" strokeWidth={2.5} />
          <span className="text-sm text-gray-500 flex-1 truncate">{searchPlaceholder}</span>
          <div className="h-6 w-px bg-gray-200" />
          <Mic className="h-4 w-4 text-brand-500 flex-shrink-0" strokeWidth={2.5} />
        </Link>
      </div>

      {/* ── Mode-specific filter pills (horizontal scroll) ─── */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {mode === 'shopping' ? (
          <>
            <FilterPill icon="🏷️" label="Offers" tone="rose" />
            <FilterPill icon="🌟" label="New" tone="brand" />
            <FilterPill icon="⭐" label="Best Sellers" tone="amber" />
            <FilterPill icon="🔥" label="Trending" tone="rose" />
            <FilterPill icon="🎁" label="Free Delivery" tone="emerald" />
          </>
        ) : (
          <>
            <FilterPill icon="🏠" label="Home" tone="brand" />
            <FilterPill icon="💍" label="Events" tone="rose" />
            <FilterPill icon="🔌" label="Electrical" tone="amber" />
            <FilterPill icon="🚗" label="Automotive" tone="brand" />
            <FilterPill icon="✨" label="Premium" tone="emerald" />
          </>
        )}
      </div>
    </header>
  )
}

function FilterPill({
  icon,
  label,
  tone = 'brand',
}: {
  icon: string
  label: string
  tone?: 'brand' | 'rose' | 'amber' | 'emerald'
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700 hover:bg-brand-100 border-brand-100',
    rose: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-100',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100',
  }
  return (
    <button
      className={cn(
        'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap border active:scale-95',
        tones[tone],
      )}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}
