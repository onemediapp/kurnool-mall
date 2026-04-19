# Dual UI Implementation - Code Templates & Starters

## 1. UIMode Context & Provider

### File: `src/lib/context/UIContextProvider.tsx`
```typescript
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
  const [preferences, setPreferences] = useState<UIPreferences>({
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
        setPreferences(prefs)
        
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
      setPreferences(updatedPrefs)
      localStorage.setItem('uiPreferences', JSON.stringify(updatedPrefs))
    } catch (error) {
      console.warn('Failed to save UI preference:', error)
    }
  }

  const handleSetPreferences = (newPrefs: UIPreferences) => {
    setPreferences(newPrefs)
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
```

### File: `src/lib/hooks/use-ui-mode.ts`
```typescript
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
```

---

## 2. Mode Toggle Header Component

### File: `src/components/shared/mode-toggle-header.tsx`
```typescript
'use client'

import { useUIMode } from '@/lib/hooks/use-ui-mode'
import { motion } from 'framer-motion'
import { Search, MapPin, Bell } from 'lucide-react'
import Link from 'next/link'
import { NotificationBell } from '@/components/shared'
import { cn } from '@/lib/utils'

export function ModeToggleHeader() {
  const { mode, setMode } = useUIMode()

  const tabs = [
    { id: 'shopping', label: '🛍️ Shopping' },
    { id: 'services', label: '🔧 Services' },
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
              onClick={() => setMode(tab.id as 'shopping' | 'services')}
              className={cn(
                'flex-1 py-2 px-3 rounded-md font-medium text-sm transition-colors z-10',
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
```

---

## 3. Context-Aware Bottom Navigation

### File: `src/components/customer/bottom-nav-dual.tsx`
```typescript
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  Wrench,
  Calendar,
  ClipboardList,
  User,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/lib/hooks/use-cart'
import { useUIMode } from '@/lib/hooks/use-ui-mode'

const shoppingNavItems = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/shopping', label: 'Shop', icon: ShoppingBag, exact: false },
  { href: '/cart', label: 'Cart', icon: ShoppingCart, exact: false },
  { href: '/orders', label: 'Orders', icon: ClipboardList, exact: false },
  { href: '/account', label: 'Account', icon: User, exact: false },
]

const servicesNavItems = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/services', label: 'Services', icon: Wrench, exact: false },
  { href: '/services/bookings', label: 'Bookings', icon: Calendar, exact: false },
  { href: '/orders', label: 'Orders', icon: ClipboardList, exact: false },
  { href: '/account', label: 'Account', icon: User, exact: false },
]

export function ContextAwareBottomNav() {
  const pathname = usePathname()
  const { mode } = useUIMode()
  const totalItems = useCartStore((s) => s.totalItems?.() || 0)
  const [mounted, setMounted] = useState(false)
  const [prevCount, setPrevCount] = useState(0)
  const [cartBounce, setCartBounce] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (totalItems > prevCount) {
      setCartBounce(true)
      const t = setTimeout(() => setCartBounce(false), 600)
      return () => clearTimeout(t)
    }
    setPrevCount(totalItems)
  }, [totalItems, prevCount, mounted])

  function isActive(href: string, exact: boolean): boolean {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const navItems = mode === 'shopping' ? shoppingNavItems : servicesNavItems

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-md border-t border-gray-100 z-40"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -1px 0 rgba(0,0,0,0.06), 0 -4px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          const isCart = href === '/cart'

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors relative',
                active ? 'text-[#1A56DB]' : 'text-gray-500 hover:text-gray-700'
              )}
              aria-label={label}
            >
              <motion.div
                className="relative"
                animate={active ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <motion.div
                  animate={isCart && cartBounce ? { y: [0, -4, 0] } : { y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>

                {/* Cart badge */}
                {isCart && mounted && totalItems > 0 && (
                  <AnimatePresence>
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                      className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none"
                    >
                      {totalItems > 9 ? '9+' : totalItems}
                    </motion.span>
                  </AnimatePresence>
                )}
              </motion.div>

              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  active ? 'text-[#1A56DB]' : ''
                )}
              >
                {label}
              </span>

              {/* Active indicator dot */}
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 h-0.5 w-8 bg-[#1A56DB] rounded-full"
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

---

## 4. Updated Customer Layout

### File: `src/app/(customer)/layout.tsx` (MODIFIED)
```typescript
import { UIContextProvider } from '@/lib/context/UIContextProvider'
import { ContextAwareBottomNav } from '@/components/customer/bottom-nav-dual'
import { FloatingCartPill } from '@/components/shared'
import { Toaster } from '@/components/shared/toast'
import { ModeToggleHeader } from '@/components/shared/mode-toggle-header'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UIContextProvider defaultMode="shopping">
      <div className="mobile-frame relative">
        <ModeToggleHeader />
        
        <main className="pb-20">{children}</main>
        
        <FloatingCartPill />
        <ContextAwareBottomNav />
        <Toaster />
      </div>
    </UIContextProvider>
  )
}
```

---

## 5. Enhanced Home Page (Dual Mode)

### File: `src/app/(customer)/page.tsx` (MODIFY - Add at top)
```typescript
'use client'

