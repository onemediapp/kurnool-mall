'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Spinner, Badge, Button, DataTable, type DataTableColumn,
} from '@/components/shared'
import { exportToCSV } from '@/lib/utils/export'
import { formatDate, CAMPAIGN_TYPE_LABELS, CAMPAIGN_STATUS_COLORS } from '@/lib/utils'
import type { Campaign } from '@/lib/types'

export default function CampaignsListPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
    setCampaigns((data ?? []) as Campaign[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const columns: DataTableColumn<Campaign>[] = [
    {
      key: 'name',
      header: 'Campaign',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <Link href={`/admin/marketing/campaigns/${r.id}`} className="text-sm font-semibold text-[#1A56DB] hover:underline">
          {r.name}
        </Link>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => <span className="text-xs text-gray-600">{CAMPAIGN_TYPE_LABELS[r.type] ?? r.type}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${CAMPAIGN_STATUS_COLORS[r.status] ?? ''}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'sent',
      header: 'Sent',
      sortable: true,
      sortValue: (r) => r.stats?.sent ?? 0,
      render: (r) => <span className="text-sm">{r.stats?.sent ?? 0}</span>,
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      sortValue: (r) => r.created_at,
      render: (r) => <span className="text-xs text-gray-500">{formatDate(r.created_at)}</span>,
    },
  ]

  function handleExport() {
    exportToCSV<Campaign>('campaigns.csv', campaigns, [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'stats', label: 'Sent', format: (r) => r.stats?.sent ?? 0 },
      { key: 'created_at', label: 'Created' },
    ])
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">{campaigns.length} campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={handleExport}>Export</Button>
          <Link href="/admin/marketing/campaigns/new">
            <Button variant="primary" icon={<Plus className="h-4 w-4" />}>New campaign</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : (
        <DataTable columns={columns} rows={campaigns} rowKey={(r) => r.id} pageSize={20} emptyTitle="No campaigns yet" />
      )}
    </div>
  )
}
