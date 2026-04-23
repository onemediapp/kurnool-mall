'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, X, ChevronDown, ChevronRight, GripVertical } from 'lucide-react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { Spinner } from '@/components/shared'
import { toast } from '@/components/shared/toast'
import { CATEGORY_EMOJIS } from '@kurnool-mall/shared-utils'
import type { Category } from '@kurnool-mall/shared-types'

type CatNode = Category & { children: Category[]; productCount: number }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [dragId, setDragId] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [parentForNew, setParentForNew] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [nameEn, setNameEn] = useState('')
  const [nameTe, setNameTe] = useState('')
  const [slug, setSlug] = useState('')
  const [icon, setIcon] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    const [catsRes, prodRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('category_id').eq('is_deleted', false),
    ])
    setCategories((catsRes.data ?? []) as Category[])
    const counts: Record<string, number> = {}
    for (const row of (prodRes.data ?? []) as Array<{ category_id: string }>) {
      counts[row.category_id] = (counts[row.category_id] ?? 0) + 1
    }
    setProductCounts(counts)
    setLoading(false)
  }

  const tree = useMemo<CatNode[]>(() => {
    const byParent = new Map<string | null, Category[]>()
    categories.forEach((c) => {
      const key = c.parent_id
      const arr = byParent.get(key) ?? []
      arr.push(c)
      byParent.set(key, arr)
    })
    const roots = byParent.get(null) ?? []
    return roots.map((r) => ({
      ...r,
      children: byParent.get(r.id) ?? [],
      productCount: productCounts[r.id] ?? 0,
    }))
  }, [categories, productCounts])

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openAdd(parent: string | null = null) {
    setEditing(null)
    setParentForNew(parent)
    setNameEn('')
    setNameTe('')
    setSlug('')
    setIcon('')
    setShowModal(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setParentForNew(cat.parent_id)
    setNameEn(cat.name_en)
    setNameTe(cat.name_te)
    setSlug(cat.slug)
    setIcon(cat.icon_url ?? '')
    setShowModal(true)
  }

  async function saveCategory() {
    if (!nameEn.trim() || !slug.trim()) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      name_en: nameEn.trim(),
      name_te: nameTe.trim(),
      slug: slug.trim(),
      icon_url: icon.trim() || null,
      parent_id: parentForNew,
    }
    if (editing) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.id)
      if (error) toast.error('Failed to update category')
      else toast.success('Category updated')
    } else {
      const siblings = categories.filter((c) => c.parent_id === parentForNew)
      const { error } = await supabase
        .from('categories')
        .insert({ ...payload, is_active: true, sort_order: siblings.length })
      if (error) toast.error('Failed to create category')
      else toast.success('Category created')
    }
    await loadData()
    setShowModal(false)
    setSaving(false)
  }

  async function toggleActive(catId: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('categories').update({ is_active: !current }).eq('id', catId)
    setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, is_active: !current } : c)))
  }

  function onDragStart(id: string) {
    setDragId(id)
  }

  async function onDropOn(targetId: string) {
    if (!dragId || dragId === targetId) { setDragId(null); return }
    const source = categories.find((c) => c.id === dragId)
    const target = categories.find((c) => c.id === targetId)
    if (!source || !target) { setDragId(null); return }
    if (source.parent_id !== target.parent_id) { setDragId(null); return }
    const siblings = categories
      .filter((c) => c.parent_id === source.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order)
    const srcIdx = siblings.findIndex((c) => c.id === source.id)
    const tgtIdx = siblings.findIndex((c) => c.id === target.id)
    const reordered = [...siblings]
    reordered.splice(srcIdx, 1)
    reordered.splice(tgtIdx, 0, source)
    const supabase = createClient()
    await Promise.all(
      reordered.map((c, i) =>
        supabase.from('categories').update({ sort_order: i }).eq('id', c.id)
      )
    )
    setDragId(null)
    loadData()
  }

  function CategoryRow({
    cat,
    depth = 0,
    isExpanded,
    hasChildren,
    onToggle,
  }: {
    cat: Category
    depth?: number
    isExpanded?: boolean
    hasChildren?: boolean
    onToggle?: () => void
  }) {
    const count = productCounts[cat.id] ?? 0
    return (
      <div
        draggable
        onDragStart={() => onDragStart(cat.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDropOn(cat.id)}
        className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 ${dragId === cat.id ? 'opacity-50' : ''}`}
        style={{ paddingLeft: `${20 + depth * 24}px` }}
      >
        <GripVertical className="h-4 w-4 text-gray-300 cursor-grab flex-shrink-0" />
        {hasChildren ? (
          <button onClick={onToggle} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <span className="text-xl flex-shrink-0">
          {cat.icon_url || CATEGORY_EMOJIS[cat.slug] || '🏪'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{cat.name_en}</p>
          <p className="text-xs text-gray-500 font-telugu truncate">{cat.name_te}</p>
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">{count} product{count === 1 ? '' : 's'}</span>
        <span className="text-xs font-mono text-gray-400 whitespace-nowrap">{cat.slug}</span>
        <button
          onClick={() => toggleActive(cat.id, cat.is_active)}
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
        >
          {cat.is_active ? 'Active' : 'Inactive'}
        </button>
        <button
          onClick={() => openAdd(cat.id)}
          className="text-xs text-gray-500 hover:text-gray-900"
          title="Add subcategory"
        >
          + Sub
        </button>
        <button onClick={() => openEdit(cat)} className="text-xs text-shop font-medium hover:underline">
          Edit
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={() => openAdd(null)}
          className="flex items-center gap-2 bg-shop text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {tree.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">No categories yet</div>
            )}
            {tree.map((node) => (
              <div key={node.id}>
                <CategoryRow
                  cat={node}
                  hasChildren={node.children.length > 0}
                  isExpanded={expanded.has(node.id)}
                  onToggle={() => toggleExpand(node.id)}
                />
                {expanded.has(node.id) &&
                  node.children.map((child) => (
                    <CategoryRow key={child.id} cat={child} depth={1} />
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">
                {editing ? 'Edit Category' : parentForNew ? 'Add Subcategory' : 'Add Category'}
              </h3>
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
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none"
                placeholder="Icon (emoji 🛒 or URL)"
                maxLength={200}
              />
              <p className="text-xs text-gray-400">Slug is used in URLs. Use lowercase letters and hyphens only.</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl">Cancel</button>
              <button
                onClick={saveCategory}
                disabled={saving || !nameEn.trim() || !slug.trim()}
                className="flex-1 bg-shop text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50"
              >
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
