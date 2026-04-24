'use client'

import { useState, useEffect, useRef } from 'react'
import { Star, Store, X, ChevronRight } from 'lucide-react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { Badge, Spinner, EmptyState, OrderStatusBadge } from '@/components/shared'
import { formatDate, formatPrice } from '@kurnool-mall/shared-utils'
import type { Vendor, KycStatus } from '@kurnool-mall/shared-types'

const KYC_TABS: { label: string; value: KycStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

type VendorWithUser = Vendor & {
  user: { name: string | null; phone: string }
}

interface VendorDetail {
  totalOrders: number
  totalGmv: number
  recentOrders: { id: string; order_number: string; status: string; grand_total: number; created_at: string }[]
  payouts: { id: string; amount: number; status: string; created_at: string }[]
}

function kycBadgeVariant(status: KycStatus): 'yellow' | 'green' | 'red' {
  if (status === 'pending') return 'yellow'
  if (status === 'approved') return 'green'
  return 'red'
}

function CommissionCell({
  vendor,
  onSave,
}: {
  vendor: VendorWithUser
  onSave: (vendorId: string, rate: number) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(vendor.commission_rate))
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setValue(String(vendor.commission_rate))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  async function save() {
    const rate = parseFloat(value)
    if (isNaN(rate) || rate < 0 || rate > 100) { setEditing(false); return }
    setSaving(true)
    await onSave(vendor.id, rate)
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={0}
        max={100}
        step={0.5}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
        className="w-16 border border-brand rounded px-1.5 py-0.5 text-xs outline-none"
        disabled={saving}
        autoFocus
      />
    )
  }

  return (
    <button
      onClick={startEdit}
      className="text-xs text-brand font-medium hover:underline cursor-pointer"
      title="Click to edit commission rate"
    >
      {vendor.commission_rate}%
    </button>
  )
}

