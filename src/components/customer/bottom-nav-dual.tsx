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
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass-strong border-t border-gray-100/80 z-40"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -1px 0 rgba(16,24,40,0.04), 0 -8px 24px rgba(16,24,40,0.06)',
      }}
    >
      <div className="relative flex items-center justify-around h-16 px-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          const isCart = href === '/cart'

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex flex-col items-center justify-center flex-1 h-full gap-1 relative touch-target',
                active ? 'text-brand-600' : 'text-gray-500',
              )}
              aria-label={label}
            >
              {/* ── Floating active indicator (glides between items) ── */}
              {active && (
                <motion.div
                  layoutId="nav-active-bg"
                  className="absolute top-1.5 h-8 w-14 rounded-2xl bg-brand-50"
                  transition={{ type: 'spring', stiffness: 500, damping: 34, mass: 0.6 }}
                />
              )}

              <motion.div
                className="relative z-10"
                whileTap={{ scale: 0.86 }}
                animate={active ? { y: -1 } : { y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              >
                <motion.div
                  animate={isCart && cartBounce ? { y: [0, -5, 0], rotate: [0, -8, 8, 0] } : { y: 0, rotate: 0 }}
                  transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <Icon
                    className={cn('h-[22px] w-[22px] transition-colors', active && 'drop-shadow-[0_2px_4px_rgba(79,70,229,0.25)]')}
                    strokeWidth={active ? 2.5 : 2}
                  />
                </motion.div>

                {/* Cart badge with pop animation */}
                {isCart && mounted && totalItems > 0 && (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0, y: -4 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                      className="absolute -top-2 -right-2.5 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center leading-none ring-2 ring-white shadow-[0_2px_6px_rgba(244,63,94,0.4)]"
                    >
                      {totalItems > 9 ? '9+' : totalItems}
                    </motion.span>
                  </AnimatePresence>
                )}
              </motion.div>

              <span
                className={cn(
                  'text-[10px] font-semibold transition-colors z-10 relative leading-none',
                  active ? 'text-brand-600' : 'text-gray-500',
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
