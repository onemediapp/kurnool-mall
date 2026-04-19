'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Layers, ChevronUp, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/shared'
import { toast } from '@/components/shared/toast'
import { CATEGORY_EMOJIS } from '@/lib/utils'
import type { Category } from '@/lib/types'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)

  const [nameEn, setNameEn] = useState('')
  const [nameTe, setNameTe] = useState('')
  const [slug, setSlug] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    const supabase = createClient()
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories((data ?? []) as Category[])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    setNameEn('')
    setNameTe('')
    setSlug('')
    setShowModal(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setNameEn(cat.name_en)
    setNameTe(cat.name_te)
    setSlug(cat.slug)
    setShowModal(true)
  }

  async function saveCategory() {
    if (!nameEn.trim() || !slug.trim()) return
    setSaving(true)
    const supabase = createClient()
    if (editing) {
      const { error } = await supabase
        .from('categories')
        .update({ name_en: nameEn.trim(), name_te: nameTe.trim(), slug: slug.trim() })
        .eq('id', editing.id)
      if (error) { toast.error('Failed to update category') }
      else {
        setCategories((prev) => prev.map((c) => c.id === editing.id ? { ...c, name_en: nameEn, name_te: nameTe, slug } : c))
        toast.success('Category updated!')
        setShowModal(false)
      }
    } else {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name_en: nameEn.trim(), name_te: nameTe.trim(), slug: slug.trim(), is_active: true, sort_order: categories.length })
        .select()
        .single()
      if (error) { toast.error('Failed to create category') }
      else {
        setCategories((prev) => [...prev, data as Category])
        toast.success('Category created!')
        setShowModal(false)
      }
    }
    setSaving(false)
  }

  async function toggleActive(catId: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('categories').update({ is_active: !current }).eq('id', catId)
    setCategories((prev) => prev.map((c) => c.id === catId ? { ...c, is_active: !current } : c))
  }

  async function reorder(catId: string, direction: 'up' | 'down') {
    const idx = categories.findIndex((c) => c.id === catId)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === categories.length - 1) return
    const newCats = [...categories]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[newCats[idx], newCats[swapIdx]] = [newCats[swapIdx], newCats[idx]]
    setCategories(newCats)
    // Update sort_order in DB
    const supabase = createClient()
    await Promise.all([
      supabase.from('categories').update({ sort_order: swapIdx }).eq('id', newCats[swapIdx].id),
      supabase.from('categories').update({ sort_order: idx }).eq('id', newCats[idx].id),
    ])
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#1A56DB] text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat, idx) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => reorder(cat.id, 'up')} disabled={idx === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-20">
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button onClick={() => reorder(cat.id, 'down')} disabled={idx === categories.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-20">
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{CATEGORY_EMOJIS[cat.slug] ?? '🏪'}</span>
                      <div>
                        <p className="font-medium text-gray-900">{cat.name_en}</p>
                        <p className="text-xs text-gray-500 font-telugu">{cat.name_te}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{cat.slug}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleActive(cat.id, cat.is_active)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(cat)} className="text-xs text-[#1A56DB] font-medium hover:underline">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-8">No categories yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">{editing ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="space-y-3">
              <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="Name (English) *" />
              <input value={nameTe} onChange={(e) => setNameTe(e.target.value)} className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none font-telugu" placeholder="పేరు (Telugu)" />
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm font-mono outline-none"
                placeholder="slug (e.g. electronics) *"
              />
              <p className="text-xs text-gray-400">Slug is used in URLs. Use lowercase letters and hyphens only.</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl">Cancel</button>
              <button onClick={saveCategory} disabled={saving || !nameEn.trim() || !slug.trim()} className="flex-1 bg-[#1A56DB] text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
