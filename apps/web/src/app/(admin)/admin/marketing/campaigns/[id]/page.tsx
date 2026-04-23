'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { Spinner, Badge, KPICard } from '@/components/shared'
import { CampaignPreview } from '@/components/shared/campaign-preview'
import { formatDate, CAMPAIGN_TYPE_LABELS, CAMPAIGN_STATUS_COLORS } from '@kurnool-mall/shared-utils'
import type { Campaign } from '@kurnool-mall/shared-types'

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('campaigns')
      .select('*')
      .eq('id', params.id)
      .single()
      .then(({ data }) => {
        setCampaign(data as Campaign | null)
        setLoading(false)
      })
  }, [params.id])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>
  if (!campaign) return <div className="p-6"><p className="text-gray-600">Campaign not found.</p></div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/admin/marketing/campaigns"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
          <p className="text-xs text-gray-500 mt-1">{CAMPAIGN_TYPE_LABELS[campaign.type]} · Created {formatDate(campaign.created_at)}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${CAMPAIGN_STATUS_COLORS[campaign.status] ?? ''}`}>
          {campaign.status}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard label="Sent" value={String(campaign.stats?.sent ?? 0)} icon={<span>📨</span>} />
        <KPICard label="Delivered" value={String(campaign.stats?.delivered ?? 0)} icon={<span>✅</span>} />
        <KPICard label="Opened" value={String(campaign.stats?.opened ?? 0)} icon={<span>👁️</span>} />
        <KPICard label="Clicked" value={String(campaign.stats?.clicked ?? 0)} icon={<span>👆</span>} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Content</p>
          <div className="text-sm space-y-2">
            <div><span className="text-gray-500">Title (EN):</span> {campaign.content.title_en}</div>
            <div><span className="text-gray-500">Title (TE):</span> {campaign.content.title_te}</div>
            <div><span className="text-gray-500">Body (EN):</span> {campaign.content.body_en}</div>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Preview</p>
          <CampaignPreview type={campaign.type} content={campaign.content} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mt-4">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Audience segment</p>
        <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg overflow-x-auto">
          {JSON.stringify(campaign.audience_segment, null, 2)}
        </pre>
      </div>
    </div>
  )
}
