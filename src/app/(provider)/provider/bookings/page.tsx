'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Clock, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Spinner, Tabs, BookingStatusBadge, EmptyState, Button,
} from '@/components/shared'
import { toast } from '@/components/shared/toast'
import { formatDate, formatPrice, BOOKING_STATUS_LABELS } from '@/lib/utils'
import { allowedNextStatuses } from '@/lib/utils/fsm'
import type { ServiceBooking, BookingStatus } from '@/lib/types'

type TabKey = 'pending' | 'active' | 'completed'

const TAB_STATUSES: Record<TabKey, BookingStatus[]> = {
  pending: ['pending', 'confirmed'],
  active: ['en_route', 'in_progress'],
  completed: ['completed', 'paid', 'cancelled', 'rejected'],
}

export default function ProviderBookingsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('pending')
  const [bookings, setBookings] = useState<ServiceBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [providerId, setProviderId] = useState<string | null>(null)
  const [selected, setSelected] = useState<ServiceBooking | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [otpInput, setOtpInput] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prov } = await supabase
      .from('providers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!prov) { setLoading(false); return }
    setProviderId(prov.id)
    const { data } = await supabase
      .from('service_bookings')
      .select('*, category:service_categories(*), package:service_packages(*), customer:users!service_bookings_customer_id_fkey(id, name, phone)')
      .eq('provider_id', prov.id)
      .in('status', TAB_STATUSES[tab])
      .order('scheduled_at', { ascending: tab === 'completed' ? false : true })
    setBookings((data ?? []) as ServiceBooking[])
    setLoading(false)
  }, [router, tab])

  useEffect(() => { load() }, [load])

  // Realtime: refresh on changes
  useEffect(() => {
    if (!providerId) return
    const supabase = createClient()
    const ch = supabase
      .channel(`provider-bookings-${providerId}-list`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'service_bookings',
        filter: `provider_id=eq.${providerId}`,
      }, () => { load() })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [providerId, load])

  async function transition(b: ServiceBooking, to: BookingStatus) {
    if (to === 'in_progress' && !otpInput) {
      toast.error('Enter the OTP from the customer')
      return
    }
    setActionLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-booking-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            booking_id: b.id,
            to_status: to,
            otp: to === 'in_progress' ? otpInput : undefined,
          }),
        },
      )
      const result = await res.json()
      if (!res.ok || result.error) {
        toast.error(result.error?.message ?? 'Failed to update')
        return
      }
      toast.success(`Marked as ${BOOKING_STATUS_LABELS[to]}`)
      setOtpInput('')
      setSelected(null)
      load()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Bookings</h1>
      <p className="text-sm text-gray-500 mb-5">Manage your service jobs.</p>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabKey)}
        items={[
          { value: 'pending', label: 'Pending' },
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
        ]}
      />

      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : bookings.length === 0 ? (
          <EmptyState title="No bookings" description="Bookings in this state will appear here." />
        ) : (
          <ul className="space-y-2">
            {bookings.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => setSelected(b)}
                  className="w-full text-left bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-full bg-emerald-50 flex items-center justify-center text-2xl flex-shrink-0">
                      {b.category?.emoji ?? '🛠️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{b.package?.name_en}</p>
                        <BookingStatusBadge status={b.status} />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">#{b.booking_number}</p>
                      <p className="text-xs text-gray-600 mt-1">{formatDate(b.scheduled_at)}</p>
                    </div>
                    <p className="text-sm font-bold text-[#0F3B2E] flex-shrink-0">{formatPrice(b.price)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Side panel */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelected(null)} />
          <aside className="fixed right-0 top-0 bottom-0 w-96 max-w-md bg-white z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Booking detail</h2>
                <p className="text-[11px] text-gray-500">#{selected.booking_number}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <BookingStatusBadge status={selected.status} />

              <div>
                <p className="text-xs text-gray-500">Service</p>
                <p className="text-sm font-semibold text-gray-900">{selected.package?.name_en}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" /> Scheduled</p>
                <p className="text-sm text-gray-900">{formatDate(selected.scheduled_at)}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</p>
                <p className="text-sm text-gray-900">
                  {selected.address?.address_line}, {selected.address?.city} - {selected.address?.pincode}
                </p>
              </div>

              {selected.customer && (
                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="text-sm text-gray-900">{selected.customer.name}</p>
                  {selected.customer.phone && (
                    <a href={`tel:${selected.customer.phone}`} className="text-xs text-[#0F3B2E] font-medium">
                      📞 {selected.customer.phone}
                    </a>
                  )}
                </div>
              )}

              {selected.notes && (
                <div>
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="text-sm text-gray-700">{selected.notes}</p>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Price</span>
                  <span className="font-semibold">{formatPrice(selected.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Commission</span>
                  <span className="text-red-600">-{formatPrice(selected.commission)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-100 mt-2">
                  <span className="font-semibold text-gray-900">You earn</span>
                  <span className="font-bold text-green-700">{formatPrice(selected.price - selected.commission)}</span>
                </div>
              </div>

              {/* OTP input for in_progress */}
              {selected.status === 'en_route' && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Enter customer OTP to start</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit OTP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-mono text-lg tracking-widest"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                {allowedNextStatuses(selected.status).map((next) => (
                  <Button
                    key={next}
                    variant={next === 'rejected' || next === 'cancelled' ? 'outline' : 'primary'}
                    className="w-full"
                    loading={actionLoading}
                    onClick={() => transition(selected, next)}
                  >
                    Mark as {BOOKING_STATUS_LABELS[next]}
                  </Button>
                ))}
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
