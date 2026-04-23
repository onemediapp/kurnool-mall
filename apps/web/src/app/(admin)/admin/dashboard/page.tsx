'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  ShoppingCart, Store, Users, TrendingUp, Clock, DollarSign, Package, Star,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { usePlatformStats } from '@/lib/hooks/use-platform-stats'
import { Spinner, KPICard } from '@/components/shared'
import { formatPrice, formatCompact } from '@/lib/utils'

export default function AdminDashboardPage() {
  const { stats, isLoading, lastUpdated } = usePlatformStats()

  const kpiCards = stats ? [
    { label: 'Orders Today', value: String(stats.orders_today), icon: <ShoppingCart className="h-5 w-5" />, iconBg: 'bg-blue-50 text-[#1A56DB]' },
    { label: 'Active Vendors', value: String(stats.active_vendors), icon: <Store className="h-5 w-5" />, iconBg: 'bg-purple-50 text-purple-600' },
    { label: 'Total Customers', value: String(stats.total_customers ?? 0), icon: <Users className="h-5 w-5" />, iconBg: 'bg-green-50 text-green-600' },
    { label: 'GMV Today', value: formatPrice(stats.gmv_today), icon: <TrendingUp className="h-5 w-5" />, iconBg: 'bg-amber-50 text-amber-500' },
    { label: 'Pending Orders', value: String(stats.pending_orders ?? stats.orders_pending ?? 0), icon: <Clock className="h-5 w-5" />, iconBg: (stats.pending_orders ?? stats.orders_pending ?? 0) > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500' },
    { label: 'Total GMV', value: formatPrice(stats.total_gmv ?? 0), icon: <DollarSign className="h-5 w-5" />, iconBg: 'bg-emerald-50 text-emerald-600' },
    { label: 'Total Products', value: String(stats.total_products ?? 0), icon: <Package className="h-5 w-5" />, iconBg: 'bg-indigo-50 text-indigo-600' },
    { label: 'Avg Rating', value: Number(stats.avg_vendor_rating ?? 0).toFixed(1), icon: <Star className="h-5 w-5" />, iconBg: 'bg-yellow-50 text-yellow-500' },
  ] : []

  const gmvData = stats?.gmv_last_7_days ?? []

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Command Centre</h1>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">Updated {lastUpdated.toLocaleTimeString()} · auto-refreshes every 30s</p>
          )}
        </div>
        <div className="flex gap-3">
          <Link href="/admin/orders" className="text-sm text-[#1A56DB] font-medium hover:underline">Orders →</Link>
          <Link href="/admin/vendors" className="text-sm text-[#1A56DB] font-medium hover:underline">Vendors →</Link>
        </div>
      </div>

      {isLoading && !stats ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {/* KPI tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {kpiCards.map((card) => (
              <KPICard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                iconBg={card.iconBg}
              />
            ))}
          </div>

          {/* GMV chart */}
          {gmvData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">GMV — Last 7 Days</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={gmvData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${formatCompact(v)}`} />
                  <Tooltip
                    formatter={(v: number) => [formatPrice(v), 'GMV']}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="gmv" fill="#1A56DB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { href: '/admin/orders', label: 'Manage Orders', icon: '📋', desc: 'Assign riders, track all orders' },
              { href: '/admin/vendors', label: 'Vendors KYC', icon: '🏪', desc: 'Approve pending vendors' },
              { href: '/admin/marketing', label: 'Marketing', icon: '🎯', desc: 'Banners, coupons, flash sales' },
              { href: '/admin/riders', label: 'Riders', icon: '🚴', desc: 'Manage delivery partners' },
              { href: '/admin/finance', label: 'Finance', icon: '💰', desc: 'Payouts & commission ledger' },
              { href: '/admin/customers', label: 'Customers', icon: '👥', desc: 'User management' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
