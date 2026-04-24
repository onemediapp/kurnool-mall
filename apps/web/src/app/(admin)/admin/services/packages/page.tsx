'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import {
  Spinner, Button, Modal, DataTable, type DataTableColumn,
} from '@/components/shared'
import { BilingualField } from '@/components/shared/bilingual-field'
import { toast } from '@/components/shared/toast'
import { formatPrice } from '@kurnool-mall/shared-utils'
import type { ServicePackage, ServiceCategory } from '@kurnool-mall/shared-types'

export default function AdminServicePackagesPage() {
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editId, setEditId] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [nameTe, setNameTe] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('60')
  const [pricingModel, setPricingModel] = useState('flat')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ data: pkgs }, { data: cats }] = await Promise.all([
      supabase
        .from('service_packages')
        .select('*, category:service_categories(*)')
        .order('created_at', { ascending: false }),
      supabase.from('service_categories').select('*').eq('is_active', true).order('sort_order'),
    ])
    setPackages((pkgs ?? []) as ServicePackage[])
    setCategories((cats ?? []) as ServiceCategory[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditId(null)
    setNameEn('')
    setNameTe('')
    setCategoryId(categories[0]?.id ?? '')
    setPrice('')
    setDuration('60')
    setPricingModel('flat')
    setShowModal(true)
  }

  function openEdit(p: ServicePackage) {
    setEditId(p.id)
    setNameEn(p.name_en)
    setNameTe(p.name_te)
    setCategoryId(p.category_id)
    setPrice(String(p.price))
    setDuration(String(p.duration_mins))
    setPricingModel(p.pricing_model)
    setShowModal(true)
  }

  async function save() {
    if (!nameEn || !categoryId || !price) {
      toast.error('Fill required fields')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const row = {
      category_id: categoryId,
      name_en: nameEn,
      name_te: nameTe,
      pricing_model: pricingModel,
      price: Number(price),
      duration_mins: Number(duration),
      is_active: true,
    }
    if (editId) {
      const { error } = await supabase.from('service_packages').update(row).eq('id', editId)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Package updated')
    } else {
      const { error } = await supabase.from('service_packages').insert(row)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Package added')
    }
    setSaving(false)
    setShowModal(false)
    load()
  }

  // Inline price edit
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null)
  const [editPriceVal, setEditPriceVal] = useState('')

  async function savePrice(id: string) {
    const v = Number(editPriceVal)
    if (isNaN(v) || v <= 0) { toast.error('Invalid price'); return }
    const supabase = createClient()
    const { error } = await supabase.from('service_packages').update({ price: v }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setEditingPriceId(null)
    load()
  }

  const columns: DataTableColumn<ServicePackage>[] = [
    {
      key: 'name',
      header: 'Package',
      sortable: true,
      sortValue: (r) => r.name_en,
      render: (r) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{r.name_en}</p>
          <p className="text-[11px] text-gray-500 font-telugu">{r.name_te}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (r) => <span className="text-xs text-gray-600">{r.category?.emoji} {r.category?.name_en}</span>,
    },
    {
      key: 'pricing_model',
      header: 'Model',
      render: (r) => <span className="text-xs capitalize">{r.pricing_model.replace('_', ' ')}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      sortValue: (r) => r.price,
      render: (r) =>
        editingPriceId === r.id ? (
          <input
            type="number"
            value={editPriceVal}
            autoFocus
            onChange={(e) => setEditPriceVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') savePrice(r.id); if (e.key === 'Escape') setEditingPriceId(null) }}
            onBlur={() => savePrice(r.id)}
            className="w-24 px-2 py-1 border border-[#1A56DB] rounded text-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => { setEditingPriceId(r.id); setEditPriceVal(String(r.price)) }}
            className="text-sm font-semibold text-gray-900 hover:text-[#1A56DB] hover:underline"
          >
            {formatPrice(r.price)}
          </button>
        ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (r) => <span className="text-xs text-gray-600">{r.duration_mins}m</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (r) => <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>Edit</Button>,
    },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Packages</h1>
          <p className="text-sm text-gray-500 mt-1">{packages.length} packages across {categories.length} categories</p>
        </div>
        <Button variant="primary" onClick={openAdd}>Add package</Button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : (
        <DataTable columns={columns} rows={packages} rowKey={(r) => r.id} pageSize={20} emptyTitle="No packages" />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit package' : 'Add package'}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name_en}</option>
              ))}
            </select>
          </div>
          <BilingualField label="Name" valueEn={nameEn} valueTe={nameTe} onChangeEn={setNameEn} onChangeTe={setNameTe} />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Price (₹)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Duration (mins)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Model</label>
              <select value={pricingModel} onChange={(e) => setPricingModel(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="flat">Flat</option>
                <option value="hourly">Hourly</option>
                <option value="per_sqft">Per sqft</option>
                <option value="per_day">Per day</option>
              </select>
            </div>
          </div>
          <Button variant="primary" onClick={save} loading={saving} className="w-full">
            {editId ? 'Save' : 'Add package'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
