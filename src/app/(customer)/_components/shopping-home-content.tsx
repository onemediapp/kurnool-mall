'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProductCard } from '@/components/customer/product-card'
import {
  SectionHeader, CountdownTimer, VendorCard, ProgressBar,
} from '@/components/shared'
import type { Category, Product, Vendor, Banner, FlashSale } from '@/lib/types'
import HomeCarousel from './home-carousel'
import Link from 'next/link'
import { Zap, Calendar } from 'lucide-react'
import { CATEGORY_EMOJIS } from '@/lib/utils'

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
          <div className="h-8 w-8 rounded-full border-2 border-[#1A56DB] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading shopping...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
