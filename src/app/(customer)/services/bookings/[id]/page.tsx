import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingStatusBadge, Divider } from '@/components/shared'
import { formatDate, formatPrice, BOOKING_PROGRESS_STEPS, BOOKING_STATUS_LABELS } from '@/lib/utils'
import type { ServiceBooking, ServiceBookingEvent, BookingStatus } from '@/lib/types'
import { ArrowLeft, MapPin, Phone, Star } from 'lucide-react'
import { CancelBookingButton } from './cancel-button'

interface Props {
  params: { id: string }
  searchParams: { new?: string }
}

export const metadata = { title: 'Booking detail — Kurnool Mall' }

export default async function BookingDetailPage({ params, searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/services/bookings/${params.id}`)

  const { data: b } = await supabase
    .from('service_bookings')
    .select(`
      *,
      category:service_categories(*),
      package:service_packages(*),
      provider:providers(*, user:users(id, name, phone))
    `)
    .eq('id', params.id)
    .eq('customer_id', user.id)
    .single()

  if (!b) notFound()
  const booking = b as ServiceBooking

  const { data: eventsData } = await supabase
    .from('service_booking_events')
    .select('*')
    .eq('booking_id', params.id)
    .order('created_at', { ascending: true })

  const events = (eventsData ?? []) as ServiceBookingEvent[]

  const isCancellable = ['pending', 'confirmed'].includes(booking.status)
  const showOtp = ['pending', 'confirmed', 'en_route'].includes(booking.status) && searchParams.new === '1'

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/services/bookings"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-target flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 truncate">{booking.package?.name_en ?? 'Booking'}</h1>
          <p className="text-[11px] text-gray-500">#{booking.booking_number}</p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="p-4 space-y-4">
        {/* OTP card if just created */}
        {showOtp && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide">Your OTP</p>
            <p className="text-xs text-amber-800 mt-1">
              Share this OTP with the provider on arrival. Save it now — it won't be shown again.
            </p>
            <p className="text-3xl font-bold text-amber-900 tracking-widest mt-2 text-center">
              Check the success toast
            </p>
          </div>
        )}

        {/* Progress timeline */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Progress</p>
          <ol className="space-y-2">
            {BOOKING_PROGRESS_STEPS.map((step) => {
              const reached = stepIndex(booking.status, step) >= 0
              const isCurrent = booking.status === step
              return (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      reached
                        ? isCurrent
                          ? 'bg-[#1A56DB] text-white ring-4 ring-[#1A56DB]/15'
                          : 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {reached ? '✓' : ''}
                  </span>
                  <span className={`text-xs ${isCurrent ? 'font-semibold text-gray-900' : reached ? 'text-gray-700' : 'text-gray-400'}`}>
                    {BOOKING_STATUS_LABELS[step]}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>

        {/* Provider card */}
        {booking.provider ? (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Provider</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                👤
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{booking.provider.business_name}</p>
                <p className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" /> {booking.provider.rating?.toFixed(1) ?? '—'} · {booking.provider.total_jobs} jobs
                </p>
              </div>
              {(booking.provider as { user?: { phone?: string } }).user?.phone && (
                <a
                  href={`tel:${(booking.provider as { user?: { phone?: string } }).user!.phone}`}
                  className="p-2 rounded-full bg-blue-50 text-[#1A56DB]"
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500">A provider will be assigned shortly.</p>
          </div>
        )}

        {/* Service details */}
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          <div className="p-3 flex justify-between text-sm">
            <span className="text-gray-500">Service</span>
            <span className="font-medium text-gray-900">{booking.package?.name_en}</span>
          </div>
          <div className="p-3 flex justify-between text-sm">
            <span className="text-gray-500">Scheduled</span>
            <span className="font-medium text-gray-900">{formatDate(booking.scheduled_at)}</span>
          </div>
          <div className="p-3 text-sm">
            <p className="text-gray-500 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</p>
            <p className="text-gray-900 text-xs">
              {booking.address?.label ? `${booking.address.label}: ` : ''}
              {booking.address?.address_line}, {booking.address?.city} - {booking.address?.pincode}
            </p>
          </div>
          {booking.notes && (
            <div className="p-3 text-sm">
              <p className="text-gray-500 mb-1">Notes</p>
              <p className="text-gray-700 text-xs">{booking.notes}</p>
            </div>
          )}
          <div className="p-3 flex justify-between text-sm bg-blue-50">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-[#1A56DB]">{formatPrice(booking.price)}</span>
          </div>
        </div>

        {/* Audit trail */}
        {events.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">History</p>
            <ol className="space-y-2">
              {events.map((e) => (
                <li key={e.id} className="text-xs flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700">
                      {e.from_status ? `${BOOKING_STATUS_LABELS[e.from_status]} → ` : ''}
                      <span className="font-medium">{BOOKING_STATUS_LABELS[e.to_status]}</span>
                    </p>
                    {e.note && <p className="text-gray-500">{e.note}</p>}
                    <p className="text-gray-400 text-[10px]">{formatDate(e.created_at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {isCancellable && (
          <>
            <Divider />
            <CancelBookingButton bookingId={booking.id} />
          </>
        )}

        {(booking.status === 'completed' || booking.status === 'paid') && (
          <Link
            href={`/services/bookings/${booking.id}#review`}
            className="block w-full text-center bg-[#1A56DB] text-white text-sm font-semibold py-3 rounded-xl"
          >
            Leave a review
          </Link>
        )}
      </div>
    </div>
  )
}

function stepIndex(current: BookingStatus, step: BookingStatus): number {
  if (current === 'cancelled' || current === 'rejected') return -1
  const order = BOOKING_PROGRESS_STEPS as readonly BookingStatus[]
  const ci = order.indexOf(current)
  const si = order.indexOf(step)
  if (ci === -1 || si === -1) return -1
  return ci - si
}
