import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ServiceCategoryCard, EmptyState, PageHeader } from '@/components/shared'
import { formatPrice, SERVICE_CATEGORY_META } from '@/lib/utils'
import type { ServiceCategory, ServicePackage, FunctionHall } from '@/lib/types'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Home Services — Kurnool Mall',
  description: 'Book trusted electricians, plumbers, cleaners, and more in Kurnool.',
}

export default async function ServicesLandingPage() {
  const supabase = createClient()

  const [{ data: categoriesData }, { data: featuredData }, { data: hallsData }] = await Promise.all([
    supabase
      .from('service_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('service_packages')
      .select('*, category:service_categories(*)')
      .eq('is_active', true)
      .order('price', { ascending: true })
      .limit(6),
    supabase
      .from('function_halls')
      .select('*')
      .eq('is_active', true)
      .limit(3),
  ])

  const categories = (categoriesData ?? []) as ServiceCategory[]
  const featured = (featuredData ?? []) as ServicePackage[]
  const halls = (hallsData ?? []) as FunctionHall[]

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-target flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <div>
          <h1 className="text-base font-semibold text-gray-900">Home Services</h1>
          <p className="text-xs text-gray-500 font-telugu">హోమ్ సర్వీసెస్</p>
        </div>
        <Link
          href="/services/bookings"
          className="ml-auto text-xs text-[#1A56DB] font-medium"
        >
          My bookings
        </Link>
      </div>

      {/* Hero */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#1A56DB] to-[#7C3AED] p-5 text-white shadow-md">
          <div className="flex items-center gap-2 text-xs font-medium opacity-90 mb-2">
            <Sparkles className="h-4 w-4" /> Trusted local pros
          </div>
          <h2 className="text-xl font-bold leading-snug">
            Repairs, cleaning &amp; more
          </h2>
          <p className="text-sm opacity-90 mt-1">
            Same-day service with verified providers across Kurnool.
          </p>
        </div>
      </div>

      {/* Categories grid */}
      <section className="px-4 mt-6">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Browse services</h3>
          <span className="text-xs text-gray-400">{categories.length} categories</span>
        </div>
        {categories.length === 0 ? (
          <EmptyState title="No services yet" description="Categories will appear here once added." />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {categories.map((c) => (
              <ServiceCategoryCard
                key={c.id}
                slug={c.slug}
                nameEn={c.name_en}
                nameTe={c.name_te}
                emoji={c.emoji || SERVICE_CATEGORY_META[c.slug]?.emoji || '🛠️'}
                basePrice={c.base_price}
                href={`/services/${c.slug}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Featured packages */}
      {featured.length > 0 && (
        <section className="px-4 mt-6">
          <PageHeader title="Popular packages" />
          <div className="space-y-3 mt-3">
            {featured.map((p) => (
              <Link
                key={p.id}
                href={`/services/book/${p.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-full bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
                    {p.category?.emoji || '🛠️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{p.name_en}</p>
                    {p.name_te && (
                      <p className="text-[11px] text-gray-500 font-telugu">{p.name_te}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {p.description_en || `${p.duration_mins} mins`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-[#1A56DB]">{formatPrice(p.price)}</p>
                    <p className="text-[10px] text-gray-400">{p.duration_mins}m</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Function halls teaser */}
      <section className="px-4 mt-6 mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Function halls</h3>
          <Link href="/services/halls" className="text-xs text-[#1A56DB] font-medium flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {halls.length === 0 ? (
          <Link
            href="/services/halls"
            className="block rounded-2xl bg-gradient-to-r from-pink-500 to-orange-500 p-4 text-white"
          >
            <p className="text-base font-bold">🎉 Book a function hall</p>
            <p className="text-xs opacity-90 mt-1">Marriages, birthdays, parties &amp; more</p>
          </Link>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {halls.map((h) => (
              <Link
                key={h.id}
                href={`/services/halls/${h.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-3 shadow-sm"
              >
                <p className="text-sm font-semibold text-gray-900 line-clamp-1">{h.name}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Capacity {h.capacity}</p>
                <p className="text-xs text-[#1A56DB] font-bold mt-1">{formatPrice(h.price_per_day)}/day</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
