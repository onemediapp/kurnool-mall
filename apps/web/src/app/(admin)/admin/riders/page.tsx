'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Bike, Phone, ToggleLeft, ToggleRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/shared'
import { toast } from '@/components/shared/toast'
import type { Rider } from '@/lib/types'

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [vehicle, setVehicle] = useState<'bike' | 'bicycle' | 'scooter'>('bike')

  useEffect(() => {
    loadRiders()
  }, [])

  async function loadRiders() {
    const supabase = createClient()
    const { data } = await supabase.from('riders').select('*').order('created_at', { ascending: false })
    setRiders((data ?? []) as Rider[])
    setLoading(false)
  }

  async function addRider() {
    if (!name.trim() || !phone.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('riders')
      .insert({ name: name.trim(), phone: phone.trim(), vehicle_type: vehicle, is_active: true })
      .select()
      .single()

    if (error) {
      toast.error('Failed to add rider')
    } else {
      setRiders((prev) => [data as Rider, ...prev])
      setShowModal(false)
      setName('')
      setPhone('')
      toast.success('Rider added successfully')
    }
    setSaving(false)
  }

  async function toggleRider(riderId: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('riders').update({ is_active: !current }).eq('id', riderId)
    setRiders((prev) => prev.map((r) => r.id === riderId ? { ...r, is_active: !current } : r))
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Riders</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#1A56DB] text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Add Rider
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : riders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bike className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600">No riders yet</p>
          <p className="text-sm mt-1">Add your first delivery partner</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rider</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {riders.map((rider) => (
                <tr key={rider.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#DBEAFE] rounded-full flex items-center justify-center text-[#1A56DB] font-bold text-sm">
                        {rider.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{rider.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <a href={`tel:${rider.phone}`} className="flex items-center gap-1 text-gray-600 hover:text-[#1A56DB]">
                      <Phone className="h-3 w-3" /> {rider.phone}
                    </a>
                  </td>
                  <td className="px-5 py-3 capitalize text-gray-600">{rider.vehicle_type}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${rider.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {rider.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => toggleRider(rider.id, rider.is_active)}>
                      {rider.is_active
                        ? <ToggleRight className="h-5 w-5 text-green-600" />
                        : <ToggleLeft className="h-5 w-5 text-gray-400" />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Rider Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Add Rider</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="Raju Kumar" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone *</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Type</label>
                <select value={vehicle} onChange={(e) => setVehicle(e.target.value as typeof vehicle)} className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none">
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="bicycle">Bicycle</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl">Cancel</button>
              <button onClick={addRider} disabled={saving || !name.trim() || !phone.trim()} className="flex-1 bg-[#1A56DB] text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Rider'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
