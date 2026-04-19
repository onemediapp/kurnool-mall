'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart, Clock, Package, Star, TrendingUp, AlertTriangle,
  ToggleLeft, ToggleRight, ArrowRight, X,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { OrderStatusBadge, Spinner, KPICard } from '@/components/shared'
import { toast } from '@/components/shared/toast'
import { formatDate, formatPrice, formatCompact } from '@/lib/utils'
import type { Order, VendorStats } from '@/lib/types'

interface LowStockProduct {
  id: string
  name_en: string
  stock_qty: number
  unit: string | null
}

interface Vendor {
  id: string
  shop_name: string
  is_active: boolean
}

export default function VendorDashboardPage() {
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [gmvData, setGmvData] = useState<{ date: string; gmv: number }[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [editingProduct, setEditingProduct] = useState<LowStockProduct | null>(null)
  const [newStock, setNewStock] = useState('')
  const [stockSaving, setStockSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [togglingStatus, setTogglingStatus] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id, shop_name, is_active')
        .eq('user_id', user.id)
        .single()

      if (!vendorData) { setLoading(false); return }
      setVendor(vendorData as Vendor)

      const [statsRes, ordersRes] = await Promise.all([
        supabase.rpc('get_vendor_stats', { p_vendor_id: vendorData.id }),
        supabase
          .from('orders')
          .select('*, order_items(product_name, quantity)')
          .eq('vendor_id', vendorData.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setStats(((statsRes.data as any)?.[0] ?? null) as VendorStats)
      setRecentOrders((ordersRes.data ?? []) as unknown as Order[])

      // Low stock products (stock_qty <= 5)
      const { data: lowStock } = await supabase
        .from('products')
        .select('id, name_en, stock_qty, unit')
        .eq('vendor_id', vendorData.id)
        .eq('is_deleted', false)
        .lte('stock_qty', 5)
        .order('stock_qty', { ascending: true })
      setLowStockProducts((lowStock ?? []) as LowStockProduct[])

      // Fetch last 7 days GMV
      const days7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return d.toISOString().split('T')[0]
      })

      const { data: gmvRows } = await supabase
        .from('orders')
        .select('created_at, grand_total')
        .eq('vendor_id', vendorData.id)
        .in('status', ['delivered', 'accepted', 'preparing', 'ready', 'out_for_delivery'])
        .gte('created_at', days7[0])

      const gmvByDay: Record<string, number> = {}
      for (const row of (gmvRows ?? [])) {
        const day = (row.created_at as string).split('T')[0]
        gmvByDay[day] = (gmvByDay[day] ?? 0) + (row.grand_total as number)
      }

      setGmvData(days7.map((d) => ({
        date: new Date(d).toLocaleDateString('en', { weekday: 'short' }),
        gmv: gmvByDay[d] ?? 0,
      })))
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function toggleShopStatus() {
    if (!vendor) return
    setTogglingStatus(true)
    try {
      const supabase = createClient()
      await supabase.from('vendors').update({ is_active: !vendor.is_active }).eq('id', vendor.id)
      setVendor({ ...vendor, is_active: !vendor.is_active })
    } catch {
      // ignore
    } finally {
      setTogglingStatus(false)
    }
  }

  async function updateStock() {
    if (!editingProduct) return
    const qty = parseInt(newStock)
    if (isNaN(qty) || qty < 0) { toast.error('Enter a valid stock quantity'); return }
    setStockSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('products').update({ stock_qty: qty }).eq('id', editingProduct.id)
      if (error) { toast.error('Failed to update stock'); return }
      setLowStockProducts((prev) =>
        qty > 5
          ? prev.filter((p) => p.id !== editingProduct.id)
          : prev.map((p) => p.id === editingProduct.id ? { ...p, stock_qty: qty } : p)
      )
      toast.success(`Stock updated to ${qty}`)
      setEditingProduct(null)
    } finally {
      setStockSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner /></div>
  }

  if (!vendor) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🏪</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">No vendor account found</h2>
        <p className="text-gray-500">Contact admin to set up your vendor account.</p>
      </div>
    )
  }

  const kpiCards = [
    {
      label: 'Orders Today',
      value: String(stats?.orders_today ?? 0),
      icon: <ShoppingCart className="h-5 w-5" />,
      iconBg: 'bg-blue-50 text-[#1A56DB]',
    },
    {
      label: 'Pending Now',
      value: String(stats?.pending_orders ?? 0),
      icon: <Clock className="h-5 w-5" />,
      iconBg: (stats?.pending_orders ?? 0) > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500',
    },
    {
      label: 'Revenue Today',
      value: formatCompact(stats?.gmv_today ?? 0),
      icon: <TrendingUp className="h-5 w-5" />,
      iconBg: 'bg-green-50 text-green-600',
    },
    {
      label: 'Avg Rating',
      value: Number(stats?.avg_rating ?? 0).toFixed(1),
      icon: <Star className="h-5 w-5" />,
      iconBg: 'bg-amber-50 text-amber-500',
    },
  ]

  return (
    <div className="p-6 max-w-5xl">
      {/* Header + shop toggle */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">{vendor.shop_name}</p>
        </div>
        <button
          onClick={toggleShopStatus}
          disabled={togglingStatus}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            vendor.is_active
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {vendor.is_active ? (
            <><ToggleRight className="h-5 w-5" /> Shop Open</>
          ) : (
            <><ToggleLeft className="h-5 w-5" /> Shop Closed</>
          )}
        </button>
      </div>

      {/* Pending alert */}
      {(stats?.pending_orders ?? 0) > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm font-semibold text-red-800">
              {stats!.pending_orders} order{stats!.pending_orders > 1 ? 's' : ''} waiting for acceptance!
            </p>
          </div>
          <Link href="/vendor/orders" className="flex items-center gap-1 text-sm text-red-600 font-semibold">
            View <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Revenue — Last 7 Days</h2>
          <span className="text-sm font-bold text-gray-700">{formatPrice(stats?.total_gmv ?? 0)} all-time</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={gmvData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${formatCompact(v)}`} />
            <Tooltip
              formatter={(v: number) => [formatPrice(v), 'Revenue']}
              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="gmv" fill="#1A56DB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/vendor/orders" className="text-xs text-[#1A56DB] font-medium hover:underline">
            View all →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/vendor/orders/${order.id}`} className="font-mono text-xs font-semibold text-[#1A56DB] hover:underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-5 py-3 font-semibold">{formatPrice(order.grand_total)}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Low stock alerts */}
      {lowStockProducts.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-orange-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <h2 className="text-base font-semibold text-gray-900">Low Stock Alert</h2>
            <span className="ml-auto text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">{lowStockProducts.length} items</span>
          </div>
          <div className="divide-y divide-gray-50">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{product.name_en}</p>
                  <p className={`text-xs font-semibold mt-0.5 ${product.stock_qty === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                    {product.stock_qty === 0 ? 'Out of stock' : `${product.stock_qty} ${product.unit ?? 'units'} left`}
                  </p>
                </div>
                <button
                  onClick={() => { setEditingProduct(product); setNewStock(String(product.stock_qty)) }}
                  className="text-xs bg-orange-50 text-orange-700 border border-orange-200 font-semibold px-3 py-1.5 rounded-lg hover:bg-orange-100"
                >
                  <Package className="h-3.5 w-3.5 inline mr-1" />Update Stock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock update modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Update Stock</h3>
              <button onClick={() => setEditingProduct(null)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">{editingProduct.name_en}</p>
            <input
              type="number"
              min={0}
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && updateStock()}
              placeholder="New stock quantity"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditingProduct(null)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={updateStock}
                disabled={stockSaving}
                className="flex-1 bg-orange-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-orange-600 disabled:opacity-50"
              >
                {stockSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
