import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RatingStars, Badge, EmptyState } from '@/components/shared'
import { formatDate } from '@/lib/utils'
import type { Provider, ServiceReview } from '@/lib/types'
import { ArrowLeft, MapPin, Briefcase, Award } from 'lucide-react'

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props) {
  const supabase = createClient()
  const { data } = await supabase.from('providers').select('business_name').eq('id', params.id).single()
  return { title: data ? `${data.business_name} — Kurnool Mall` : 'Provider — Kurnool Mall' }
}

export default async function ProviderProfilePage({ params }: Props) {
  const supabase = createClient()

  const { data: pData } = await supabase
    .from('providers')
    .select('*, user:users(id, name)')
    .eq('id', params.id)
    .single()

  if (!pData) notFound()
  const provider = pData as Provider

  const { data: revData } = await supabase
    .from('service_reviews')
    .select('*, customer:users!service_reviews_customer_id_fkey(id, name)')
    .eq('provider_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const reviews = (revData ?? []) as ServiceReview[]

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/services"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-target flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <h1 className="text-base font-semibold text-gray-900">Provider profile</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl">
              👤
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{provider.business_name}</h2>
                {provider.verified_at && <Badge variant="green">Verified</Badge>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <RatingStars rating={provider.rating ?? 0} />
                <span className="text-xs text-gray-500">({provider.total_jobs} jobs)</span>
              </div>
              {provider.bio && <p className="text-xs text-gray-600 mt-2">{provider.bio}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <Briefcase className="h-4 w-4 text-gray-400 mx-auto" />
              <p className="text-xs font-bold text-gray-900 mt-1">{provider.total_jobs}</p>
              <p className="text-[10px] text-gray-500">Jobs</p>
            </div>
            <div className="text-center">
              <Award className="h-4 w-4 text-gray-400 mx-auto" />
              <p className="text-xs font-bold text-gray-900 mt-1">{provider.rating?.toFixed(1) ?? '—'}</p>
              <p className="text-[10px] text-gray-500">Rating</p>
            </div>
            <div className="text-center">
              <MapPin className="h-4 w-4 text-gray-400 mx-auto" />
              <p className="text-xs font-bold text-gray-900 mt-1">{provider.service_areas?.length ?? 0}</p>
              <p className="text-[10px] text-gray-500">Areas</p>
            </div>
          </div>
        </div>

        {/* Service areas */}
        {provider.service_areas && provider.service_areas.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Service areas</p>
            <div className="flex flex-wrap gap-1.5">
              {provider.service_areas.map((a) => (
                <Badge key={a} variant="gray">{a}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Customer reviews</p>
          {reviews.length === 0 ? (
            <EmptyState title="No reviews yet" description="Be the first to book and review." />
          ) : (
            <ul className="space-y-3">
              {reviews.map((r) => (
                <li key={r.id} className="border-b last:border-b-0 border-gray-100 pb-3 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{r.customer?.name ?? 'Customer'}</p>
                    <RatingStars rating={r.rating} />
                  </div>
                  {r.comment && <p className="text-xs text-gray-600 mt-1">{r.comment}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">{formatDate(r.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
