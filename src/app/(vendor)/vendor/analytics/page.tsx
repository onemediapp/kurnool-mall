'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/shared'
import { formatPrice, formatCompact, CHART_COLORS } from '@/lib/utils'

type Range = '7d' | '30d' | '3m'

interface DayRevenue { date: string; gmv: number; orders: number }
interface TopProduct { name: string; units: number; revenue: number }
interface StatusCount { name: string; value: number; color: string }

const RANGE_DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '3m': 90 }

export default function VendorAnalyticsPage() {
  const router = useRouter()
  const [range, setRange] = useState<Range>('7d')
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [revenueData, setRevenueData] = useState<DayRevenue[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [statusData, setStatusData] = useState<StatusCount[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [newCustomers, setNewCustomers] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('vendors').select('id').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (data) setVendorId(data.id)
        })
    })
  }, [router])

  useEffect(() => {
    if (!vendorId) return
    loadAnalytics(vendorId, range)
  }, [vendorId, range])

  async function loadAnalytics(vid: string, r: Range) {
    setLoading(true)
    const supabase = createClient()
    const days = RANGE_DAYS[r]
    const from = new Date()
    from.setDate(from.getDate() - days + 1)
    const fromStr = from.toISOString().split('T')[0]

    const { data: orders } = await supabase
      .from('orders')
      .select('created_at, grand_total, status, customer_id')
      .eq('vendor_id', vid)
      .gte('created_at', fromStr)

    // Revenue timeline
    const dayMap: Record<string, { gmv: number; orders: number }> = {}
    const allDays = Array.from({ length: days }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (days - 1 - i))
      return d.toISOString().split('T')[0]
    })
    for (const d of allDays) dayMap[d] = { gmv: 0, orders: 0 }

    const statusCounts: Record<string, number> = {}
    const customerSet = new Set<string>()

    for (const o of (orders ?? [])) {
      const day = (o.created_at as string).split('T')[0]
      if (dayMap[day]) {
        dayMap[day].gmv += o.grand_total as number
        dayMap[day].orders += 1
      }
      statusCounts[o.status as string] = (statusCounts[o.status as string] ?? 0) + 1
      customerSet.add(o.customer_id as string)
    }

    setRevenueData(allDays.map((d) => ({
      date: new Date(d).toLocaleDateString('en', r === '3m' ? { month: 'short', day: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' }).split(',')[0],
      gmv: dayMap[d].gmv,
      orders: dayMap[d].orders,
    })))

    const statusColors: Record<string, string> = {
      delivered: '#16A34A', pending: '#F59E0B', preparing: '#1A56DB',
      cancelled: '#DC2626', rejected: '#9CA3AF', accepted: '#8B5CF6',
    }
    setStatusData(Object.entries(statusCounts).map(([name, value]) => ({
      name, value, color: statusColors[name] ?? '#6B7280',
    })))
    setTotalCustomers(customerSet.size)

    // Top products from order_items
    const { data: items } = await supabase
      .from('order_items')
      .select('product_name, quantity, total_price, order:orders!inner(vendor_id, created_at)')
      .eq('order.vendor_id', vid)
      .gte('order.created_at', fromStr)

    const productMap: Record<string, { units: number; revenue: number }> = {}
    for (const item of (items ?? [])) {
      const name = item.product_name as string
      if (!productMap[name]) productMap[name] = { units: 0, revenue: 0 }
      productMap[name].units += item.quantity as number
      productMap[name].revenue += item.total_price as number
    }
    setTopProducts(
      Object.entries(productMap)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
    )

    setLoading(false)
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['7d', '30d', '3m'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                range === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '3 Months'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="space-y-6">
          {/* Revenue area chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1A56DB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${formatCompact(v)}`} />
                <Tooltip formatter={(v: number) => [formatPrice(v), 'Revenue']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="gmv" stroke="#1A56DB" strokeWidth={2} fill="url(#gmvGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Orders bar chart */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Orders per Day</h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={revenueData} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none' }} />
                  <Bar dataKey="orders" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Order status pie */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Order Status Breakdown</h2>
              {statusData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>
              ) : (
                <div className="flex items-center gap-4">
                  <PieChart width={120} height={120}>
                    <Pie data={statusData} cx={55} cy={55} innerRadius={30} outerRadius={55} dataKey="value">
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="space-y-1.5">
                    {statusData.map((s) => (
                      <div key={s.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="text-gray-600 capitalize">{s.name}</span>
                        <span className="font-semibold text-gray-900 ml-auto">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top products */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Top Products</h2>
            </div>
            {topProducts.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No data for this period</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Units Sold</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topProducts.map((p) => (
                    <tr key={p.name} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{p.units}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatPrice(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Customer insights */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-gray-900">{totalCustomers}</p>
              <p className="text-sm text-gray-500 mt-1">Unique Customers</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-3xl font-bold text-[#1A56DB]">{revenueData.reduce((s, d) => s + d.orders, 0)}</p>
              <p className="text-sm text-gray-500 mt-1">Total Orders</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
