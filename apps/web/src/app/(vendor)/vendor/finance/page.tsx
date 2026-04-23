'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Spinner, KPICard, OrderStatusBadge } from '@/components/shared'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Order, VendorPayout } from '@/lib/types'

const COMMISSION_RATE = 0.08 // 8%

export default function VendorFinancePage() {
  const router = useRouter()
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [payouts, setPayouts] = useState<VendorPayout[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('vendors').select('id').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setVendorId(data.id) })
    })
  }, [router])

  useEffect(() => {
    if (!vendorId) return
    const supabase = createClient()
    Promise.all([
      supabase.from('orders').select('*').eq('vendor_id', vendorId).eq('status', 'delivered').order('created_at', { ascending: false }).limit(50),
      supabase.from('vendor_payouts').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false }),
    ]).then(([ordersRes, payoutsRes]) => {
      setOrders((ordersRes.data ?? []) as unknown as Order[])
      setPayouts((payoutsRes.data ?? []) as unknown as VendorPayout[])
      setLoading(false)
    })
  }, [vendorId])

  const totalGMV = orders.reduce((s, o) => s + o.grand_total, 0)
  const totalCommission = totalGMV * COMMISSION_RATE
  const totalNet = totalGMV - totalCommission
  const pendingPayout = payouts.filter((p) => p.status === 'pending').reduce((s, p) => s + p.net_payout, 0)
  const lastPayout = payouts.find((p) => p.status === 'paid')

  const slicedOrders = orders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(orders.length / PAGE_SIZE)

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Finance</h1>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard label="Total GMV" value={formatPrice(totalGMV)} icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-blue-50 text-[#1A56DB]" />
            <KPICard label="Commission (8%)" value={formatPrice(totalCommission)} icon={<Wallet className="h-5 w-5" />} iconBg="bg-red-50 text-red-600" />
            <KPICard label="Net Earnings" value={formatPrice(totalNet)} icon={<CheckCircle className="h-5 w-5" />} iconBg="bg-green-50 text-green-600" />
            <KPICard label="Pending Payout" value={formatPrice(pendingPayout)} icon={<Clock className="h-5 w-5" />} iconBg="bg-amber-50 text-amber-500" />
          </div>

          {/* Commission explainer */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-[#1A56DB] mb-2">Commission Breakdown</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between"><span>Platform commission</span><span className="font-medium">8% of GMV</span></div>
              <div className="flex justify-between"><span>GST on commission</span><span className="font-medium">18% on commission</span></div>
              <div className="flex justify-between"><span>Net to you</span><span className="font-medium text-green-700">GMV − commission − GST</span></div>
            </div>
          </div>

          {/* Payouts table */}
          {payouts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Payout History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">GMV</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-xs text-gray-600">
                          {formatDate(payout.period_start)} – {formatDate(payout.period_end)}
                        </td>
                        <td className="px-5 py-3 text-right font-medium">{formatPrice(payout.total_gmv)}</td>
                        <td className="px-5 py-3 text-right text-red-600">−{formatPrice(payout.total_commission)}</td>
                        <td className="px-5 py-3 text-right font-semibold text-green-700">{formatPrice(payout.net_payout)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            payout.status === 'paid' ? 'bg-green-100 text-green-700' :
                            payout.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {payout.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Order ledger */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Delivered Orders</h2>
              <span className="text-xs text-gray-500">{orders.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {slicedOrders.map((order) => {
                    const commission = order.grand_total * COMMISSION_RATE
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-700">{order.order_number}</td>
                        <td className="px-5 py-3 text-right font-medium">{formatPrice(order.grand_total)}</td>
                        <td className="px-5 py-3 text-right text-red-600 text-xs">−{formatPrice(commission)}</td>
                        <td className="px-5 py-3 text-right font-semibold text-green-700">{formatPrice(order.grand_total - commission)}</td>
                        <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(order.created_at)}</td>
                      </tr>
                    )
                  })}
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
        </>
      )}
    </div>
  )
}
