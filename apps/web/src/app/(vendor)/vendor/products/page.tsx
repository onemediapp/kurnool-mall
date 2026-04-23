'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Package, Search, X, Upload } from 'lucide-react'
import Papa from 'papaparse'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { Button, Spinner, EmptyState, Badge } from '@/components/shared'
import { formatPrice } from '@kurnool-mall/shared-utils'
import { ProductFormModal } from './product-form-modal'
import type { Product, Vendor, Category } from '@kurnool-mall/shared-types'

interface CsvRow {
  name_en: string
  name_te?: string
  category_slug?: string
  price_mrp?: string
  price_selling: string
  stock_qty?: string
  unit?: string
}

export default function VendorProductsPage() {
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'hidden'>('all')
  const [csvRows, setCsvRows] = useState<CsvRow[] | null>(null)
  const [csvImporting, setCsvImporting] = useState(false)
  const [csvError, setCsvError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvError(null)
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const valid = res.data.filter((r) => r.name_en && r.price_selling)
        if (valid.length === 0) {
          setCsvError('No valid rows found. Required columns: name_en, price_selling.')
          return
        }
        setCsvRows(valid)
      },
      error: (err) => setCsvError('Parse failed: ' + err.message),
    })
    e.target.value = ''
  }

  async function importCsvRows() {
    if (!csvRows || !vendor) return
    setCsvImporting(true)
    try {
      const slugToId = new Map(categories.map((c) => [c.slug, c.id]))
      const fallbackCategoryId = categories[0]?.id
      const payload = csvRows.map((r) => ({
        vendor_id: vendor.id,
        category_id: (r.category_slug && slugToId.get(r.category_slug)) || fallbackCategoryId,
        name_en: r.name_en.trim(),
        name_te: (r.name_te ?? '').trim(),
        price_mrp: Number(r.price_mrp) || Number(r.price_selling),
        price_selling: Number(r.price_selling),
        stock_qty: Number(r.stock_qty) || 0,
        unit: r.unit || 'piece',
        is_available: true,
        images: [],
      }))
      const supabase = createClient()
      const { error } = await supabase.from('products').insert(payload)
      if (error) {
        setCsvError(error.message)
        return
      }
      setCsvRows(null)
      loadData()
    } finally {
      setCsvImporting(false)
    }
  }

  async function loadData() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!vendorData) { setLoading(false); return }
      setVendor(vendorData as Vendor)

      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from('products')
          .select('*, category:categories(id, name_en)')
          .eq('vendor_id', vendorData.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('name_en'),
      ])

      setProducts((productsRes.data ?? []) as unknown as Product[])
      setCategories((categoriesRes.data ?? []) as unknown as Category[])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function toggleAvailability(product: Product) {
    setTogglingId(product.id)
    try {
      const supabase = createClient()
      await supabase
        .from('products')
        .update({ is_available: !product.is_available })
        .eq('id', product.id)
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, is_available: !p.is_available } : p)
      )
    } catch {
      // ignore
    } finally {
      setTogglingId(null)
    }
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = !search || p.name_en.toLowerCase().includes(search.toLowerCase())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchCategory = categoryFilter === 'all' || (p as any).category?.id === categoryFilter
      const matchStatus = statusFilter === 'all' || (statusFilter === 'available' ? p.is_available : !p.is_available)
      return matchSearch && matchCategory && matchStatus
    })
  }, [products, search, categoryFilter, statusFilter])

  function openAdd() { setEditProduct(null); setShowModal(true) }
  function openEdit(product: Product) { setEditProduct(product); setShowModal(true) }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner /></div>
  }

  if (!vendor) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Vendor account not found. Please contact the admin.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} products listed</p>
        </div>
        <div className="flex gap-2">
          <label className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl px-4 h-10 cursor-pointer hover:bg-gray-50">
            <Upload className="h-4 w-4" /> Import CSV
            <input type="file" accept=".csv,text/csv" onChange={handleCsvFile} className="sr-only" />
          </label>
          <Button size="md" onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {csvError && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {csvError}
        </div>
      )}

      {csvRows && (
        <div className="mb-5 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <p className="text-sm font-semibold">CSV Preview — {csvRows.length} rows</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCsvRows(null)}>Cancel</Button>
              <Button size="sm" loading={csvImporting} onClick={importCsvRows}>Import All</Button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-gray-500">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">MRP</th>
                  <th className="px-3 py-2">Sell</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Unit</th>
                </tr>
              </thead>
              <tbody>
                {csvRows.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-1.5">{r.name_en}</td>
                    <td className="px-3 py-1.5 text-gray-500">{r.category_slug ?? '—'}</td>
                    <td className="px-3 py-1.5">{r.price_mrp ?? '—'}</td>
                    <td className="px-3 py-1.5">{r.price_selling}</td>
                    <td className="px-3 py-1.5">{r.stock_qty ?? '0'}</td>
                    <td className="px-3 py-1.5">{r.unit ?? 'piece'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Search + Filter bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] bg-white"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name_en}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'available' | 'hidden')}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20 focus:border-[#1A56DB] bg-white"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="No products yet"
          description="Add your first product to start selling on Kurnool Mall."
          action={
            <Button size="md" onClick={openAdd} className="gap-2">
              <Plus className="h-4 w-4" /> Add First Product
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No products match your filters.
          <button onClick={() => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all') }} className="ml-2 text-[#1A56DB] hover:underline">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const imageUrl = product.images?.[0]
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const categoryName = (product as any).category?.name_en

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-50">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={product.name_en}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-4xl">📦</div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={product.is_available ? 'green' : 'gray'}>
                      {product.is_available ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  {categoryName && (
                    <p className="text-xs text-gray-400 mb-0.5">{categoryName}</p>
                  )}
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.name_en}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {product.unit} • Stock: {product.stock_qty}
                  </p>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {formatPrice(product.price_selling)}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => toggleAvailability(product)}
                      disabled={togglingId === product.id}
                      className={`relative flex-1 h-7 rounded-full text-xs font-medium transition-colors ${
                        product.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {togglingId === product.id ? '...' : product.is_available ? 'Available' : 'Hidden'}
                    </button>
                    <button
                      onClick={() => openEdit(product)}
                      className="flex items-center justify-center w-7 h-7 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <ProductFormModal
          vendorId={vendor.id}
          product={editProduct}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadData() }}
        />
      )}
    </div>
  )
}
