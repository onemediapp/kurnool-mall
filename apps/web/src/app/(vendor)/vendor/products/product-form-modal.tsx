'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Upload, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared'
import type { Product, Category } from '@/lib/types'

const UNITS = ['piece', 'kg', 'gram', 'litre', 'ml', 'pack', 'dozen', 'metre', 'box', 'bag', 'bundle']
const MAX_IMAGES = 5

interface ProductFormModalProps {
  vendorId: string
  product?: Product | null
  onClose: () => void
  onSaved: () => void
}

type Step = 0 | 1 | 2

export function ProductFormModal({ vendorId, product, onClose, onSaved }: ProductFormModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [step, setStep] = useState<Step>(0)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [uploadingCount, setUploadingCount] = useState(0)

  const [form, setForm] = useState({
    name_en: product?.name_en || '',
    name_te: product?.name_te || '',
    category_id: product?.category_id || '',
    subcategory_id: '',
    unit: product?.unit || 'piece',
    price_mrp: product?.price_mrp?.toString() || '',
    price_selling: product?.price_selling?.toString() || '',
    stock_qty: product?.stock_qty?.toString() || '50',
    low_stock_threshold: '5',
    description_en: product?.description_en || '',
    description_te: product?.description_te || '',
    is_available: product?.is_available ?? true,
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setCategories((data ?? []) as Category[]))
  }, [])

  const parentCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories])
  const subcategories = useMemo(
    () => categories.filter((c) => c.parent_id === form.category_id),
    [categories, form.category_id]
  )

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key as string]: '' }))
  }

  const discount = useMemo(() => {
    const mrp = Number(form.price_mrp)
    const sp = Number(form.price_selling)
    if (!mrp || !sp || mrp <= sp) return 0
    return Math.round(((mrp - sp) / mrp) * 100)
  }, [form.price_mrp, form.price_selling])

  function validateStep(s: Step): boolean {
    const e: Record<string, string> = {}
    if (s === 0) {
      if (!form.name_en.trim()) e.name_en = 'Product name is required'
      if (!form.category_id) e.category_id = 'Please select a category'
    }
    if (s === 1) {
      const sp = Number(form.price_selling)
      const mrp = Number(form.price_mrp)
      if (!sp || sp <= 0) e.price_selling = 'Valid selling price is required'
      if (mrp && mrp < sp) e.price_mrp = 'MRP must be ≥ selling price'
      if (!form.stock_qty || Number(form.stock_qty) < 0) e.stock_qty = 'Valid stock is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const allowed = MAX_IMAGES - images.length
    const toUpload = files.slice(0, allowed)
    const supabase = createClient()
    setUploadingCount(toUpload.length)
    const uploaded: string[] = []
    for (const file of toUpload) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((p) => ({ ...p, images: `${file.name} exceeds 5MB` }))
        continue
      }
      const ext = file.name.split('.').pop()
      const path = `${vendorId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, { contentType: file.type })
      if (upErr) {
        setErrors((p) => ({ ...p, images: 'Upload failed: ' + upErr.message }))
        continue
      }
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      uploaded.push(data.publicUrl)
    }
    setImages((prev) => [...prev, ...uploaded])
    setUploadingCount(0)
    e.target.value = ''
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    if (!validateStep(0) || !validateStep(1)) {
      setStep(0)
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        vendor_id: vendorId,
        category_id: form.subcategory_id || form.category_id,
        name_en: form.name_en.trim(),
        name_te: form.name_te.trim(),
        description_en: form.description_en.trim() || null,
        description_te: form.description_te.trim() || null,
        price_mrp: Number(form.price_mrp) || Number(form.price_selling),
        price_selling: Number(form.price_selling),
        stock_qty: Number(form.stock_qty),
        unit: form.unit,
        is_available: form.is_available,
        images,
      }
      const { error } = product
        ? await supabase.from('products').update(payload).eq('id', product.id)
        : await supabase.from('products').insert(payload)
      if (error) {
        setErrors({ submit: error.message })
        setSaving(false)
        return
      }
      onSaved()
    } catch {
      setErrors({ submit: 'Failed to save product. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  function next() {
    if (validateStep(step)) setStep((s) => Math.min(2, s + 1) as Step)
  }
  function back() {
    setStep((s) => Math.max(0, s - 1) as Step)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full" aria-label="Close">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 py-4 border-b border-gray-100">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={
                'h-2 rounded-full transition-all ' +
                (i === step ? 'w-8 bg-shop' : i < step ? 'w-2 bg-shop/60' : 'w-2 bg-gray-200')
              }
            />
          ))}
          <span className="ml-3 text-xs text-gray-500">
            Step {step + 1} of 3 — {step === 0 ? 'Basic Info' : step === 1 ? 'Pricing & Stock' : 'Images & Description'}
          </span>
        </div>

        <div className="p-5 space-y-4">
          {step === 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Product Name (English) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name_en}
                  onChange={(e) => setField('name_en', e.target.value)}
                  placeholder="e.g. Basmati Rice 1kg"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shop ${errors.name_en ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.name_en && <p className="text-xs text-red-600 mt-1">{errors.name_en}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Product Name (Telugu)
                </label>
                <input
                  type="text"
                  value={form.name_te}
                  onChange={(e) => setField('name_te', e.target.value)}
                  placeholder="e.g. బాస్మతి బియ్యం 1kg"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shop font-telugu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => {
                    setField('category_id', e.target.value)
                    setField('subcategory_id', '')
                  }}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-shop ${errors.category_id ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Select category...</option>
                  {parentCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name_en}</option>
                  ))}
                </select>
                {errors.category_id && <p className="text-xs text-red-600 mt-1">{errors.category_id}</p>}
              </div>

              {subcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subcategory</label>
                  <select
                    value={form.subcategory_id}
                    onChange={(e) => setField('subcategory_id', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-shop"
                  >
                    <option value="">All</option>
                    {subcategories.map((sc) => (
                      <option key={sc.id} value={sc.id}>{sc.name_en}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
                <select
                  value={form.unit}
                  onChange={(e) => setField('unit', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-shop"
                >
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">MRP (₹)</label>
                  <input
                    type="number"
                    value={form.price_mrp}
                    onChange={(e) => setField('price_mrp', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shop ${errors.price_mrp ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {errors.price_mrp && <p className="text-xs text-red-600 mt-1">{errors.price_mrp}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.price_selling}
                    onChange={(e) => setField('price_selling', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shop ${errors.price_selling ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {errors.price_selling && <p className="text-xs text-red-600 mt-1">{errors.price_selling}</p>}
                </div>
              </div>

              {discount > 0 && (
                <div className="text-xs font-medium bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2">
                  Auto-calculated discount: <strong>{discount}% off</strong>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Qty</label>
                  <input
                    type="number"
                    value={form.stock_qty}
                    onChange={(e) => setField('stock_qty', e.target.value)}
                    min="0"
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shop ${errors.stock_qty ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {errors.stock_qty && <p className="text-xs text-red-600 mt-1">{errors.stock_qty}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Low Stock Alert</label>
                  <input
                    type="number"
                    value={form.low_stock_threshold}
                    onChange={(e) => setField('low_stock_threshold', e.target.value)}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shop"
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images <span className="text-xs text-gray-400">(up to {MAX_IMAGES})</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((url, idx) => (
                    <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                        aria-label="Remove image"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < MAX_IMAGES && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-500 cursor-pointer hover:bg-gray-50">
                      <Upload className="h-5 w-5" />
                      <span className="text-[11px]">
                        {uploadingCount > 0 ? `Uploading ${uploadingCount}...` : 'Add'}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleImageUpload}
                        className="sr-only"
                        disabled={uploadingCount > 0}
                      />
                    </label>
                  )}
                </div>
                {errors.images && <p className="text-xs text-red-600 mt-1">{errors.images}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (English)</label>
                <textarea
                  value={form.description_en}
                  onChange={(e) => setField('description_en', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shop resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (Telugu)</label>
                <textarea
                  value={form.description_te}
                  onChange={(e) => setField('description_te', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-shop resize-none font-telugu"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">Available for sale</p>
                  <p className="text-xs text-gray-500">Customers can see and buy this product</p>
                </div>
                <button
                  type="button"
                  onClick={() => setField('is_available', !form.is_available)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${form.is_available ? 'bg-shop' : 'bg-gray-300'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_available ? 'translate-x-6' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </>
          )}

          {errors.submit && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              ⚠ {errors.submit}
            </p>
          )}
        </div>

        {/* Footer: Back / Next or Save */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex gap-3">
          {step > 0 ? (
            <Button variant="outline" size="md" onClick={back} className="flex-1">Back</Button>
          ) : (
            <Button variant="outline" size="md" onClick={onClose} className="flex-1">Cancel</Button>
          )}
          {step < 2 ? (
            <Button variant="primary-shop" size="md" onClick={next} className="flex-1">Next</Button>
          ) : (
            <Button variant="primary-shop" size="md" loading={saving} onClick={handleSave} className="flex-1">
              {product ? 'Save Changes' : 'Add Product'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
