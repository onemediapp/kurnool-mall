'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Plus, Home, Briefcase, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Spinner, EmptyState } from '@/components/shared'
import type { Address } from '@/lib/types'

export default function AddressesPage() {
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [settingDefault, setSettingDefault] = useState<string | null>(null)

  useEffect(() => {
    loadAddresses()
  }, [])

  async function loadAddresses() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      setAddresses((data ?? []) as Address[])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function setDefault(addressId: string) {
    setSettingDefault(addressId)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Unset all defaults then set the new one
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)

      await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId)

      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: a.id === addressId }))
      )
    } catch {
      // ignore
    } finally {
      setSettingDefault(null)
    }
  }

  const getLabelIcon = (label: string) => {
    if (label.toLowerCase() === 'work') return <Briefcase className="h-4 w-4" />
    return <Home className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <Link href="/account" className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-target flex items-center justify-center">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Link>
          <h1 className="text-base font-semibold text-gray-900">Saved Addresses</h1>
        </div>
        <Link href="/account/addresses/new" className="flex items-center gap-1 text-xs text-brand font-medium">
          <Plus className="h-4 w-4" /> Add
        </Link>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-12 w-12" />}
          title="No saved addresses"
          description="Add a delivery address to checkout faster."
          action={
            <Link href="/account/addresses/new" className="inline-flex items-center gap-1 bg-brand text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Add Address
            </Link>
          }
        />
      ) : (
        <div className="p-4 space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    {getLabelIcon(addr.label)}
                    {addr.label}
                  </span>
                  {addr.is_default && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-brand">
                      <Star className="h-3 w-3 fill-brand" /> Default
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-800">{addr.address_line}</p>
              <p className="text-xs text-gray-500 mt-0.5">{addr.city} — {addr.pincode}</p>

              {!addr.is_default && (
                <button
                  onClick={() => setDefault(addr.id)}
                  disabled={settingDefault === addr.id}
                  className="mt-3 text-xs text-brand font-medium hover:underline disabled:opacity-50"
                >
                  {settingDefault === addr.id ? 'Setting...' : 'Set as default'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
