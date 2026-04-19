import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import type { FunctionHall } from '@/lib/types'
import { ArrowLeft, Users, MapPin } from 'lucide-react'
import { HallBookingForm } from './booking-form'

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props) {
  const supabase = createClient()
  const { data } = await supabase.from('function_halls').select('name').eq('id', params.id).single()
  return { title: data ? `${data.name} — Kurnool Mall` : 'Hall — Kurnool Mall' }
}

export default async function HallDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data } = await supabase
    .from('function_halls')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!data) notFound()
  const hall = data as FunctionHall

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/services/halls"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-target flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <h1 className="text-base font-semibold text-gray-900 truncate">{hall.name}</h1>
      </div>

      {/* Image */}
      {hall.images && hall.images[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={hall.images[0]} alt={hall.name} className="w-full h-56 object-cover" />
      )}

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="text-lg font-bold text-gray-900">{hall.name}</h2>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {hall.capacity} guests
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {hall.city}
            </span>
          </div>
          <p className="text-xl font-bold text-[#1A56DB] mt-3">
            {formatPrice(hall.price_per_day)}<span className="text-xs font-normal text-gray-500">/day</span>
          </p>
          {hall.description_en && <p className="text-xs text-gray-600 mt-3">{hall.description_en}</p>}
          {hall.description_te && (
            <p className="text-xs text-gray-500 font-telugu mt-1">{hall.description_te}</p>
          )}
        </div>

        {hall.amenities && hall.amenities.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Amenities</p>
            <div className="grid grid-cols-2 gap-1.5">
              {hall.amenities.map((a) => (
                <p key={a} className="text-xs text-gray-700 flex items-center gap-1">
                  <span className="text-green-600">✓</span> {a}
                </p>
              ))}
            </div>
          </div>
        )}

        <HallBookingForm hallId={hall.id} pricePerDay={hall.price_per_day} />
      </div>
    </div>
  )
}
