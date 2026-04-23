'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, MessageSquare } from 'lucide-react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { Spinner } from '@/components/shared'
import { timeAgo } from '@kurnool-mall/shared-utils'
import type { Review } from '@kurnool-mall/shared-types'

type StarFilter = 0 | 1 | 2 | 3 | 4 | 5

export default function VendorReviewsPage() {
  const router = useRouter()
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StarFilter>(0)
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({})
  const [savingReply, setSavingReply] = useState<string | null>(null)

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
    let q = supabase.from('reviews').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false })
    if (filter > 0) q = q.eq('rating', filter)
    q.then(({ data }) => {
      setReviews((data ?? []) as Review[])
      setLoading(false)
    })
  }, [vendorId, filter])

  async function submitReply(reviewId: string) {
    const reply = replyDraft[reviewId]?.trim()
    if (!reply) return
    setSavingReply(reviewId)
    const supabase = createClient()
    await supabase
      .from('reviews')
      .update({ vendor_reply: reply, vendor_replied_at: new Date().toISOString() })
      .eq('id', reviewId)
    setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, vendor_reply: reply } : r))
    setReplyDraft((d) => ({ ...d, [reviewId]: '' }))
    setSavingReply(null)
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }))

  const displayed = filter > 0 ? reviews.filter((r) => r.rating === filter) : reviews

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h1>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {/* Aggregate */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 flex items-start gap-8">
            <div className="text-center">
              <p className="text-5xl font-extrabold text-gray-900">{avgRating.toFixed(1)}</p>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">{reviews.length} reviews</p>
            </div>
            <div className="flex-1 space-y-2">
              {ratingDist.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-4 text-right">{star}</span>
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-6">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Star filter */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilter(0)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filter === 0 ? 'bg-[#1A56DB] text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s as StarFilter)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filter === s ? 'bg-[#1A56DB] text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {s}★
              </button>
            ))}
          </div>

          {/* Reviews list */}
          {displayed.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Star className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p>No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayed.map((review, idx) => (
                <div key={review.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">Customer {String.fromCharCode(65 + (idx % 26))}</p>
                    </div>
                    <span className="text-xs text-gray-400">{timeAgo(review.created_at)}</span>
                  </div>

                  {review.comment && (
                    <p className="text-sm text-gray-700 mb-3">{review.comment}</p>
                  )}

                  {/* Existing reply */}
                  {review.vendor_reply && (
                    <div className="pl-3 border-l-2 border-[#1A56DB] bg-blue-50 rounded-r-lg p-2 mb-2">
                      <p className="text-xs font-semibold text-[#1A56DB] mb-0.5">Your reply</p>
                      <p className="text-xs text-gray-600">{review.vendor_reply}</p>
                    </div>
                  )}

                  {/* Reply input */}
                  {!review.vendor_reply && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={replyDraft[review.id] ?? ''}
                        onChange={(e) => setReplyDraft((d) => ({ ...d, [review.id]: e.target.value }))}
                        placeholder="Write a reply..."
                        className="flex-1 text-xs bg-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1A56DB]/20"
                      />
                      <button
                        onClick={() => submitReply(review.id)}
                        disabled={!replyDraft[review.id]?.trim() || savingReply === review.id}
                        className="flex items-center gap-1 text-xs bg-[#1A56DB] text-white px-3 py-2 rounded-lg disabled:opacity-50"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
