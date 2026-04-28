import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@kurnool-mall/supabase-client/server'
import { EmptyState } from '@/components/shared'
import { formatPrice, SERVICE_CATEGORY_META } from '@kurnool-mall/shared-utils'
import type { ServiceCategory, ServicePackage, ServiceCategorySlug } from '@kurnool-mall/shared-types'
import { ArrowLeft, Clock } from 'lucide-react'

interface Props {
  params: { category: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = createClient()
  const { data } = await supabase
    .from('service_categories')
    .select('name_en')
    .eq('slug', params.category)
    .single()
  return {
    title: data ? `${data.name_en} — Kurnool Mall Services` : 'Service — Kurnool Mall',
  }
}

export default async function ServiceCategoryPage({ params }: Props) {
  const supabase = createClient()

  const { data: catData } = await supabase
    .from('service_categories')
    .select('*')
    .eq('slug', params.category)
    .eq('is_active', true)
    .single()

  if (!catData) notFound()

  const cat = catData as ServiceCategory

  const { data: pkgData } = await supabase
    .from('service_packages')
    .select('*')
    .eq('category_id', cat.id)
    .eq('is_active', true)
    .order('price', { ascending: true })

  const packages = (pkgData ?? []) as ServicePackage[]
  const meta = SERVICE_CATEGORY_META[cat.slug as ServiceCategorySlug]

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/services"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-target flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{cat.emoji || meta?.emoji || '🛠️'}</span>
          <div>
            <h1 className="text-base font-semibold text-gray-900">{cat.name_en}</h1>
            <p className="text-xs text-gray-500 font-telugu">{cat.name_te}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {cat.description_en && (
        <div className="px-4 pt-4">
          <p className="text-sm text-gray-600">{cat.description_en}</p>
          {cat.description_te && (
            <p className="text-xs text-gray-500 font-telugu mt-1">{cat.description_te}</p>
          )}
        </div>
      )}

      {/* Packages */}
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Choose a package</h2>
        {packages.length === 0 ? (
          <EmptyState
            title="No packages yet"
            description="We're adding service packages to this category. Check back soon."
            action={
              <Link href="/services" className="text-sm text-service font-medium hover:underline">
                Browse other services
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {packages.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{p.name_en}</p>
                    <p className="text-[11px] text-gray-500 font-telugu mt-0.5">{p.name_te}</p>
                    {p.description_en && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">{p.description_en}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {p.duration_mins} mins
                      </span>
                      <span className="capitalize">{p.pricing_model.replace('_', ' ')}</span>
                    </div>
                    {p.inclusions && p.inclusions.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {p.inclusions.slice(0, 3).map((inc, i) => (
                          <li key={i} className="text-[11px] text-gray-600 flex items-start gap-1">
                            <span className="text-green-600">✓</span> {inc}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-service">{formatPrice(p.price)}</p>
                  </div>
                </div>
                <Link
                  href={`/services/book/${p.id}`}
                  className="mt-3 block w-full text-center bg-service text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-service-dark active:bg-service-dark transition-colors"
                >
                  Book now
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
