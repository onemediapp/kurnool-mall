'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import {
  Spinner, Button, Modal, DataTable, type DataTableColumn,
} from '@/components/shared'
import { BilingualField } from '@/components/shared/bilingual-field'
import { toast } from '@/components/shared/toast'
import { formatPrice } from '@kurnool-mall/shared-utils'
import type { ServiceCategory } from '@kurnool-mall/shared-types'

export default function AdminServiceCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  const [nameEn, setNameEn] = useState('')
  const [nameTe, setNameTe] = useState('')
  const [emoji, setEmoji] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [editId, setEditId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('service_categories')
      .select('*')
      .order('sort_order', { ascending: true })
    setCategories((data ?? []) as ServiceCategory[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditId(null)
    setNameEn('')
    setNameTe('')
    setEmoji('')
    setBasePrice('')
    setShowAdd(true)
  }

  function openEdit(c: ServiceCategory) {
    setEditId(c.id)
    setNameEn(c.name_en)
    setNameTe(c.name_te)
    setEmoji(c.emoji)
    setBasePrice(String(c.base_price))
    setShowAdd(true)
  }

  async function save() {
    if (!nameEn) {
      toast.error('Name (EN) is required')
      return
    }
    setSaving(true)
    const supabase = createClient()
    if (editId) {
      const { error } = await supabase
        .from('service_categories')
        .update({
          name_en: nameEn,
          name_te: nameTe,
          emoji,
          base_price: Number(basePrice) || 0,
        })
        .eq('id', editId)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Category updated')
    } else {
      const slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '')
      const { error } = await supabase
        .from('service_categories')
        .insert({
          slug,
          name_en: nameEn,
          name_te: nameTe,
          emoji,
          base_price: Number(basePrice) || 0,
          sort_order: categories.length,
          is_active: true,
        })
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Category added')
    }
    setSaving(false)
    setShowAdd(false)
    load()
  }

  async function toggleActive(c: ServiceCategory) {
    const supabase = createClient()
    await supabase.from('service_categories').update({ is_active: !c.is_active }).eq('id', c.id)
    load()
  }

  const columns: DataTableColumn<ServiceCategory>[] = [
    {
      key: 'sort_order',
      header: '#',
      sortable: true,
      sortValue: (r) => r.sort_order,
      render: (r) => <span className="text-xs text-gray-400">{r.sort_order}</span>,
    },
    {
      key: 'emoji',
      header: '',
      render: (r) => <span className="text-2xl">{r.emoji}</span>,
    },
    {
      key: 'name_en',
      header: 'Name',
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
      key: 'base_price',
      header: 'Base price',
      sortable: true,
      sortValue: (r) => r.base_price,
      render: (r) => <span className="text-sm">{formatPrice(r.base_price)}</span>,
    },
    {
      key: 'is_active',
      header: 'Active',
      render: (r) => (
        <button onClick={() => toggleActive(r)} className={`text-xs px-2 py-1 rounded-full ${r.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {r.is_active ? 'Active' : 'Inactive'}
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>Edit</Button>
      ),
    },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Categories</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} categories</p>
        </div>
        <Button variant="primary" onClick={openAdd}>Add category</Button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : (
        <DataTable columns={columns} rows={categories} rowKey={(r) => r.id} pageSize={30} emptyTitle="No categories" />
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editId ? 'Edit category' : 'Add category'}>
        <div className="space-y-3">
          <BilingualField
            label="Name"
            valueEn={nameEn}
            valueTe={nameTe}
            onChangeEn={setNameEn}
            onChangeTe={setNameTe}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Emoji</label>
              <input type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Base price (₹)</label>
              <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <Button variant="primary" onClick={save} loading={saving} className="w-full">
            {editId ? 'Save changes' : 'Add category'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
