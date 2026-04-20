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
import { motion } from 'framer-motion'
import { Zap, Calendar, Flame } from 'lucide-react'
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
    return <ShoppingHomeSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Delivery Promise Strip ─── */}
      <div className="relative overflow-hidden bg-gradient-brand">
        <div className="relative flex items-center justify-center gap-4 px-4 py-2">
          <div className="flex items-center gap-1.5 text-white">
            <Zap className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
            <span className="text-[11px] font-semibold">Express 2hr</span>
          </div>
          <div className="h-3 w-px bg-white/30" />
          <div className="flex items-center gap-1.5 text-white">
            <Calendar className="h-3.5 w-3.5 text-white/90" />
            <span className="text-[11px] font-semibold">Same Day</span>
          </div>
          <div className="h-3 w-px bg-white/30" />
          <span className="text-[11px] font-semibold text-white">🎁 Free above ₹499</span>
        </div>
      </div>

      {/* ── Hero Carousel ─── */}
      {activeBanners.length > 0 ? (
        <HomeCarousel banners={activeBanners} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-4 mt-4 relative rounded-3xl p-6 text-white overflow-hidden shadow-immersive"
          style={{ background: 'linear-gradient(135deg, #312E81 0%, #4F46E5 60%, #7C3AED 100%)', height: 210 }}
        >
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -right-4 -bottom-10 h-36 w-36 rounded-full bg-amber-400/20 blur-2xl" />
          <div className="relative h-full flex flex-col justify-center">
            <p className="text-[11px] font-bold uppercase tracking-wider opacity-90 mb-1.5">🚀 Same Day Delivery</p>
            <h2 className="text-[26px] font-extrabold leading-[1.1] mb-2">
              Kurnool&apos;s Local<br />Shops, At Your Door
            </h2>
            <p className="text-sm opacity-90">Order by 4 PM · Delivered today!</p>
          </div>
        </motion.div>
      )}

      {/* ── Bento Category Grid (4-column, information-dense) ─── */}
      {activeCategories.length > 0 && (
        <div className="mt-6">
          <SectionHeader title="Shop by Category" href="/categories" />
          <div className="grid grid-cols-4 gap-2.5 px-4">
            {activeCategories.slice(0, 8).map((cat, idx) => {
              const emoji = CATEGORY_EMOJIS[cat.slug] ?? '🏪'
              const gradients = [
                'from-brand-50 to-brand-100',
                'from-rose-50 to-rose-100',
                'from-amber-50 to-amber-100',
                'from-emerald-50 to-emerald-100',
                'from-purple-50 to-purple-100',
                'from-sky-50 to-sky-100',
                'from-pink-50 to-pink-100',
                'from-teal-50 to-teal-100',
              ]
              return (
                <Link key={cat.id} href={`/categories/${cat.slug}`}>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className={`flex flex-col items-center justify-center gap-1.5 aspect-square rounded-2xl bg-gradient-to-br ${gradients[idx % gradients.length]} p-2 shadow-soft hover:shadow-card-hover transition-shadow border border-white/60`}
                  >
                    <span className="text-[26px] leading-none">{emoji}</span>
                    <span className="text-[10px] font-semibold text-gray-800 text-center line-clamp-2 leading-tight">
                      {cat.name_en}
                    </span>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Flash Deals (high-contrast urgency) ─── */}
      {activeFlashSales.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Flame className="h-5 w-5 text-rose-500 fill-rose-500" />
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <span className="text-base font-extrabold text-gray-900">Flash Deals</span>
              <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                <CountdownTimer endsAt={activeFlashSales[0].ends_at} className="text-rose-600 font-bold" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
            {activeFlashSales.map((sale, idx) => {
              const pct = sale.stock_qty > 0 ? (sale.sold_qty / sale.stock_qty) * 100 : 0
              const urgencyHigh = pct > 70
              return (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex-shrink-0 w-40 bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100 card-interactive"
                >
                  <div className="relative h-28 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 flex items-center justify-center text-4xl">
                    📦
                    <span className="absolute top-1.5 left-1.5 bg-gradient-sunrise text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                      HOT
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-gray-900 line-clamp-2 mb-1.5 leading-tight min-h-[2rem]">
                      {sale.title_en}
                    </p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-base font-extrabold text-rose-600">₹{sale.sale_price}</span>
                      <span className="text-[11px] line-through text-gray-400">₹{sale.original_price}</span>
                    </div>
                    <div className="space-y-1">
                      <ProgressBar
                        value={pct}
                        color={urgencyHigh ? 'bg-gradient-sunrise' : 'bg-brand-500'}
                      />
                      <p className={`text-[10px] font-semibold ${urgencyHigh ? 'text-rose-600' : 'text-gray-500'}`}>
                        {urgencyHigh ? '🔥 ' : ''}{sale.sold_qty} sold · {Math.max(0, sale.stock_qty - sale.sold_qty)} left
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Popular Shops ─── */}
      {topVendors.length > 0 && (
        <div className="mt-6">
          <SectionHeader title="Popular Shops" href="/vendors" />
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
      <div className="mt-6 mb-8">
        <SectionHeader title="New Arrivals" href="/search" />
        {latestProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 px-4">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} showVendor />
            ))}
          </div>
        ) : (
          <div className="text-center px-8 py-12">
            <div className="text-5xl mb-3">🛒</div>
            <p className="text-sm text-gray-500">
              Local vendors are setting up their shops. Check back shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Skeleton ─── */
function ShoppingHomeSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <div className="h-8 bg-gradient-brand" />
      <div className="mx-4 mt-4 skeleton h-52 rounded-3xl" />
      <div className="mt-6 px-4">
        <div className="skeleton h-5 w-36 rounded mb-3" />
        <div className="grid grid-cols-4 gap-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="mt-6 px-4">
        <div className="skeleton h-5 w-36 rounded mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-soft">
              <div className="skeleton aspect-square" />
              <div className="p-2.5 space-y-2">
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
