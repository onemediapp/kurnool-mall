'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, Calendar, Wallet, User as UserIcon,
  LogOut, Wrench, ExternalLink, AlertCircle,
} from 'lucide-react'
import { cn } from '@kurnool-mall/shared-utils'
import { createClient } from '@kurnool-mall/supabase-client/browser'

const navItems = [
  { href: '/provider/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/provider/bookings', label: 'Bookings', icon: ClipboardList, badge: true },
  { href: '/provider/availability', label: 'Availability', icon: Calendar },
  { href: '/provider/earnings', label: 'Earnings', icon: Wallet },
  { href: '/provider/profile', label: 'Profile', icon: UserIcon },
]

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)
  const [providerId, setProviderId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('providers').select('id').eq('user_id', user.id).single()
        .then(({ data: provider }) => {
          if (!provider) return
          setProviderId(provider.id)

          supabase.from('service_bookings')
            .select('id', { count: 'exact', head: true })
            .eq('provider_id', provider.id)
            .in('status', ['pending', 'confirmed'])
            .then(({ count }) => setPendingCount(count ?? 0))

          const channel = supabase
            .channel(`provider-bookings-${provider.id}`)
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'service_bookings',
              filter: `provider_id=eq.${provider.id}`,
            }, () => {
              setPendingCount((c) => c + 1)
            })
            .on('postgres_changes', {
              event: 'UPDATE',
              schema: 'public',
              table: 'service_bookings',
              filter: `provider_id=eq.${provider.id}`,
            }, (payload) => {
              const newStatus = (payload.new as { status: string }).status
              const oldStatus = (payload.old as { status: string }).status
              const wasPending = ['pending', 'confirmed'].includes(oldStatus)
              const isPending = ['pending', 'confirmed'].includes(newStatus)
              if (wasPending && !isPending) {
                setPendingCount((c) => Math.max(0, c - 1))
              } else if (!wasPending && isPending) {
                setPendingCount((c) => c + 1)
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
      <aside className="vendor-sidebar bg-[#0F3B2E] flex flex-col shrink-0 hidden md:flex">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Wrench className="h-7 w-7 text-white" />
            <div>
              <p className="text-white font-bold text-base leading-tight">Kurnool Mall</p>
              <p className="text-emerald-300 text-xs">Provider Panel</p>
            </div>
          </div>
        </div>

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
                    : 'text-emerald-200 hover:bg-white/10 hover:text-white'
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

        <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
          <Link
            href="/services"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
            Customer view
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-200 hover:bg-white/10 hover:text-white transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0F3B2E] px-4 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
        {navItems.map(({ href, label, badge }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                active ? 'bg-white/20 text-white' : 'text-emerald-300 hover:text-white'
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

      <main className="flex-1 overflow-auto md:pt-0 pt-12">
        {pendingCount > 0 && pathname.startsWith('/provider/dashboard') && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700 font-medium">
              {pendingCount} booking{pendingCount > 1 ? 's' : ''} waiting for your response!
            </p>
            <Link href="/provider/bookings" className="ml-auto text-xs text-amber-600 font-semibold underline">
              View bookings →
            </Link>
          </div>
        )}
        {/* Hidden so providerId hooks compile-clean */}
        <span className="hidden" data-provider-id={providerId ?? ''} />
        {children}
      </main>
    </div>
  )
}
