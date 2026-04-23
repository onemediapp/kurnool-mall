'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import {
  Spinner, Tabs, Badge, Button, DataTable, type DataTableColumn,
} from '@/components/shared'
import { toast } from '@/components/shared/toast'
import { formatPrice, formatDate } from '@kurnool-mall/shared-utils'
import type { Provider, KycStatus, User } from '@kurnool-mall/shared-types'

interface ProviderRow extends Provider {
  user?: Pick<User, 'id' | 'name' | 'phone'> & { email?: string }
}

const TABS: { value: KycStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<ProviderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<KycStatus | 'all'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase
      .from('providers')
      .select('*, user:users(id, name, phone)')
      .order('created_at', { ascending: false })
    if (tab !== 'all') q = q.eq('kyc_status', tab)
    const { data } = await q
    setProviders((data ?? []) as ProviderRow[])
    setLoading(false)
  }, [tab])

  useEffect(() => { load() }, [load])

  async function updateKyc(id: string, status: KycStatus) {
    const supabase = createClient()
    const patch: { kyc_status: KycStatus; verified_at?: string | null } = { kyc_status: status }
    if (status === 'approved') patch.verified_at = new Date().toISOString()
    if (status === 'rejected') patch.verified_at = null
    const { error } = await supabase.from('providers').update(patch).eq('id', id)
    if (error) {
      toast.error('Failed: ' + error.message)
      return
    }
    toast.success(`Provider ${status}`)
    load()
  }

  async function saveCommission(id: string) {
    const value = Number(editValue)
    if (isNaN(value) || value < 0 || value > 100) {
      toast.error('Commission must be 0-100')
      return
    }
    const supabase = createClient()
    const { error } = await supabase.from('providers').update({ commission_pct: value }).eq('id', id)
    if (error) {
      toast.error('Failed: ' + error.message)
      return
    }
    setEditingId(null)
    toast.success('Commission updated')
    load()
  }

  const columns: DataTableColumn<ProviderRow>[] = [
    {
      key: 'business_name',
      header: 'Provider',
      sortable: true,
      sortValue: (r) => r.business_name,
      render: (r) => (
        <div>
          <p className="text-sm font-semibold text-gray-900">{r.business_name}</p>
          <p className="text-[10px] text-gray-500">{r.user?.name} · {r.user?.phone}</p>
        </div>
      ),
    },
    {
      key: 'kyc_status',
      header: 'KYC',
      render: (r) => (
        <Badge
          variant={
            r.kyc_status === 'approved' ? 'green' :
            r.kyc_status === 'rejected' ? 'red' : 'yellow'
          }
        >
          {r.kyc_status}
        </Badge>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      sortValue: (r) => r.rating ?? 0,
      render: (r) => <span className="text-sm">{r.rating?.toFixed(1) ?? '—'}</span>,
    },
    {
      key: 'total_jobs',
      header: 'Jobs',
      sortable: true,
      sortValue: (r) => r.total_jobs ?? 0,
      render: (r) => <span className="text-sm">{r.total_jobs}</span>,
    },
    {
      key: 'commission_pct',
      header: 'Commission %',
      render: (r) => (
        editingId === r.id ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={editValue}
              autoFocus
              min={0}
              max={100}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveCommission(r.id)
                if (e.key === 'Escape') setEditingId(null)
              }}
              onBlur={() => saveCommission(r.id)}
              className="w-16 px-2 py-1 border border-[#1A56DB] rounded text-sm"
            />
            <span className="text-xs">%</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setEditingId(r.id); setEditValue(String(r.commission_pct)) }}
            className="text-sm text-gray-700 hover:text-[#1A56DB] hover:underline"
          >
            {r.commission_pct}%
          </button>
        )
      ),
    },
    {
      key: 'verified_at',
      header: 'Verified',
      render: (r) => (
        <span className="text-[11px] text-gray-500">
          {r.verified_at ? formatDate(r.verified_at) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex gap-1">
          {r.kyc_status !== 'approved' && (
            <Button size="sm" variant="success" onClick={() => updateKyc(r.id, 'approved')}>
              Approve
            </Button>
          )}
          {r.kyc_status !== 'rejected' && (
            <Button size="sm" variant="outline" onClick={() => updateKyc(r.id, 'rejected')}>
              Reject
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Providers</h1>
      <p className="text-sm text-gray-500 mb-5">KYC management, commission, and onboarding.</p>

      <div className="mb-4">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as KycStatus | 'all')}
          items={TABS.map((t) => ({ value: t.value, label: t.label }))}
        />
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : (
        <DataTable
          columns={columns}
          rows={providers}
          rowKey={(r) => r.id}
          pageSize={20}
          emptyTitle="No providers"
          emptyDescription="No providers in this tab."
        />
      )}
    </div>
  )
}
