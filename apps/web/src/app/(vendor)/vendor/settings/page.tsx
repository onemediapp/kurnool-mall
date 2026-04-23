'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Store, Clock, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Spinner } from '@/components/shared'
import { toast } from '@/components/shared/toast'

interface VendorProfile {
  id: string
  shop_name: string
  description_en: string | null
  description_te: string | null
  address_line: string | null
  phone: string | null
  is_active: boolean
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function VendorSettingsPage() {
  const router = useRouter()
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [shopName, setShopName] = useState('')
  const [descEn, setDescEn] = useState('')
  const [descTe, setDescTe] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [holidayMode, setHolidayMode] = useState(false)
  const [notifOrders, setNotifOrders] = useState(true)
  const [notifPayouts, setNotifPayouts] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase.from('vendors').select('id, shop_name, description_en, description_te, address_line, phone, is_active').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (!data) { setLoading(false); return }
          const v = data as VendorProfile
          setVendor(v)
          setShopName(v.shop_name)
          setDescEn(v.description_en ?? '')
          setDescTe(v.description_te ?? '')
          setAddress(v.address_line ?? '')
          setPhone(v.phone ?? '')
          setHolidayMode(!v.is_active)
          setLoading(false)
        })
    })
  }, [router])

  async function handleSave() {
    if (!vendor) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('vendors').update({
        shop_name: shopName.trim(),
        description_en: descEn.trim() || null,
        description_te: descTe.trim() || null,
        address_line: address.trim() || null,
        phone: phone.trim() || null,
        is_active: !holidayMode,
      }).eq('id', vendor.id)

      if (error) {
        toast.error('Failed to save settings.')
      } else {
        toast.success('Settings saved successfully!')
        setVendor({ ...vendor, shop_name: shopName, is_active: !holidayMode })
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner /></div>
  }

  if (!vendor) {
    return <div className="p-8 text-center text-gray-500">No vendor account found.</div>
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Shop Profile */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Store className="h-4 w-4 text-[#1A56DB]" /> Shop Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Shop Name *</label>
              <input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1A56DB]/20"
                placeholder="Your shop name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description (English)</label>
              <textarea
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                rows={3}
                className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1A56DB]/20 resize-none"
                placeholder="Tell customers about your shop..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 font-telugu">వివరణ (Telugu)</label>
              <textarea
                value={descTe}
                onChange={(e) => setDescTe(e.target.value)}
                rows={2}
                className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1A56DB]/20 resize-none font-telugu"
                placeholder="మీ దుకాణం గురించి చెప్పండి..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Shop Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1A56DB]/20"
                placeholder="Street, area, Kurnool"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                className="w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1A56DB]/20"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
        </div>

        {/* Holiday Mode */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#1A56DB]" /> Availability
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Holiday Mode</p>
              <p className="text-xs text-gray-500 mt-0.5">When enabled, your shop appears as closed and customers cannot place orders.</p>
            </div>
            <button
              onClick={() => setHolidayMode(!holidayMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${holidayMode ? 'bg-red-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${holidayMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {holidayMode && (
            <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              ⚠️ Your shop is in holiday mode. Customers cannot place orders.
            </p>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#1A56DB]" /> Notifications
          </h2>
          <div className="space-y-3">
            {[
              { label: 'New Order Alerts', desc: 'Get notified when a customer places an order', value: notifOrders, set: setNotifOrders },
              { label: 'Payout Notifications', desc: 'Get notified about payment settlements', value: notifPayouts, set: setNotifPayouts },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => item.set(!item.value)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${item.value ? 'bg-[#1A56DB]' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.value ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <Button size="lg" onClick={handleSave} loading={saving} disabled={!shopName.trim()} className="gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
