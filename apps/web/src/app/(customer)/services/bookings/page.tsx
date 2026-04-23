import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingStatusBadge, EmptyState } from '@/components/shared'
import { formatDate, formatPrice } from '@/lib/utils'
import type { ServiceBooking } from '@/lib/types'
import { ArrowLeft, Calendar, ChevronRight } from 'lucide-react'

export const metadata = { title: 'My Service Bookings — Kurnool Mall' }

export default async function MyBookingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/services/bookings')

  const { data } = await supabase
    .from('service_bookings')
    .select('*, category:service_categories(*), package:service_packages(*), provider:providers(*)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  const bookings = (data ?? []) as ServiceBooking[]

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
        <h1 className="text-base font-semibold text-gray-900">My service bookings</h1>
      </div>

      <div className="p-4">
        {bookings.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-12 w-12" />}
            title="No bookings yet"
            description="Browse services and book your first job."
            action={
              <Link href="/services" className="text-sm text-[#1A56DB] font-medium">
                Browse services
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <Link
                key={b.id}
                href={`/services/bookings/${b.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-full bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
                    {b.category?.emoji || '🛠️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{b.package?.name_en ?? b.category?.name_en}</p>
                      <BookingStatusBadge status={b.status} />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">#{b.booking_number}</p>
                    <p className="text-xs text-gray-600 mt-1">{formatDate(b.scheduled_at)}</p>
                    {b.provider && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        Provider: <span className="text-gray-700 font-medium">{b.provider.business_name}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-[#1A56DB]">{formatPrice(b.price)}</p>
                    <ChevronRight className="h-4 w-4 text-gray-400 ml-auto mt-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
