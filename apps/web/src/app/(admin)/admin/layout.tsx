'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, Store, LogOut, ShoppingBag, Bike,
  Megaphone, DollarSign, Users, Layers, Tag, ExternalLink,
  BarChart3, Send, Sparkles, FileText, Bell, Wrench, UserCheck,
  Package as PackageIcon, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const NAV_GROUPS = [
  {
    label: 'OPERATIONS',
    items: [
      { href: '/admin/dashboard', label: 'Command Centre', icon: LayoutDashboard },
      { href: '/admin/orders', label: 'All Orders', icon: ClipboardList },
      { href: '/admin/riders', label: 'Riders', icon: Bike },
    ],
  },
  {
    label: 'VENDORS',
    items: [
      { href: '/admin/vendors', label: 'Vendor Management', icon: Store },
    ],
  },
  {
    label: 'CUSTOMERS',
    items: [
      { href: '/admin/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    label: 'CATALOGUE',
    items: [
      { href: '/admin/categories', label: 'Categories', icon: Layers },
    ],
  },
  {
    label: 'MARKETING',
    items: [
      { href: '/admin/marketing', label: 'Banners & Coupons', icon: Megaphone },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { href: '/admin/finance', label: 'Finance', icon: DollarSign },
    ],
  },
  {
    label: 'ANALYTICS & GROWTH',
    items: [
      { href: '/admin/analytics', label: 'Analytics Hub', icon: BarChart3 },
      { href: '/admin/marketing/campaigns', label: 'Campaigns', icon: Send },
      { href: '/admin/marketing/upsell', label: 'Upsell Rules', icon: Sparkles },
      { href: '/admin/reports', label: 'Reports', icon: FileText },
      { href: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'SERVICES',
    items: [
      { href: '/admin/services/bookings', label: 'Service Bookings', icon: ClipboardList },
      { href: '/admin/services/providers', label: 'Providers', icon: UserCheck },
      { href: '/admin/services/categories', label: 'Service Categories', icon: Wrench },
      { href: '/admin/services/packages', label: 'Service Packages', icon: PackageIcon },
      { href: '/admin/services/halls', label: 'Function Halls', icon: Building2 },
    ],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="admin-sidebar bg-[#111827] flex flex-col shrink-0 hidden md:flex overflow-y-auto">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-7 w-7 text-white" />
            <div>
              <p className="text-white font-bold text-base leading-tight">Kurnool Mall</p>
              <p className="text-gray-400 text-xs">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-1">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname.startsWith(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-[#1A56DB] text-white border-l-2 border-[#1A56DB]'
                          : 'text-gray-400 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10 space-y-0.5 flex-shrink-0">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
            <ExternalLink className="h-4 w-4" />
            View Store
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#111827] px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide border-b border-white/10">
        {NAV_GROUPS.flatMap((g) => g.items).map(({ href, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn('flex-shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors',
                active ? 'bg-[#1A56DB] text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto md:pt-0 pt-12">
        {children}
      </main>
    </div>
  )
}
