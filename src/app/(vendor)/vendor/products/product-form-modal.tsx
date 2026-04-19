'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared'
import type { Product, Category } from '@/lib/types'

const UNITS = ['piece', 'kg', 'gram', 'litre', 'ml', 'pack', 'dozen', 'metre', 'box', 'bag', 'bundle']

interface ProductFormModalProps {
  vendorId: string
  product?: Product | null
  onClose: () => void
  onSaved: () => void
}

export function ProductFormModal({ vendorId, product, onClose, onSaved }: ProductFormModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(product?.images?.[0] || null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    name_en: product?.name_en || '',
    name_te: product?.name_te || '',
    category_id: product?.category_id || '',
    price_mrp: product?.price_mrp?.toString() || '',
    price_selling: product?.price_selling?.toString() || '',
    stock_qty: product?.stock_qty?.toString() || '50',
    unit: product?.unit || 'piece',
    description_en: product?.description_en || '',
    description_te: product?.description_te || '',
    is_available: product?.is_available ?? true,
  })

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    const supabase = createClient()
    const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
    setCategories((data ?? []) as Category[])
  }

  function setField(key: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'Image must be under 5MB' }))
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!form.name_en.trim()) newErrors.name_en = 'Product name is required'
    if (!form.category_id) newErrors.category_id = 'Please select a category'
    if (!form.price_selling || Number(form.price_selling) <= 0) {
      newErrors.price_selling = 'Valid selling price is required'
    }
    if (form.price_mrp && Number(form.price_mrp) < Number(form.price_selling)) {
      newErrors.price_mrp = 'MRP must be >= selling price'
    }
    if (!form.stock_qty || Number(form.stock_qty) < 0) {
      newErrors.stock_qty = 'Valid stock quantity is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSave() {
    if (!validate()) return

    setSaving(true)
    try {
      const supabase = createClient()
      let imageUrl = product?.images?.[0] || null

      // Upload new image if provided
      if (imageFile) {
        setUploading(true)
        const ext = imageFile.name.split('.').pop()
        const path = `products/${vendorId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, imageFile, { contentType: imageFile.type })

        if (uploadError) {
          setErrors((prev) => ({ ...prev, image: 'Image upload failed: ' + uploadError.message }))
          setSaving(false)
          setUploading(false)
          return
        }

        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
        imageUrl = urlData.publicUrl
        setUploading(false)
      }

      const payload = {
        vendor_id: vendorId,
        category_id: form.category_id,
        name_en: form.name_en.trim(),
        name_te: form.name_te.trim(),
        description_en: form.description_en.trim() || null,
        description_te: form.description_te.trim() || null,
        price_mrp: Number(form.price_mrp) || Number(form.price_selling),
        price_selling: Number(form.price_selling),
        stock_qty: Number(form.stock_qty),
        unit: form.unit,
        is_available: form.is_available,
        images: imageUrl ? [imageUrl] : (product?.images || []),
      }

      if (product) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id)
        if (error) { setErrors({ submit: error.message }); setSaving(false); return }
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) { setErrors({ submit: error.message }); setSaving(false); return }
      }

      onSaved()
    } catch (e) {
      setErrors({ submit: 'Failed to save product. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div>
                <label className="cursor-pointer">
                  <span className="text-sm text-brand font-medium border border-brand px-3 py-2 rounded-lg hover:bg-brand-light transition-colors">
                    {uploading ? 'Uploading...' : 'Choose Image'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="sr-only"
                    disabled={uploading}
                  />
                </label>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP — max 5MB</p>
                {errors.image && <p className="text-xs text-red-600 mt-1">{errors.image}</p>}
              </div>
            </div>
          </div>

          {/* Name EN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Product Name (English) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name_en}
              onChange={(e) => setField('name_en', e.target.value)}
              placeholder="e.g. Basmati Rice 1kg"
              className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-brand ${errors.name_en ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.name_en && <p className="text-xs text-red-600 mt-1">{errors.name_en}</p>}
          </div>

          {/* Name TE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Product Name (Telugu)
            </label>
            <input
              type="text"
              value={form.name_te}
              onChange={(e) => setField('name_te', e.target.value)}
              placeholder="e.g. బాస్మతి బియ్యం 1kg"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-brand font-telugu"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category_id}
              onChange={(e) => setField('category_id', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-brand bg-white ${errors.category_id ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name_en}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-red-600 mt-1">{errors.category_id}</p>}
          </div>

          {/* Prices */}
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
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-brand ${errors.price_mrp ? 'border-red-400' : 'border-gray-300'}`}
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
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-brand ${errors.price_selling ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.price_selling && <p className="text-xs text-red-600 mt-1">{errors.price_selling}</p>}
            </div>
          </div>

          {/* Stock & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Qty</label>
              <input
                type="number"
                value={form.stock_qty}
                onChange={(e) => setField('stock_qty', e.target.value)}
                min="0"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-brand ${errors.stock_qty ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.stock_qty && <p className="text-xs text-red-600 mt-1">{errors.stock_qty}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
              <select
                value={form.unit}
                onChange={(e) => setField('unit', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-brand bg-white"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Description EN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (English)</label>
            <textarea
              value={form.description_en}
              onChange={(e) => setField('description_en', e.target.value)}
              placeholder="Product description..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
            />
          </div>

          {/* Available toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-800">Available for sale</p>
              <p className="text-xs text-gray-500">Customers can see and buy this product</p>
            </div>
            <button
              type="button"
              onClick={() => setField('is_available', !form.is_available)}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.is_available ? 'bg-brand' : 'bg-gray-300'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_available ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {errors.submit && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              ⚠ {errors.submit}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="md" onClick={onClose} className="flex-1">Cancel</Button>
            <Button size="md" loading={saving} onClick={handleSave} className="flex-1">
              {product ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
