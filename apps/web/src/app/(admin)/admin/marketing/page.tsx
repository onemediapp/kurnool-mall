'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Megaphone, Tag, Zap, Bell } from 'lucide-react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { Tabs } from '@/components/shared'
import { toast } from '@/components/shared/toast'
import { formatPrice } from '@kurnool-mall/shared-utils'
import type { Banner, Coupon, FlashSale } from '@kurnool-mall/shared-types'

export default function AdminMarketingPage() {
  const [tab, setTab] = useState('banners')
  const [banners, setBanners] = useState<Banner[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [flashSales, setFlashSales] = useState<FlashSale[]>([])
  const [loading, setLoading] = useState(true)

  // Flash sale modal
  const [showFlashModal, setShowFlashModal] = useState(false)
  const [fsProductSearch, setFsProductSearch] = useState('')
  const [fsProductResults, setFsProductResults] = useState<{ id: string; name_en: string; price_selling: number; vendor_id: string }[]>([])
  const [fsSelectedProduct, setFsSelectedProduct] = useState<{ id: string; name_en: string; price_selling: number; vendor_id: string } | null>(null)
  const [fsDiscount, setFsDiscount] = useState(10)
  const [fsStock, setFsStock] = useState('')
  const [fsStartsAt, setFsStartsAt] = useState('')
  const [fsEndsAt, setFsEndsAt] = useState('')
  const [fsActive, setFsActive] = useState(true)
  const [fsSaving, setFsSaving] = useState(false)

  // Banner modal
  const [showBannerModal, setShowBannerModal] = useState(false)
  const [bannerTitle, setBannerTitle] = useState('')
  const [bannerSubtitle, setBannerSubtitle] = useState('')
  const [bannerCta, setBannerCta] = useState('')
  const [bannerBgColor, setBannerBgColor] = useState('#1E3A5F')
  const [bannerSaving, setBannerSaving] = useState(false)

  // Coupon modal
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponType, setCouponType] = useState<'percent' | 'flat'>('percent')
  const [couponValue, setCouponValue] = useState('')
  const [couponMin, setCouponMin] = useState('')
  const [couponMax, setCouponMax] = useState('')
  const [couponLimit, setCouponLimit] = useState('')
  const [couponSaving, setCouponSaving] = useState(false)

  // Banner drag state
  const [bannerDragId, setBannerDragId] = useState<string | null>(null)

  // Broadcast modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [bcastTitle, setBcastTitle] = useState('')
  const [bcastBody, setBcastBody] = useState('')
  const [bcastSaving, setBcastSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('banners').select('*').order('sort_order'),
      supabase.from('coupons').select('*').order('created_at', { ascending: false }),
      supabase.from('flash_sales').select('*, product:products(name_en, images)').order('created_at', { ascending: false }),
    ]).then(([bannersRes, couponsRes, flashRes]) => {
      setBanners((bannersRes.data ?? []) as Banner[])
      setCoupons((couponsRes.data ?? []) as unknown as Coupon[])
      setFlashSales((flashRes.data ?? []) as unknown as FlashSale[])
      setLoading(false)
    })
  }, [])

  async function reorderBanners(targetId: string) {
    if (!bannerDragId || bannerDragId === targetId) { setBannerDragId(null); return }
    const source = banners.find((b) => b.id === bannerDragId)
    const targetIdx = banners.findIndex((b) => b.id === targetId)
    if (!source || targetIdx < 0) { setBannerDragId(null); return }
    const next = banners.filter((b) => b.id !== bannerDragId)
    next.splice(targetIdx, 0, source)
    setBanners(next)
    setBannerDragId(null)
    const supabase = createClient()
    await Promise.all(
      next.map((b, i) => supabase.from('banners').update({ sort_order: i }).eq('id', b.id))
    )
  }

  async function toggleBanner(id: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('banners').update({ is_active: !current }).eq('id', id)
    setBanners((prev) => prev.map((b) => b.id === id ? { ...b, is_active: !current } : b))
  }

  async function saveBanner() {
    if (!bannerTitle.trim()) return
    setBannerSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('banners').insert({
      title_en: bannerTitle.trim(),
      subtitle_en: bannerSubtitle.trim() || null,
      cta_text_en: bannerCta.trim() || null,
      bg_color: bannerBgColor,
      is_active: true,
      sort_order: banners.length,
    }).select().single()
    if (error) { toast.error('Failed to save banner'); }
    else { setBanners((prev) => [...prev, data as Banner]); toast.success('Banner added!'); setShowBannerModal(false); setBannerTitle(''); }
    setBannerSaving(false)
  }

  async function saveCoupon() {
    if (!couponCode.trim() || !couponValue) return
    setCouponSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('coupons').insert({
      code: couponCode.trim().toUpperCase(),
      discount_type: couponType,
      discount_value: Number(couponValue),
      min_order_amount: couponMin ? Number(couponMin) : 0,
      max_discount_amount: couponMax ? Number(couponMax) : null,
      usage_limit: couponLimit ? Number(couponLimit) : null,
      is_active: true,
      expires_at: null,
    }).select().single()
    if (error) { toast.error('Failed to create coupon'); }
    else { setCoupons((prev) => [data as unknown as Coupon, ...prev]); toast.success('Coupon created!'); setShowCouponModal(false); setCouponCode(''); setCouponValue(''); }
    setCouponSaving(false)
  }

  async function sendBroadcast() {
    if (!bcastTitle.trim()) return
    setBcastSaving(true)
    try {
      const supabase = createClient()
      // Get all user IDs
      const { data: users } = await supabase.from('users').select('id')
      if (users && users.length > 0) {
        const notifications = users.map((u) => ({
          user_id: u.id,
          type: 'system',
          title: bcastTitle.trim(),
          body: bcastBody.trim() || null,
          is_read: false,
        }))
        await supabase.from('notifications').insert(notifications)
        toast.success(`Broadcast sent to ${users.length} users!`)
      }
      setShowBroadcastModal(false)
      setBcastTitle('')
      setBcastBody('')
    } catch {
      toast.error('Failed to send broadcast')
    } finally {
      setBcastSaving(false)
    }
  }

  async function searchProducts(q: string) {
    setFsProductSearch(q)
    if (!q.trim()) { setFsProductResults([]); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('id, name_en, price_selling, vendor_id')
      .ilike('name_en', `%${q}%`)
      .eq('is_deleted', false)
      .limit(6)
    setFsProductResults((data ?? []) as { id: string; name_en: string; price_selling: number; vendor_id: string }[])
  }

  async function saveFlashSale() {
    if (!fsSelectedProduct || !fsStock || !fsStartsAt || !fsEndsAt) return
    setFsSaving(true)
    const salePrice = Math.round(fsSelectedProduct.price_selling * (1 - fsDiscount / 100))
    const supabase = createClient()
    const { data, error } = await supabase.from('flash_sales').insert({
      product_id: fsSelectedProduct.id,
      vendor_id: fsSelectedProduct.vendor_id,
      title_en: `${fsDiscount}% Off — ${fsSelectedProduct.name_en}`,
      title_te: '',
      discount_percent: fsDiscount,
      original_price: fsSelectedProduct.price_selling,
      sale_price: salePrice,
      stock_qty: Number(fsStock),
      sold_qty: 0,
      starts_at: fsStartsAt,
      ends_at: fsEndsAt,
      is_active: fsActive,
    }).select('*, product:products(name_en, images)').single()
    if (error) { toast.error('Failed to create flash sale') }
    else {
      setFlashSales((prev) => [data as unknown as FlashSale, ...prev])
      toast.success('Flash sale created!')
      setShowFlashModal(false)
      setFsSelectedProduct(null)
      setFsProductSearch('')
      setFsProductResults([])
      setFsDiscount(10)
      setFsStock('')
      setFsStartsAt('')
      setFsEndsAt('')
    }
    setFsSaving(false)
  }

  async function toggleFlashSale(id: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('flash_sales').update({ is_active: !current }).eq('id', id)
    setFlashSales((prev) => prev.map((f) => f.id === id ? { ...f, is_active: !current } : f))
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
        <button
          onClick={() => setShowBroadcastModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <Bell className="h-4 w-4" /> Broadcast
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { id: 'banners', label: 'Banners', icon: Megaphone },
          { id: 'coupons', label: 'Coupons', icon: Tag },
          { id: 'flash', label: 'Flash Sales', icon: Zap },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.id ? 'bg-[#1A56DB] text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Loading...</div>
      ) : (
        <>
          {/* Banners */}
          {tab === 'banners' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowBannerModal(true)} className="flex items-center gap-2 bg-[#1A56DB] text-white px-4 py-2 rounded-xl text-sm font-semibold">
                  <Plus className="h-4 w-4" /> Add Banner
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">Drag cards to reorder. Preview shows how customers see each banner (16:7 rounded-2xl).</p>
              <div className="space-y-4">
                {banners.map((banner) => (
                  <div
                    key={banner.id}
                    draggable
                    onDragStart={() => setBannerDragId(banner.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => reorderBanners(banner.id)}
                    className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 ${bannerDragId === banner.id ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="cursor-grab text-gray-400">⋮⋮</span>
                        <span className="text-xs font-mono text-gray-400">#{banner.sort_order + 1}</span>
                        <p className="text-sm font-semibold text-gray-900">{banner.title_en}</p>
                      </div>
                      <button
                        onClick={() => toggleBanner(banner.id, banner.is_active)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${banner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                    {/* Live preview — matches customer view */}
                    <div
                      className="relative rounded-2xl overflow-hidden aspect-[16/7] flex flex-col justify-center p-5"
                      style={{ background: banner.bg_color || '#1E3A5F' }}
                    >
                      {banner.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={banner.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      )}
                      <div className="relative">
                        <p className="text-white text-lg font-bold">{banner.title_en}</p>
                        {banner.subtitle_en && <p className="text-white/90 text-sm mt-1">{banner.subtitle_en}</p>}
                        {banner.cta_text_en && (
                          <span className="inline-block mt-2 bg-white/20 backdrop-blur text-white text-xs font-semibold rounded-full px-3 py-1">
                            {banner.cta_text_en}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {banners.length === 0 && <p className="text-center text-gray-400 py-8">No banners yet</p>}
              </div>
            </div>
          )}

          {/* Coupons */}
          {tab === 'coupons' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowCouponModal(true)} className="flex items-center gap-2 bg-[#1A56DB] text-white px-4 py-2 rounded-xl text-sm font-semibold">
                  <Plus className="h-4 w-4" /> Create Coupon
                </button>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Discount</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Used</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {coupons.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-mono font-bold text-gray-900">{c.code}</td>
                        <td className="px-5 py-3 text-gray-700">
                          {c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                          {c.min_order_amount > 0 && <span className="text-gray-400 text-xs"> (min ₹{c.min_order_amount})</span>}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-600">{c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ''}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {c.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {coupons.length === 0 && (
                      <tr><td colSpan={4} className="text-center text-gray-400 py-8">No coupons yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Flash Sales */}
          {tab === 'flash' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowFlashModal(true)} className="flex items-center gap-2 bg-[#1A56DB] text-white px-4 py-2 rounded-xl text-sm font-semibold">
                  <Plus className="h-4 w-4" /> Create Flash Sale
                </button>
              </div>
              <div className="space-y-3">
                {flashSales.map((fs) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const product = (fs as any).product as { name_en: string; images?: string[] } | undefined
                  const now = new Date()
                  const starts = new Date(fs.starts_at)
                  const ends = new Date(fs.ends_at)
                  const isLive = fs.is_active && now >= starts && now <= ends
                  return (
                    <div key={fs.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                            <Zap className="h-5 w-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{product?.name_en ?? fs.title_en}</p>
                            <p className="text-xs text-orange-600 font-semibold">{fs.discount_percent}% off — {formatPrice(fs.sale_price)} <span className="text-gray-400 line-through">{formatPrice(fs.original_price)}</span></p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(fs.starts_at).toLocaleString()} → {new Date(fs.ends_at).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">{fs.sold_qty}/{fs.stock_qty} sold</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isLive && <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
                          <button
                            onClick={() => toggleFlashSale(fs.id, fs.is_active)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${fs.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                          >
                            {fs.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {flashSales.length === 0 && <p className="text-center text-gray-400 py-8">No flash sales yet</p>}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Banner Modal */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Add Banner</h3>
              <button onClick={() => setShowBannerModal(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="space-y-3">
              <input value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="Title *" />
              <input value={bannerSubtitle} onChange={(e) => setBannerSubtitle(e.target.value)} className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="Subtitle" />
              <input value={bannerCta} onChange={(e) => setBannerCta(e.target.value)} className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="CTA Text (e.g. Shop Now)" />
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700">Background Color</label>
                <input type="color" value={bannerBgColor} onChange={(e) => setBannerBgColor(e.target.value)} className="w-8 h-8 rounded" />
                <span className="text-xs text-gray-500">{bannerBgColor}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowBannerModal(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl">Cancel</button>
              <button onClick={saveBanner} disabled={bannerSaving || !bannerTitle.trim()} className="flex-1 bg-[#1A56DB] text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50">
                {bannerSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Create Coupon</h3>
              <button onClick={() => setShowCouponModal(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="space-y-3">
              <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm font-mono outline-none uppercase" placeholder="COUPON CODE *" />
              <div className="flex gap-2">
                {(['percent', 'flat'] as const).map((t) => (
                  <button key={t} onClick={() => setCouponType(t)} className={`flex-1 py-2 rounded-xl text-xs font-semibold ${couponType === t ? 'bg-[#1A56DB] text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {t === 'percent' ? '% Off' : '₹ Flat'}
                  </button>
                ))}
              </div>
              <input value={couponValue} onChange={(e) => setCouponValue(e.target.value)} type="number" className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none" placeholder={couponType === 'percent' ? 'Discount % *' : 'Discount ₹ *'} />
              <input value={couponMin} onChange={(e) => setCouponMin(e.target.value)} type="number" className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="Min order amount (₹)" />
              <input value={couponMax} onChange={(e) => setCouponMax(e.target.value)} type="number" className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="Max discount (₹, for % type)" />
              <input value={couponLimit} onChange={(e) => setCouponLimit(e.target.value)} type="number" className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="Usage limit (leave blank for unlimited)" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowCouponModal(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl">Cancel</button>
              <button onClick={saveCoupon} disabled={couponSaving || !couponCode.trim() || !couponValue} className="flex-1 bg-[#1A56DB] text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50">
                {couponSaving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Flash Sale Modal */}
      {showFlashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Create Flash Sale</h3>
              <button onClick={() => { setShowFlashModal(false); setFsSelectedProduct(null); setFsProductSearch(''); setFsProductResults([]) }}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Product picker */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Product *</label>
                {fsSelectedProduct ? (
                  <div className="flex items-center justify-between bg-blue-50 rounded-xl px-3 py-2.5">
                    <p className="text-sm font-semibold text-brand">{fsSelectedProduct.name_en}</p>
                    <button onClick={() => { setFsSelectedProduct(null); setFsProductSearch('') }} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      value={fsProductSearch}
                      onChange={(e) => searchProducts(e.target.value)}
                      placeholder="Search products..."
                      className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none"
                    />
                    {fsProductResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                        {fsProductResults.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => { setFsSelectedProduct(p); setFsProductResults([]) }}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between"
                          >
                            <span>{p.name_en}</span>
                            <span className="text-xs text-gray-400">{formatPrice(p.price_selling)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Discount slider */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Discount: <span className="text-brand font-bold">{fsDiscount}%</span>
                  {fsSelectedProduct && (
                    <span className="text-gray-400 ml-2">
                      Sale price: <span className="font-semibold text-green-600">{formatPrice(Math.round(fsSelectedProduct.price_selling * (1 - fsDiscount / 100)))}</span>
                      <span className="line-through ml-1">{formatPrice(fsSelectedProduct.price_selling)}</span>
                    </span>
                  )}
                </label>
                <input
                  type="range"
                  min={5}
                  max={90}
                  value={fsDiscount}
                  onChange={(e) => setFsDiscount(Number(e.target.value))}
                  className="w-full accent-brand"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>5%</span><span>90%</span>
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Flash Sale Stock *</label>
                <input
                  type="number"
                  min={1}
                  value={fsStock}
                  onChange={(e) => setFsStock(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Starts At *</label>
                  <input
                    type="datetime-local"
                    value={fsStartsAt}
                    onChange={(e) => setFsStartsAt(e.target.value)}
                    className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Ends At *</label>
                  <input
                    type="datetime-local"
                    value={fsEndsAt}
                    onChange={(e) => setFsEndsAt(e.target.value)}
                    className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={fsActive} onChange={(e) => setFsActive(e.target.checked)} className="w-4 h-4 accent-brand" />
                <span className="text-sm font-medium text-gray-700">Active immediately</span>
              </label>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowFlashModal(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl">Cancel</button>
              <button
                onClick={saveFlashSale}
                disabled={fsSaving || !fsSelectedProduct || !fsStock || !fsStartsAt || !fsEndsAt}
                className="flex-1 bg-[#1A56DB] text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50"
              >
                {fsSaving ? 'Creating...' : 'Create Flash Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Broadcast Notification</h3>
              <button onClick={() => setShowBroadcastModal(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="space-y-3">
              <input value={bcastTitle} onChange={(e) => setBcastTitle(e.target.value)} className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="Notification title *" />
              <textarea value={bcastBody} onChange={(e) => setBcastBody(e.target.value)} rows={3} className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none resize-none" placeholder="Message body (optional)" />
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2">⚠️ This will send to ALL users. Use carefully.</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowBroadcastModal(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl">Cancel</button>
              <button onClick={sendBroadcast} disabled={bcastSaving || !bcastTitle.trim()} className="flex-1 bg-purple-600 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50">
                {bcastSaving ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