function VendorDetailPanel({
  vendor,
  onClose,
}: {
  vendor: VendorWithUser
  onClose: () => void
}) {
  const [detail, setDetail] = useState<VendorDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [ordersRes, payoutsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_number, status, grand_total, created_at')
          .eq('vendor_id', vendor.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('vendor_payouts')
          .select('id, amount, status, created_at')
          .eq('vendor_id', vendor.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      // For totals, fetch all non-cancelled orders
      const { data: allOrders } = await supabase
        .from('orders')
        .select('grand_total, status')
        .eq('vendor_id', vendor.id)
        .eq('is_deleted', false)
        .neq('status', 'cancelled')
        .neq('status', 'rejected')

      const totalOrders = allOrders?.length ?? 0
      const totalGmv = allOrders?.reduce((s, o) => s + (o.grand_total ?? 0), 0) ?? 0

      setDetail({
        totalOrders,
        totalGmv,
        recentOrders: (ordersRes.data ?? []) as VendorDetail['recentOrders'],
        payouts: (payoutsRes.data ?? []) as VendorDetail['payouts'],
      })
      setLoadingDetail(false)
    }
    load()
  }, [vendor.id])

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center shrink-0">
              {vendor.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vendor.logo_url} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <Store className="h-5 w-5 text-brand" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{vendor.shop_name}</h2>
              <Badge variant={kycBadgeVariant(vendor.kyc_status)}>{vendor.kyc_status}</Badge>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {loadingDetail ? (
          <div className="flex items-center justify-center flex-1"><Spinner /></div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Shop info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
              <p className="text-gray-600">👤 {vendor.user?.name || 'Unknown'} · {vendor.user?.phone}</p>
              {vendor.address_line && <p className="text-gray-600">📍 {vendor.address_line}</p>}
              {vendor.gstin && <p className="text-gray-600">🏛 GSTIN: {vendor.gstin}</p>}
              <p className="text-gray-600">💼 Commission: <span className="font-semibold">{vendor.commission_rate}%</span></p>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">{vendor.rating.toFixed(1)}</span>
                <span className="text-gray-400 text-xs">avg rating</span>
              </div>
              <p className={`font-medium ${vendor.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                {vendor.is_active ? '● Active' : '○ Inactive'}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-brand">{detail!.totalOrders}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Orders</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-green-700">{formatPrice(detail!.totalGmv)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total GMV</p>
              </div>
            </div>

            {/* Recent orders */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Orders</p>
              {detail!.recentOrders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>
              ) : (
                <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                  {detail!.recentOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between px-3 py-2.5">
                      <div>
                        <p className="text-xs font-mono font-bold text-gray-700">{o.order_number}</p>
                        <p className="text-xs text-gray-400">{formatDate(o.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <OrderStatusBadge status={o.status as import('@kurnool-mall/shared-types').OrderStatus} />
                        <p className="text-xs font-semibold">{formatPrice(o.grand_total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payout history */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payout History</p>
              {detail!.payouts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No payouts yet</p>
              ) : (
                <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                  {detail!.payouts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{formatPrice(p.amount)}</p>
                        <p className="text-xs text-gray-400">{formatDate(p.created_at)}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        p.status === 'completed' ? 'bg-green-100 text-green-700' :
                        p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<KycStatus | 'all'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedVendor, setSelectedVendor] = useState<VendorWithUser | null>(null)
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    loadVendors()
  }, [])

  async function loadVendors() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('vendors')
        .select('*, user:users(name, phone)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      setVendors((data ?? []) as unknown as VendorWithUser[])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function approveVendor(vendor: VendorWithUser) {
    setActionLoading(vendor.id)
    try {
      const supabase = createClient()
      await supabase
        .from('vendors')
        .update({ kyc_status: 'approved', is_active: true })
        .eq('id', vendor.id)
      await supabase
        .from('users')
        .update({ role: 'vendor' })
        .eq('id', vendor.user_id)
      setVendors((prev) =>
        prev.map((v) => v.id === vendor.id ? { ...v, kyc_status: 'approved', is_active: true } : v)
      )
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  async function rejectVendor(vendorId: string) {
    setActionLoading(vendorId)
    try {
      const supabase = createClient()
      await supabase
        .from('vendors')
        .update({ kyc_status: 'rejected', is_active: false })
        .eq('id', vendorId)
      setVendors((prev) =>
        prev.map((v) => v.id === vendorId ? { ...v, kyc_status: 'rejected', is_active: false } : v)
      )
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  async function toggleActive(vendor: VendorWithUser) {
    setActionLoading(vendor.id)
    try {
      const supabase = createClient()
      await supabase
        .from('vendors')
        .update({ is_active: !vendor.is_active })
        .eq('id', vendor.id)
      setVendors((prev) =>
        prev.map((v) => v.id === vendor.id ? { ...v, is_active: !v.is_active } : v)
      )
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  function toggleBulk(id: string) {
    setBulkSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function bulkApprove() {
    const ids = Array.from(bulkSelected)
    if (ids.length === 0) return
    setBulkLoading(true)
    try {
      const supabase = createClient()
      const targets = vendors.filter((v) => ids.includes(v.id))
      await supabase.from('vendors').update({ kyc_status: 'approved', is_active: true }).in('id', ids)
      const userIds = targets.map((v) => v.user_id)
      if (userIds.length) await supabase.from('users').update({ role: 'vendor' }).in('id', userIds)
      setVendors((prev) =>
        prev.map((v) => (ids.includes(v.id) ? { ...v, kyc_status: 'approved' as KycStatus, is_active: true } : v))
      )
      setBulkSelected(new Set())
    } finally {
      setBulkLoading(false)
    }
  }

  async function bulkActivate(active: boolean) {
    const ids = Array.from(bulkSelected)
    if (ids.length === 0) return
    setBulkLoading(true)
    try {
      const supabase = createClient()
      await supabase.from('vendors').update({ is_active: active }).in('id', ids)
      setVendors((prev) => prev.map((v) => (ids.includes(v.id) ? { ...v, is_active: active } : v)))
      setBulkSelected(new Set())
    } finally {
      setBulkLoading(false)
    }
  }

  async function saveCommission(vendorId: string, rate: number) {
    const supabase = createClient()
    await supabase.from('vendors').update({ commission_rate: rate }).eq('id', vendorId)
    setVendors((prev) => prev.map((v) => v.id === vendorId ? { ...v, commission_rate: rate } : v))
  }

  const filteredVendors = activeTab === 'all'
    ? vendors
    : vendors.filter((v) => v.kyc_status === activeTab)

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
        <p className="text-sm text-gray-500 mt-1">{vendors.length} vendors registered</p>
      </div>

      {bulkSelected.size > 0 && (
        <div className="mb-5 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <span className="text-sm font-medium text-gray-700">{bulkSelected.size} selected</span>
          <div className="flex-1" />
          <button
            onClick={bulkApprove}
            disabled={bulkLoading}
            className="px-3 py-1.5 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            Bulk Approve
          </button>
          <button
            onClick={() => bulkActivate(true)}
            disabled={bulkLoading}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Bulk Activate
          </button>
          <button
            onClick={() => bulkActivate(false)}
            disabled={bulkLoading}
            className="px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Bulk Deactivate
          </button>
          <button
            onClick={() => setBulkSelected(new Set())}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900"
          >
            Clear
          </button>
        </div>
      )}

      {/* KYC filter tabs */}
      <div className="flex gap-2 mb-5">
        {KYC_TABS.map(({ label, value }) => {
          const count = value === 'all' ? vendors.length : vendors.filter((v) => v.kyc_status === value).length
          return (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === value
                  ? 'bg-brand text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-brand hover:text-brand'
              }`}
            >
              {label} ({count})
            </button>
          )
        })}
      </div>

      {filteredVendors.length === 0 ? (
        <EmptyState
          icon={<Store className="h-12 w-12" />}
          title="No vendors found"
          description="No vendors in this category yet."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={bulkSelected.has(vendor.id)}
                    onChange={() => toggleBulk(vendor.id)}
                    className="h-4 w-4 rounded border-gray-300 text-shop focus:ring-shop cursor-pointer"
                    aria-label={`Select ${vendor.shop_name}`}
                  />
                  <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center">
                    {vendor.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={vendor.logo_url} alt="" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <Store className="h-6 w-6 text-brand" />
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => setSelectedVendor(vendor)}
                      className="font-semibold text-gray-900 text-sm hover:text-brand hover:underline flex items-center gap-0.5 text-left"
                    >
                      {vendor.shop_name} <ChevronRight className="h-3 w-3" />
                    </button>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-500">{vendor.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={kycBadgeVariant(vendor.kyc_status)}>
                  {vendor.kyc_status}
                </Badge>
              </div>

              {/* Details */}
              <div className="text-xs text-gray-500 space-y-1 mb-3">
                <p>👤 {vendor.user?.name || 'Unknown'} · {vendor.user?.phone}</p>
                {vendor.address_line && <p>📍 {vendor.address_line}</p>}
                {vendor.gstin && <p>🏛 GSTIN: {vendor.gstin}</p>}
                <p>
                  💼 Commission:{' '}
                  <CommissionCell vendor={vendor} onSave={saveCommission} />
                </p>
                <p className={`font-medium ${vendor.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                  {vendor.is_active ? '● Active' : '○ Inactive'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {vendor.kyc_status === 'pending' && (
                  <>
                    <button
                      onClick={() => approveVendor(vendor)}
                      disabled={actionLoading === vendor.id}
                      className="flex-1 bg-green-500 text-white text-xs font-semibold py-2 px-3 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === vendor.id ? '...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => rejectVendor(vendor.id)}
                      disabled={actionLoading === vendor.id}
                      className="flex-1 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      ✕ Reject
                    </button>
                  </>
                )}
                {vendor.kyc_status === 'approved' && (
                  <button
                    onClick={() => toggleActive(vendor)}
                    disabled={actionLoading === vendor.id}
                    className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg transition-colors disabled:opacity-50 ${
                      vendor.is_active
                        ? 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'
                        : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                    }`}
                  >
                    {actionLoading === vendor.id ? '...' : vendor.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                )}
                {vendor.kyc_status === 'rejected' && (
                  <button
                    onClick={() => approveVendor(vendor)}
                    disabled={actionLoading === vendor.id}
                    className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                  >
                    Re-approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedVendor && (
        <VendorDetailPanel
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
        />
      )}
    </div>
  )
}
