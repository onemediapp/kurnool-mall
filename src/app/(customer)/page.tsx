import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/customer/product-card'
import {
  SectionHeader, CountdownTimer, VendorCard, ProgressBar, NotificationBell,
} from '@/components/shared'
import type { Category, Product, Vendor, Banner, FlashSale } from '@/lib/types'
import HomeCarousel from './_components/home-carousel'
import Link from 'next/link'
import { Search, MapPin, Zap, Calendar } from 'lucide-react'
import { CATEGORY_EMOJIS } from '@/lib/utils'

export const revalidate = 60

export default async function HomePage() {
  const supabase = createClient()

  const [
    { data: banners },
    { data: categories },
    { data: flashSales },
    { data: products },
    { data: vendors },
  ] = await Promise.all([
    supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .limit(5),
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .limit(8),
    supabase
      .from('flash_sales')
      .select('*, product:products(*)')
      .eq('is_active', true)
      .gt('ends_at', new Date().toISOString())
      .order('ends_at')
      .limit(4),
    supabase
      .from('products')
      .select('*, vendor:vendors(id, shop_name, rating)')
      .eq('is_available', true)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('vendors')
      .select('*')
      .eq('is_active', true)
      .gte('rating', 4.0)
      .order('rating', { ascending: false })
      .limit(6),
  ])

  const activeBanners = (banners as Banner[] | null) ?? []
  const activeCategories = (categories as Category[] | null) ?? []
  const activeFlashSales = (flashSales as FlashSale[] | null) ?? []
  const latestProducts = (products as Product[] | null) ?? []
  const topVendors = (vendors as Vendor[] | null) ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky Header ─── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-50 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-lg font-extrabold text-[#1A56DB]">Kurnool Mall</span>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">Kurnool, Andhra Pradesh</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
          </div>
        </div>
        <Link href="/search" className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-400">Search products, shops...</span>
        </Link>
      </header>

      {/* ── Delivery Promise Strip ─── */}
      <div className="flex items-center justify-center gap-5 bg-[#1A56DB] px-4 py-2">
        <div className="flex items-center gap-1.5 text-white">
          <Zap className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
          <span className="text-xs font-medium">Express 2hr</span>
        </div>
        <div className="h-3 w-px bg-white/30" />
        <div className="flex items-center gap-1.5 text-white">
          <Calendar className="h-3.5 w-3.5 text-white/80" />
          <span className="text-xs font-medium">Same Day Delivery</span>
        </div>
        <div className="h-3 w-px bg-white/30" />
        <span className="text-xs font-medium text-white">🎁 Free above ₹499</span>
      </div>

      {/* ── Hero Carousel ─── */}
      {activeBanners.length > 0 ? (
        <HomeCarousel banners={activeBanners} />
      ) : (
        <div
          className="mx-4 mt-4 rounded-2xl p-6 text-white"
          style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #1A56DB 100%)', height: 200 }}
        >
          <div className="h-full flex flex-col justify-center">
            <p className="text-xs font-medium opacity-80 mb-1">🚀 Same Day Delivery</p>
            <h2 className="text-2xl font-extrabold leading-tight mb-2">
              Kurnool&apos;s Local<br />Shops, At Your Door
            </h2>
            <p className="text-sm opacity-80">Order by 4 PM · Delivered today!</p>
          </div>
        </div>
      )}

      {/* ── Category Quick-Select ─── */}
      {activeCategories.length > 0 && (
        <div className="mt-5">
          <SectionHeader title="Shop by Category" />
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-1">
            {activeCategories.map((cat) => {
              const emoji = CATEGORY_EMOJIS[cat.slug] ?? '🏪'
              return (
                <Link key={cat.id} href={`/categories/${cat.slug}`} className="flex-shrink-0">
                  <div className="flex flex-col items-center gap-1.5 w-16">
                    <div className="h-14 w-14 rounded-2xl bg-[#DBEAFE] flex items-center justify-center text-2xl shadow-sm hover:shadow-md transition-shadow">
                      {emoji}
                    </div>
                    <span className="text-[10px] font-medium text-gray-700 text-center line-clamp-2 leading-tight">
                      {cat.name_en}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Flash Deals ─── */}
      {activeFlashSales.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-gray-900">⚡ Flash Deals</span>
              <div className="flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <CountdownTimer endsAt={activeFlashSales[0].ends_at} className="text-red-600" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
            {activeFlashSales.map((sale) => {
              const pct = sale.stock_qty > 0 ? (sale.sold_qty / sale.stock_qty) * 100 : 0
              return (
                <div key={sale.id} className="flex-shrink-0 w-36 bg-white rounded-2xl shadow-card overflow-hidden">
                  <div className="h-24 bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center text-3xl">
                    📦
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-gray-800 line-clamp-2 mb-1.5 leading-tight">
                      {sale.title_en}
                    </p>
                    <div className="flex items-baseline gap-1 mb-1.5">
                      <span className="text-sm font-bold text-red-600">₹{sale.sale_price}</span>
                      <span className="text-xs line-through text-gray-400">₹{sale.original_price}</span>
                    </div>
                    <ProgressBar value={pct} color="bg-red-500" label={`${sale.sold_qty} sold`} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Popular Shops ─── */}
      {topVendors.length > 0 && (
        <div className="mt-5">
          <SectionHeader title="Popular Shops" />
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
            {topVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                id={vendor.id}
                shopName={vendor.shop_name}
                rating={vendor.rating}
                isActive={vendor.is_active}
                logoUrl={vendor.logo_url}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Home Services ─── */}
      <div className="mt-5 px-4">
        <Link href="/services" className="block rounded-2xl bg-gradient-to-br from-[#1A56DB] to-[#7C3AED] p-5 text-white shadow-md hover:shadow-lg transition-shadow">
          <p className="text-xs font-medium opacity-90">🔧 NEW</p>
          <h3 className="text-lg font-bold mt-1">Home Services</h3>
          <p className="text-sm opacity-90 mt-0.5">Electricians, plumbers, cleaners &amp; more in Kurnool</p>
          <span className="inline-block mt-2 text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
            Explore services →
          </span>
        </Link>
      </div>

      {/* ── New Arrivals ─── */}
      <div className="mt-5 mb-6">
        <SectionHeader title="New Arrivals" href="/search" />
        {latestProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 px-4">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} showVendor />
            ))}
          </div>
        ) : (
          <div className="text-center px-8 py-10">
            <div className="text-4xl mb-3">🛒</div>
            <p className="text-sm text-gray-500">
              Local vendors are setting up their shops. Check back shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
