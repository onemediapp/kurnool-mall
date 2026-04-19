'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Spinner, Button, Modal, DataTable, type DataTableColumn,
} from '@/components/shared'
import { toast } from '@/components/shared/toast'
import { formatPrice } from '@/lib/utils'
import type { FunctionHall } from '@/lib/types'

export default function AdminHallsPage() {
  const [halls, setHalls] = useState<FunctionHall[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [pricePerDay, setPricePerDay] = useState('')
  const [city, setCity] = useState('Kurnool')
  const [addressLine, setAddressLine] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('function_halls')
      .select('*')
      .order('created_at', { ascending: false })
    setHalls((data ?? []) as FunctionHall[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditId(null)
    setName('')
    setCapacity('')
    setPricePerDay('')
    setCity('Kurnool')
    setAddressLine('')
    setShowModal(true)
  }

  function openEdit(h: FunctionHall) {
    setEditId(h.id)
    setName(h.name)
    setCapacity(String(h.capacity))
    setPricePerDay(String(h.price_per_day))
    setCity(h.city)
    setAddressLine(h.address_line)
    setShowModal(true)
  }

  async function save() {
    if (!name || !capacity || !pricePerDay) {
      toast.error('Fill required fields')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const row = {
      name,
      capacity: Number(capacity),
      price_per_day: Number(pricePerDay),
      city,
      address_line: addressLine,
    }
    if (editId) {
      const { error } = await supabase.from('function_halls').update(row).eq('id', editId)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Hall updated')
    } else {
      const { error } = await supabase.from('function_halls').insert({ ...row, is_active: true, amenities: [], images: [] })
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Hall added')
    }
    setSaving(false)
    setShowModal(false)
    load()
  }

  async function toggleActive(h: FunctionHall) {
    const supabase = createClient()
    await supabase.from('function_halls').update({ is_active: !h.is_active }).eq('id', h.id)
    load()
  }

  const columns: DataTableColumn<FunctionHall>[] = [
    {
      key: 'name',
      header: 'Hall',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{r.name}</p>
          <p className="text-[10px] text-gray-500">{r.address_line}, {r.city}</p>
        </div>
      ),
    },
    {
      key: 'capacity',
      header: 'Capacity',
      sortable: true,
      sortValue: (r) => r.capacity,
      render: (r) => <span className="text-sm">{r.capacity}</span>,
    },
    {
      key: 'price_per_day',
      header: 'Price/day',
      sortable: true,
      sortValue: (r) => r.price_per_day,
      render: (r) => <span className="text-sm font-semibold">{formatPrice(r.price_per_day)}</span>,
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
      render: (r) => <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>Edit</Button>,
    },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Function Halls</h1>
          <p className="text-sm text-gray-500 mt-1">{halls.length} halls</p>
        </div>
        <Button variant="primary" onClick={openAdd}>Add hall</Button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : (
        <DataTable columns={columns} rows={halls} rowKey={(r) => r.id} pageSize={20} emptyTitle="No halls" />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit hall' : 'Add hall'}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Hall name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Capacity</label>
              <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Price per day (₹)</label>
              <input type="number" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Address</label>
            <input type="text" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <Button variant="primary" onClick={save} loading={saving} className="w-full">
            {editId ? 'Save' : 'Add hall'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
