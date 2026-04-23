'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import {
  Spinner, Button, Modal, DataTable, Badge, type DataTableColumn,
} from '@/components/shared'
import { toast } from '@/components/shared/toast'
import type { UpsellRule, UpsellTrigger } from '@kurnool-mall/shared-types'

const TRIGGERS: { value: UpsellTrigger; label: string }[] = [
  { value: 'product_view', label: 'Product view' },
  { value: 'cart_contains', label: 'Cart contains' },
  { value: 'order_completed', label: 'Order completed' },
  { value: 'category_view', label: 'Category view' },
]

export default function AdminUpsellPage() {
  const [rules, setRules] = useState<UpsellRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [trigger, setTrigger] = useState<UpsellTrigger>('product_view')
  const [triggerValue, setTriggerValue] = useState('')
  const [productIds, setProductIds] = useState('')
  const [priority, setPriority] = useState('0')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('upsell_rules')
      .select('*')
      .order('priority', { ascending: false })
    setRules((data ?? []) as UpsellRule[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditId(null)
    setName('')
    setTrigger('product_view')
    setTriggerValue('')
    setProductIds('')
    setPriority('0')
    setShowModal(true)
  }

  function openEdit(r: UpsellRule) {
    setEditId(r.id)
    setName(r.name)
    setTrigger(r.trigger)
    setTriggerValue(r.trigger_value)
    setProductIds((r.recommended_product_ids ?? []).join(', '))
    setPriority(String(r.priority))
    setShowModal(true)
  }

  async function save() {
    if (!name || !triggerValue) { toast.error('Fill required fields'); return }
    setSaving(true)
    const supabase = createClient()
    const ids = productIds.split(',').map((s) => s.trim()).filter(Boolean)
    const row = {
      name,
      trigger,
      trigger_value: triggerValue,
      recommended_product_ids: ids,
      priority: Number(priority) || 0,
      is_active: true,
    }
    if (editId) {
      const { error } = await supabase.from('upsell_rules').update(row).eq('id', editId)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Rule updated')
    } else {
      const { error } = await supabase.from('upsell_rules').insert(row)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Rule added')
    }
    setSaving(false)
    setShowModal(false)
    load()
  }

  async function toggleActive(r: UpsellRule) {
    const supabase = createClient()
    await supabase.from('upsell_rules').update({ is_active: !r.is_active }).eq('id', r.id)
    load()
  }

  const columns: DataTableColumn<UpsellRule>[] = [
    {
      key: 'name',
      header: 'Rule',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => <span className="text-sm font-medium text-gray-900">{r.name}</span>,
    },
    {
      key: 'trigger',
      header: 'Trigger',
      render: (r) => <Badge variant="blue">{r.trigger.replace('_', ' ')}</Badge>,
    },
    {
      key: 'trigger_value',
      header: 'Value',
      render: (r) => <span className="text-xs text-gray-600 font-mono">{r.trigger_value.slice(0, 12)}…</span>,
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      sortValue: (r) => r.priority,
      render: (r) => <span className="text-sm">{r.priority}</span>,
    },
    {
      key: 'is_active',
      header: 'Active',
      render: (r) => (
        <button onClick={() => toggleActive(r)} className={`text-xs px-2 py-1 rounded-full ${r.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {r.is_active ? 'Active' : 'Off'}
        </button>
      ),
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
          <h1 className="text-2xl font-bold text-gray-900">Upsell &amp; Cross-sell Rules</h1>
          <p className="text-sm text-gray-500 mt-1">{rules.length} rules</p>
        </div>
        <Button variant="primary" onClick={openAdd}>Add rule</Button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : (
        <DataTable columns={columns} rows={rules} rowKey={(r) => r.id} pageSize={20} emptyTitle="No upsell rules" />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit rule' : 'Add rule'}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Rule name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Trigger</label>
              <select value={trigger} onChange={(e) => setTrigger(e.target.value as UpsellTrigger)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                {TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Trigger value (product/category ID)</label>
              <input type="text" value={triggerValue} onChange={(e) => setTriggerValue(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Recommended product IDs (comma separated)</label>
            <textarea value={productIds} onChange={(e) => setProductIds(e.target.value)} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Priority (higher = shown first)</label>
            <input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <Button variant="primary" onClick={save} loading={saving} className="w-full">
            {editId ? 'Save' : 'Add rule'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
