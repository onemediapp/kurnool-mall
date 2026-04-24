import Link from 'next/link'
import { createClient } from '@kurnool-mall/supabase-client/server'
import { EmptyState } from '@/components/shared'
import { formatPrice } from '@kurnool-mall/shared-utils'
import type { FunctionHall } from '@kurnool-mall/shared-types'
import { ArrowLeft, Users, MapPin } from 'lucide-react'

export const metadata = { title: 'Function Halls — Kurnool Mall' }

export default async function HallsListPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('function_halls')
    .select('*')
    .eq('is_active', true)
    .order('price_per_day', { ascending: true })

  const halls = (data ?? []) as FunctionHall[]

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
        <div>
          <h1 className="text-base font-semibold text-gray-900">Function halls</h1>
          <p className="text-[11px] text-gray-500">Marriages, parties &amp; events</p>
        </div>
      </div>

      <div className="p-4">
        {halls.length === 0 ? (
          <EmptyState
            title="No halls listed yet"
            description="Function halls will appear here once added."
          />
        ) : (
          <div className="space-y-3">
            {halls.map((h) => (
              <Link
                key={h.id}
                href={`/services/halls/${h.id}`}
                className="block bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {h.images && h.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.images[0]} alt={h.name} className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{h.name}</p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> {h.address_line}, {h.city}
                      </p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <Users className="h-3 w-3" /> Capacity {h.capacity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-[#1A56DB] flex-shrink-0">{formatPrice(h.price_per_day)}<span className="text-[10px] font-normal">/day</span></p>
                  </div>
                  {h.amenities && h.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {h.amenities.slice(0, 4).map((a) => (
                        <span key={a} className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