import { useUIMode } from '@/lib/hooks/use-ui-mode'
import { useState, useEffect } from 'react'

// ... existing imports ...

export default async function HomePage() {
  // Existing code...
  
  // At the end of the JSX, before the main content div:
  const ShoppingModeContent = () => (
    <>
      {/* Existing carousel, categories, flash sales, products, vendors */}
      {/* ... */}
    </>
  )

  const ServicesModeContent = () => (
    <>
      {/* Service categories carousel */}
      {/* Featured providers */}
      {/* Popular packages */}
      {/* Event halls section */}
      {/* ... */}
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Existing header content */}

      {/* Delivery Promise Strip */}
      <div className="flex items-center justify-center gap-5 bg-[#1A56DB] px-4 py-2">
        {/* ... existing code ... */}
      </div>

      {/* Mode-specific content */}
      {/* This component should be client-side to use useUIMode */}
      <ModeSwitcher shoppingContent={<ShoppingModeContent />} servicesContent={<ServicesModeContent />} />
    </div>
  )
}

// Client component for mode switching
function ModeSwitcher({
  shoppingContent,
  servicesContent,
}: {
  shoppingContent: React.ReactNode
  servicesContent: React.ReactNode
}) {
  const { mode } = useUIMode()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return mode === 'shopping' ? shoppingContent : servicesContent
}
```

---

## 6. Mode-Aware Search Component (Starter)

### File: `src/components/shared/mode-aware-search.tsx`
```typescript
'use client'

import { useUIMode } from '@/lib/hooks/use-ui-mode'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

export function ModeAwareSearch() {
  const { mode } = useUIMode()
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) return

    // Route based on mode
    const searchUrl = mode === 'shopping' 
      ? `/search?q=${encodeURIComponent(query)}&mode=shopping`
      : `/search?q=${encodeURIComponent(query)}&mode=services`

    router.push(searchUrl)
  }

  const placeholder =
    mode === 'shopping'
      ? 'Search products, shops...'
      : 'Search services, providers...'

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-blue-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-12 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <Search className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </form>
  )
}
```

---

## 7. Implementation Checklist

```typescript
// Before you start, ensure these are in place:

// ✅ Step 1: Create the context files
- src/lib/context/UIContextProvider.tsx
- src/lib/hooks/use-ui-mode.ts

// ✅ Step 2: Create the header component
- src/components/shared/mode-toggle-header.tsx

// ✅ Step 3: Create the nav component
- src/components/customer/bottom-nav-dual.tsx

// ✅ Step 4: Update the layout
- src/app/(customer)/layout.tsx (wrap with UIContextProvider)

// ✅ Step 5: Update home page
- src/app/(customer)/page.tsx (use ModeToggleHeader)

// ✅ Step 6: Create search component
- src/components/shared/mode-aware-search.tsx

// ✅ Step 7: Test mode switching
- Verify localStorage persistence
- Test navigation updates
- Test cart/bookings separation

// ✅ Step 8: Mobile testing
- Test on various screen sizes
- Test safe area handling
- Test touch interactions

// ✅ Step 9: Performance check
- Verify no console errors
- Check bundle size increase
- Profile render performance

// ✅ Step 10: Deploy
- Merge to main
- Deploy to Vercel
- Monitor analytics
```

---

## 8. Environment Variables (Optional)

```bash
# .env.local
NEXT_PUBLIC_DEFAULT_UI_MODE=shopping
NEXT_PUBLIC_ENABLE_MODE_PERSISTENCE=true
```

---

## 9. Key Implementation Notes

```typescript
// 1. Always use useUIMode hook, not direct context access
// ✅ Good:
const { mode, setMode } = useUIMode()

// ❌ Bad:
const context = useContext(UIContext)

// 2. Memoize mode-dependent components
import { useMemo } from 'react'
useMemo(() => mode === 'shopping' ? <ShoppingUI /> : <ServicesUI />, [mode])

// 3. Handle loading state
const { isLoading } = useUIMode()
if (isLoading) return <Skeleton />

// 4. Persist user preference
// Already handled in UIContextProvider

// 5. Test mode switching
useEffect(() => {
  // Log mode changes for debugging
  console.log('Mode changed to:', mode)
}, [mode])
```

---

**These templates provide the foundation for implementing the Dual UI feature. Start with Step 1 and follow the checklist in order.**

For detailed instructions, see: `DUAL_UI_IMPLEMENTATION_PLAN.md`
For architecture details, see: `DUAL_UI_ARCHITECTURE.md`
