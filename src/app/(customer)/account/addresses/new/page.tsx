'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared'

const LABEL_OPTIONS = ['Home', 'Work', 'Other']

export default function NewAddressPage() {
  const router = useRouter()
  const [label, setLabel] = useState('Home')
  const [addressLine, setAddressLine] = useState('')
  const [pincode, setPincode] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!addressLine.trim()) newErrors.addressLine = 'Address is required'
    if (!pincode.trim() || !/^\d{6}$/.test(pincode.trim())) {
      newErrors.pincode = 'Enter a valid 6-digit pincode'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSave() {
    if (!validate()) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check if this is the first address — make it default
      const { count } = await supabase
        .from('addresses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_deleted', false)

      const isFirst = count === 0

      const { error } = await supabase.from('addresses').insert({
        user_id: user.id,
        label,
        address_line: addressLine.trim(),
        city: 'Kurnool',
        pincode: pincode.trim(),
        is_default: isFirst,
      })

      if (error) {
        setErrors({ submit: error.message })
      } else {
        router.push('/account/addresses')
      }
    } catch {
      setErrors({ submit: 'Failed to save address. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 flex items-center h-14">
        <Link href="/account/addresses" className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-target flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <h1 className="ml-2 text-base font-semibold text-gray-900">Add New Address</h1>
      </div>

      <div className="mx-4 mt-4 bg-white rounded-xl p-4 shadow-sm space-y-4">
        {/* Label selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
          <div className="flex gap-2">
            {LABEL_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setLabel(opt)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  label === opt
                    ? 'border-brand bg-brand-light text-brand'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Address line */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Address Line <span className="text-red-500">*</span>
          </label>
          <textarea
            value={addressLine}
            onChange={(e) => { setAddressLine(e.target.value); setErrors((p) => ({ ...p, addressLine: '' })) }}
            placeholder="House/Flat no., Street, Area"
            rows={3}
            className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors ${
              errors.addressLine ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.addressLine && (
            <p className="text-xs text-red-600 mt-1">{errors.addressLine}</p>
          )}
        </div>

        {/* City (pre-filled) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
          <input
            type="text"
            value="Kurnool"
            disabled
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Pincode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Pincode <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={pincode}
            onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors((p) => ({ ...p, pincode: '' })) }}
            placeholder="518001"
            maxLength={6}
            inputMode="numeric"
            className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors ${
              errors.pincode ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.pincode && (
            <p className="text-xs text-red-600 mt-1">{errors.pincode}</p>
          )}
        </div>

        {errors.submit && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            ⚠ {errors.submit}
          </p>
        )}

        <Button size="lg" loading={saving} onClick={handleSave}>
          Save Address
        </Button>
      </div>
    </div>
  )
}
