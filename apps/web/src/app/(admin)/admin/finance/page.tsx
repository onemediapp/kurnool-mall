'use client'

import { useEffect, useState } from 'react'
import { Download, TrendingUp, DollarSign, CheckCircle, Clock, Receipt } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { Spinner, KPICard } from '@/components/shared'
import { formatPrice, formatDate, formatCompact } from '@kurnool-mall/shared-utils'
import { exportToCSV } from '@/lib/utils/export'
import type { Order, VendorPayout } from '@kurnool-mall/shared-types'

const COMMISSION_RATE = 0.08
const GST_RATE = 0.18
const DELIVERY_REVENUE_SHARE = 0.30

export default function AdminFinancePage() {
  const [tab, setTab] = useState('ledger')
  const [orders, setOrders] = useState<(Order & { vendor?: { shop_name: string } })[]>([])
  const [payouts, setPayouts] = useState<(VendorPayout & { vendor?: { shop_name: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('orders').select('*, vendor:vendors(shop_name)').eq('status', 'delivered').order('created_at', { ascending: false }),
      supabase.from('vendor_payouts').select('*, vendor:vendors(shop_name)').order('created_at', { ascending: false }),
    ]).then(([ordersRes, payoutsRes]) => {
      setOrders((ordersRes.data ?? []) as unknown as (Order & { vendor?: { shop_name: string } })[])
      setPayouts((payoutsRes.data ?? []) as unknown as (VendorPayout & { vendor?: { shop_name: string } })[])
      setLoading(false)
    })
  }, [])

  const totalGMV = orders.reduce((s, o) => s + o.grand_total, 0)
  const totalCommission = totalGMV * COMMISSION_RATE
  const pendingPayouts = payouts.filter((p) => p.status === 'pending').length

  function exportCSV() {
    exportToCSV(
      `kurnool-mall-commissions-${new Date().toISOString().split('T')[0]}`,
      orders,
      [
        { key: 'order_number', label: 'Order #' },
        { key: 'vendor', label: 'Vendor', format: (o) => (o.vendor as unknown as { shop_name: string })?.shop_name ?? '' },
        { key: 'grand_total', label: 'Amount' },
        { key: 'commission', label: 'Commission', format: (o) => (o.grand_total * COMMISSION_RATE).toFixed(2) },
        { key: 'net', label: 'Net', format: (o) => (o.grand_total * (1 - COMMISSION_RATE)).toFixed(2) },
        { key: 'created_at', label: 'Date', format: (o) => formatDate(o.created_at) },
      ]
    )
  }

  const slicedOrders = orders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(orders.length / PAGE_SIZE)

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-200"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KPICard label="Total Platform GMV" value={formatPrice(totalGMV)} icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-blue-50 text-[#1A56DB]" />
            <KPICard label="Total Commission (8%)" value={formatPrice(totalCommission)} icon={<DollarSign className="h-5 w-5" />} iconBg="bg-green-50 text-green-600" />
            <KPICard label="Pending Payouts" value={String(pendingPayouts)} icon={<Clock className="h-5 w-5" />} iconBg={pendingPayouts > 0 ? 'bg-amber-50 text-amber-500' : 'bg-gray-100 text-gray-500'} />
            <KPICard label="Delivered Orders" value={String(orders.length)} icon={<CheckCircle className="h-5 w-5" />} iconBg="bg-purple-50 text-purple-600" />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { id: 'ledger', label: 'Commission Ledger' },
              { id: 'payouts', label: 'Vendor Payouts' },
              { id: 'pnl', label: 'Platform P&L' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === t.id ? 'bg-[#1A56DB] text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Commission Ledger */}
          {tab === 'ledger' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Order #</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Vendor</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">GMV</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Commission</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Net to Vendor</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {slicedOrders.map((order) => {
                      const commission = order.grand_total * COMMISSION_RATE
                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-700">{order.order_number}</td>
                          <td className="px-5 py-3 text-gray-700">{(order.vendor as unknown as { shop_name: string })?.shop_name ?? '—'}</td>
                          <td className="px-5 py-3 text-right font-medium">{formatPrice(order.grand_total)}</td>
                          <td className="px-5 py-3 text-right text-green-700 font-medium">+{formatPrice(commission)}</td>
                          <td className="px-5 py-3 text-right text-gray-600">{formatPrice(order.grand_total - commission)}</td>
                          <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(order.created_at)}</td>
                        </tr>
                      )
                    })}
                    {orders.length === 0 && (
                      <tr><td colSpan={6} className="text-center text-gray-400 py-8">No delivered orders yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                  <button disabled={page === 0} onClick={() => setPage(page - 1)} className="text-xs text-[#1A56DB] disabled:opacity-40">← Prev</button>
                  <span className="text-xs text-gray-500">{page + 1} / {totalPages}</span>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="text-xs text-[#1A56DB] disabled:opacity-40">Next →</button>
                </div>
              )}
            </div>
          )}

          {/* Platform P&L */}
          {tab === 'pnl' && (() => {
            const grossCommission = orders.reduce((s, o) => s + o.grand_total * COMMISSION_RATE, 0)
            const gstCollected = grossCommission * GST_RATE
            const netCommission = grossCommission - gstCollected
            const deliveryRevenue = orders.reduce((s, o) => s + (o.delivery_fee ?? 0) * DELIVERY_REVENUE_SHARE, 0)

            // Monthly trend (last 6 months)
            const monthlyData: Record<string, { commission: number; gst: number; delivery: number }> = {}
            for (const o of orders) {
              const month = new Date(o.created_at).toLocaleDateString('en', { month: 'short', year: '2-digit' })
              if (!monthlyData[month]) monthlyData[month] = { commission: 0, gst: 0, delivery: 0 }
              const c = o.grand_total * COMMISSION_RATE
              monthlyData[month].commission += c
              monthlyData[month].gst += c * GST_RATE
              monthlyData[month].delivery += (o.delivery_fee ?? 0) * DELIVERY_REVENUE_SHARE
            }
            const chartData = Object.entries(monthlyData)
              .slice(-6)
              .map(([month, v]) => ({
                month,
                'Net Commission': Math.round(v.commission - v.gst),
                'GST': Math.round(v.gst),
                'Delivery Rev': Math.round(v.delivery),
              }))

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KPICard label="Gross Commission" value={formatPrice(grossCommission)} icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-blue-50 text-[#1A56DB]" />
                  <KPICard label="GST Collected (18%)" value={formatPrice(gstCollected)} icon={<Receipt className="h-5 w-5" />} iconBg="bg-orange-50 text-orange-500" />
                  <KPICard label="Net Commission" value={formatPrice(netCommission)} icon={<DollarSign className="h-5 w-5" />} iconBg="bg-green-50 text-green-600" />
                  <KPICard label="Delivery Revenue" value={formatPrice(deliveryRevenue)} icon={<CheckCircle className="h-5 w-5" />} iconBg="bg-purple-50 text-purple-600" />
                </div>

                {chartData.length > 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">Monthly P&L Breakdown</h2>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={chartData} barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${formatCompact(v)}`} />
                        <Tooltip
                          formatter={(v: number, name: string) => [formatPrice(v), name]}
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="Net Commission" fill="#1A56DB" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="GST" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Delivery Rev" fill="#10B981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-8">No delivered orders to compute P&L</p>
                )}
              </div>
            )
          })()}

          {/* Vendor Payouts */}
          {tab === 'payouts' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Vendor</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">GMV</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Net</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{(p.vendor as unknown as { shop_name: string })?.shop_name ?? '—'}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">{formatDate(p.period_start)} – {formatDate(p.period_end)}</td>
                      <td className="px-5 py-3 text-right font-medium">{formatPrice(p.total_gmv)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-green-700">{formatPrice(p.net_payout)}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {payouts.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-8">No payouts yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
