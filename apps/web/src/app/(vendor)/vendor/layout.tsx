'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, ClipboardList, LogOut, ShoppingBag,
  BarChart2, Star, Wallet, Settings, ExternalLink, AlertCircle,
} from 'lucide-react'
import { cn } from '@kurnool-mall/shared-utils'
import { createClient } from '@kurnool-mall/supabase-client/browser'

const navItems = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/orders', label: 'Orders', icon: ClipboardList, badge: true },
  { href: '/vendor/products', label: 'Products', icon: Package },
  { href: '/vendor/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/vendor/reviews', label: 'Reviews', icon: Star },
  { href: '/vendor/finance', label: 'Finance', icon: Wallet },
  { href: '/vendor/settings', label: 'Settings', icon: Settings },
]

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)
  const [vendorId, setVendorId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Get vendor ID and pending count
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('vendors').select('id').eq('user_id', user.id).single()
        .then(({ data: vendor }) => {
          if (!vendor) return
          setVendorId(vendor.id)

          // Load initial pending count
          supabase.from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('vendor_id', vendor.id)
            .eq('status', 'pending')
            .then(({ count }) => setPendingCount(count ?? 0))

          // Realtime subscription for new orders
          const channel = supabase
            .channel(`vendor-orders-${vendor.id}`)
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'orders',
              filter: `vendor_id=eq.${vendor.id}`,
            }, () => {
              setPendingCount((c) => c + 1)
            })
            .on('postgres_changes', {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `vendor_id=eq.${vendor.id}`,
            }, (payload) => {
              const newStatus = (payload.new as { status: string }).status
              const oldStatus = (payload.old as { status: string }).status
              if (oldStatus === 'pending' && newStatus !== 'pending') {
                setPendingCount((c) => Math.max(0, c - 1))
              }
            })
            .subscribe()

          return () => { supabase.removeChannel(channel) }
        })
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="vendor-sidebar bg-[#1E3A5F] flex flex-col shrink-0 hidden md:flex">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-7 w-7 text-white" />
            <div>
              <p className="text-white font-bold text-base leading-tight">Kurnool Mall</p>
              <p className="text-blue-300 text-xs">Vendor Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-white/20 text-white'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && pendingCount > 0 && (
                  <span className="flex items-center justify-center h-5 min-w-[20px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
            View Shop
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#1E3A5F] px-4 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
        {navItems.map(({ href, label, badge }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                active ? 'bg-white/20 text-white' : 'text-blue-300 hover:text-white'
              )}
            >
              {label}
              {badge && pendingCount > 0 && (
                <span className="h-4 min-w-[16px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto md:pt-0 pt-12">
        {pendingCount > 0 && pathname.startsWith('/vendor/dashboard') && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              {pendingCount} new order{pendingCount > 1 ? 's' : ''} waiting for your response!
            </p>
            <Link href="/vendor/orders" className="ml-auto text-xs text-red-600 font-semibold underline">
              View Orders →
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
