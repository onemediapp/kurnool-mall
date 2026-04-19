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
