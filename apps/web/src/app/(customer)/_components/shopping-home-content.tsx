'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { ProductCard } from '@/components/customer/product-card'
import {
  SectionHeader, CountdownTimer, VendorCard, ProgressBar,
} from '@/components/shared'
import type { Category, Product, Vendor, Banner, FlashSale } from '@kurnool-mall/shared-types'
import HomeCarousel from './home-carousel'
import Link from 'next/link'
import { Zap, Calendar } from 'lucide-react'
import { CATEGORY_EMOJIS } from '@kurnool-mall/shared-utils'

export default function ShoppingHomeContent() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [flashSales, setFlashSales] = useState<FlashSale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [
          { data: bannersData },
          { data: categoriesData },
          { data: flashSalesData },
          { data: productsData },
          { data: vendorsData },
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

        setBanners((bannersData as Banner[] | null) ?? [])
        setCategories((categoriesData as Category[] | null) ?? [])
        setFlashSales((flashSalesData as FlashSale[] | null) ?? [])
        setProducts((productsData as Product[] | null) ?? [])
        setVendors((vendorsData as Vendor[] | null) ?? [])
      } catch (error) {
        console.error('Failed to fetch home content:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const activeBanners = banners
  const activeCategories = categories
  const activeFlashSales = flashSales
  const latestProducts = products
  const topVendors = vendors

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 rounded-full border-4 border-shop border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-600">Loading shopping...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* ── Delivery Promise Strip ─── */}
      <div className="flex items-center justify-center gap-5 bg-shop px-4 py-3 shadow-md">
        <div className="flex items-center gap-1.5 text-white">
          <Zap className="h-4 w-4 fill-amber-300 text-amber-300" />
          <span className="text-xs font-bold tracking-wide">Express 2hr</span>
        </div>
        <div className="h-4 w-px bg-white/30" />
        <div className="flex items-center gap-1.5 text-white">
          <Calendar className="h-4 w-4 text-white/90" />
          <span className="text-xs font-bold tracking-wide">Same Day Delivery</span>
        </div>
        <div className="h-4 w-px bg-white/30" />
        <span className="text-xs font-bold tracking-wide text-white">🎁 Free above ₹499</span>
      </div>

      {/* ── Hero Carousel ─── */}
      {activeBanners.length > 0 ? (
        <div className="mt-4 px-4">
          <HomeCarousel banners={activeBanners} />
        </div>
      ) : (
        <div className="mx-4 mt-5 rounded-3xl p-6 text-white hero-gradient shadow-lg flex flex-col justify-center min-h-[200px]">
          <p className="text-xs font-bold uppercase tracking-wider opacity-90 mb-2 flex items-center gap-1.5">
            <span className="bg-white/20 px-2.5 py-1 rounded-full">🚀 Same Day Delivery</span>
          </p>
          <h2 className="text-3xl font-extrabold leading-tight mb-3 tracking-tight">
            Kurnool&apos;s Local<br />Shops, At Your Door
          </h2>
          <p className="text-sm font-semibold opacity-90 bg-black/10 inline-block px-3 py-1.5 rounded-xl w-fit backdrop-blur-sm">
            Order by 4 PM · Delivered today!
          </p>
        </div>
      )}

      {/* ── Category Quick-Select ─── */}
      {activeCategories.length > 0 && (
        <div className="mt-8">
          <div className="relative mb-3 [&_h2]:font-extrabold [&_h2]:text-xl [&_h2]:text-gray-900">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 bg-shop rounded-r-full z-10" />
            <SectionHeader title="Shop by Category" />
          </div>
          <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide pb-2 pt-1">
            {activeCategories.map((cat) => {
              const emoji = CATEGORY_EMOJIS[cat.slug] ?? '🏪'
              return (
                <Link key={cat.id} href={`/categories/${cat.slug}`} className="flex-shrink-0 group">
                  <div className="flex flex-col items-center gap-2 w-[72px]">
                    <div className="h-[72px] w-[72px] rounded-2xl bg-shop-light flex items-center justify-center text-3xl shadow-sm border border-shop/10 group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300">
                      {emoji}
                    </div>
                    <span className="text-xs font-bold text-gray-700 text-center line-clamp-2 leading-tight group-hover:text-shop transition-colors">
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
        <div className="mt-8">
          <div className="flex items-center justify-between px-4 mb-4 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 bg-red-500 rounded-r-full z-10" />
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-gray-900 tracking-tight pl-1">⚡ Flash Deals</span>
            </div>
            <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
              <CountdownTimer endsAt={activeFlashSales[0].ends_at} className="text-red-600 font-bold text-sm" />
            </div>
          </div>
          <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide pb-4 pt-1">
            {activeFlashSales.map((sale) => {
              const pct = sale.stock_qty > 0 ? (sale.sold_qty / sale.stock_qty) * 100 : 0
              return (
                <div key={sale.id} className="flex-shrink-0 w-40 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 relative group">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-500 z-10" />
                  <div className="h-28 bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-300">
                    📦
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-gray-800 line-clamp-2 mb-2 leading-tight">
                      {sale.title_en}
                    </p>
                    <div className="flex items-end gap-1.5 mb-2.5">
                      <span className="text-lg font-black text-red-600 leading-none">₹{sale.sale_price}</span>
                      <span className="text-xs font-semibold line-through text-gray-400 mb-0.5">₹{sale.original_price}</span>
                    </div>
                    <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                      <ProgressBar value={pct} color="bg-gradient-to-r from-red-500 to-orange-500" label={`${sale.sold_qty} sold`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Popular Shops ─── */}
      {topVendors.length > 0 && (
        <div className="mt-8">
          <div className="relative mb-3 [&_h2]:font-extrabold [&_h2]:text-xl [&_h2]:text-gray-900">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 bg-shop rounded-r-full z-10" />
            <SectionHeader title="Popular Shops" />
          </div>
          <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide pb-4 pt-1">
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

      {/* ── New Arrivals ─── */}
      <div className="mt-8 mb-10">
        <div className="relative mb-4 [&_h2]:font-extrabold [&_h2]:text-xl [&_h2]:text-gray-900">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 bg-shop rounded-r-full z-10" />
          <SectionHeader title="New Arrivals" href="/search" />
        </div>
        {latestProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 px-4">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} showVendor />
            ))}
          </div>
        ) : (
          <div className="mx-4 bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm mt-2">
            <div className="text-5xl mb-4 bg-gray-50 w-20 h-20 mx-auto rounded-full flex items-center justify-center border border-gray-100">🛒</div>
            <p className="text-sm font-medium text-gray-500">
              Local vendors are setting up their shops. Check back shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
