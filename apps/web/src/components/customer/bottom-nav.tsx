'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, ShoppingCart, ClipboardList, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@kurnool-mall/shared-utils'
import { useCartStore } from '@/lib/hooks/use-cart'
import { useUIMode } from '@/lib/hooks/use-ui-mode'

const navItems = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/search', label: 'Search', icon: Search, exact: false },
  { href: '/cart', label: 'Cart', icon: ShoppingCart, exact: false },
  { href: '/orders', label: 'Orders', icon: ClipboardList, exact: false },
  { href: '/account', label: 'Account', icon: User, exact: false },
]

export function BottomNav() {
  const pathname = usePathname()
  const { mode } = useUIMode()
  const accentClass = mode === 'shopping' ? 'text-shop' : 'text-service'
  const accentBg = mode === 'shopping' ? 'bg-shop' : 'bg-service'
  const totalItems = useCartStore((s) => s.totalItems())
  const [mounted, setMounted] = useState(false)
  const [prevCount, setPrevCount] = useState(0)
  const [cartBounce, setCartBounce] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-md border-t border-gray-100 z-40 shadow-bottom-nav md:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
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
                'flex flex-col items-center justify-center flex-1 h-full transition-colors relative',
                active ? accentClass : 'text-gray-500 hover:text-gray-700',
              )}
              aria-label={label}
            >
              <div
                className={cn(
                  'flex flex-col items-center justify-center px-4 py-1 rounded-2xl gap-0.5 transition-colors',
                  active ? (mode === 'shopping' ? 'bg-shop/10' : 'bg-service/10') : 'bg-transparent'
                )}
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
                  {isCart && (
                    <AnimatePresence>
                      {mounted && totalItems > 0 && (
                        <motion.span
                          key="cart-badge"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                          className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center leading-none"
                        >
                          {totalItems > 9 ? '9+' : totalItems}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  )}
                </motion.div>

                <span className={cn('text-[10px] font-medium transition-colors', active ? accentClass : '')}>
                  {label}
                </span>
              </div>

              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className={cn('absolute bottom-0 h-0.5 w-8 rounded-full', accentBg)}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
