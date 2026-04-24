'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import {
  StepWizard, type WizardStep, Button, Spinner,
} from '@/components/shared'
import { SegmentBuilder } from '@/components/shared/segment-builder'
import { CampaignPreview } from '@/components/shared/campaign-preview'
import { BilingualField } from '@/components/shared/bilingual-field'
import { toast } from '@/components/shared/toast'
import type { CampaignType, AudienceSegment, CampaignContent, CampaignStatus } from '@kurnool-mall/shared-types'

const TYPES: { value: CampaignType; label: string }[] = [
  { value: 'push', label: 'Push Notification' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'in_app_banner', label: 'In-App Banner' },
  { value: 'promotional_banner', label: 'Promotional Banner' },
]

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [matchCount, setMatchCount] = useState<number | null>(null)
  const [matchLoading, setMatchLoading] = useState(false)

  // Step 1 — Basics
  const [name, setName] = useState('')
  const [type, setType] = useState<CampaignType>('push')

  // Step 2 — Audience
  const [segment, setSegment] = useState<AudienceSegment>({ match: 'all', rules: [] })

  // Step 3 — Content
  const [content, setContent] = useState<CampaignContent>({
    title_en: '',
    title_te: '',
    body_en: '',
    body_te: '',
    cta_label_en: '',
    cta_label_te: '',
    cta_url: '',
    image_url: '',
  })

  // Step 4 — Schedule
  const [sendNow, setSendNow] = useState(true)
  const [scheduleAt, setScheduleAt] = useState('')

  // Live count
  const fetchMatchCount = useCallback(async () => {
    setMatchLoading(true)
    const supabase = createClient()
    // Simple approach: if no rules, count all non-deleted users
    if (segment.rules.length === 0) {
      const { count } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_deleted', false)
      setMatchCount(count ?? 0)
    } else {
      // For now just count all users (the edge function does the real filtering)
      const { count } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_deleted', false)
      setMatchCount(count ?? 0)
    }
    setMatchLoading(false)
  }, [segment])

  useEffect(() => {
    const timer = setTimeout(fetchMatchCount, 500)
    return () => clearTimeout(timer)
  }, [fetchMatchCount])

  async function handleSubmit() {
    if (!name || !content.title_en) {
      toast.error('Fill required fields')
      return
    }
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const status: CampaignStatus = sendNow ? 'draft' : 'scheduled'
      const { data: campaign, error } = await supabase.from('campaigns').insert({
        name,
        type,
        audience_segment: segment,
        content,
        schedule_at: sendNow ? null : (scheduleAt ? new Date(scheduleAt).toISOString() : null),
        status,
        created_by: user.id,
        stats: { sent: 0, delivered: 0, opened: 0, clicked: 0 },
      }).select().single()

      if (error) {
        toast.error('Failed: ' + error.message)
        return
      }

      if (sendNow) {
        // Call send-campaign edge function
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-campaign`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ campaign_id: campaign.id }),
            }
          )
          const result = await res.json()
          if (res.ok && !result.error) {
            toast.success(`Campaign sent to ${result.data.sent} users`)
          } else {
            toast.error(result.error?.message ?? 'Campaign created but send failed')
          }
        }
      } else {
        toast.success('Campaign scheduled')
      }

      router.push('/admin/marketing/campaigns')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const steps: WizardStep[] = [
    {
      id: 'basics',
      label: 'Basics',
      canAdvance: !!name && !!type,
      content: (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Campaign name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Diwali Special"
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Channel type</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`px-3 py-2 rounded-lg border text-sm text-left ${
                    type === t.value
                      ? 'bg-blue-50 border-[#1A56DB] text-[#1A56DB] font-medium'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'audience',
      label: 'Audience',
      canAdvance: true,
      content: (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Target audience</p>
          <SegmentBuilder value={segment} onChange={setSegment} />
          <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-900 flex items-center gap-2">
            {matchLoading ? <Spinner /> : <span className="font-bold text-lg">{matchCount ?? '—'}</span>}
            matching users
          </div>
        </div>
      ),
    },
    {
      id: 'content',
      label: 'Content',
      canAdvance: !!content.title_en,
      content: (
        <div className="space-y-3">
          <BilingualField
            label="Title"
            valueEn={content.title_en}
            valueTe={content.title_te}
            onChangeEn={(v) => setContent({ ...content, title_en: v })}
            onChangeTe={(v) => setContent({ ...content, title_te: v })}
            required
          />
          <BilingualField
            label="Body"
            valueEn={content.body_en}
            valueTe={content.body_te}
            onChangeEn={(v) => setContent({ ...content, body_en: v })}
            onChangeTe={(v) => setContent({ ...content, body_te: v })}
            multiline
          />
          <BilingualField
            label="CTA label"
            valueEn={content.cta_label_en ?? ''}
            valueTe={content.cta_label_te ?? ''}
            onChangeEn={(v) => setContent({ ...content, cta_label_en: v })}
            onChangeTe={(v) => setContent({ ...content, cta_label_te: v })}
          />
          <div>
            <label className="text-xs font-medium text-gray-700">CTA URL</label>
            <input
              type="text"
              value={content.cta_url ?? ''}
              onChange={(e) => setContent({ ...content, cta_url: e.target.value })}
              placeholder="https://..."
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-700 mb-2">Preview</p>
            <CampaignPreview type={type} content={content} />
          </div>
        </div>
      ),
    },
    {
      id: 'schedule',
      label: 'Schedule',
      canAdvance: true,
      content: (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">When to send?</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="when" checked={sendNow} onChange={() => setSendNow(true)} className="accent-[#1A56DB]" />
              <span className="text-sm">Send immediately</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="when" checked={!sendNow} onChange={() => setSendNow(false)} className="accent-[#1A56DB]" />
              <span className="text-sm">Schedule for later</span>
            </label>
          </div>
          {!sendNow && (
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          )}
        </div>
      ),
    },
    {
      id: 'review',
      label: 'Review',
      canAdvance: true,
      content: (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Review &amp; send</p>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 text-sm">
            <div className="p-3 flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{name}</span></div>
            <div className="p-3 flex justify-between"><span className="text-gray-500">Channel</span><span className="font-medium capitalize">{type.replace('_', ' ')}</span></div>
            <div className="p-3 flex justify-between"><span className="text-gray-500">Audience</span><span className="font-medium">{matchCount ?? '—'} users</span></div>
            <div className="p-3 flex justify-between"><span className="text-gray-500">Title</span><span className="font-medium">{content.title_en}</span></div>
            <div className="p-3 flex justify-between"><span className="text-gray-500">Send</span><span className="font-medium">{sendNow ? 'Immediately' : scheduleAt || 'Scheduled'}</span></div>
          </div>
          <CampaignPreview type={type} content={content} />
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/admin/marketing/campaigns"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New campaign</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <StepWizard
          steps={steps}
          current={step}
          onChange={setStep}
          onSubmit={handleSubmit}
          submitLabel={sendNow ? 'Send now' : 'Schedule'}
          loading={submitting}
        />
      </div>
    </div>
  )
}
