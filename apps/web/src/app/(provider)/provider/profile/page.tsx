'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner, Button, Badge } from '@/components/shared'
import { toast } from '@/components/shared/toast'
import { formatDate } from '@/lib/utils'
import type { Provider, ServiceCategory } from '@/lib/types'

export default function ProviderProfilePage() {
  const router = useRouter()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [businessName, setBusinessName] = useState('')
  const [bio, setBio] = useState('')
  const [areas, setAreas] = useState('')
  const [selectedCats, setSelectedCats] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const [{ data: prov }, { data: cats }] = await Promise.all([
        supabase.from('providers').select('*').eq('user_id', user.id).single(),
        supabase.from('service_categories').select('*').eq('is_active', true).order('sort_order'),
      ])
      if (cancelled) return
      if (prov) {
        const p = prov as Provider
        setProvider(p)
        setBusinessName(p.business_name)
        setBio(p.bio ?? '')
        setAreas((p.service_areas ?? []).join(', '))
        setSelectedCats(p.category_ids ?? [])
      }
      setCategories((cats ?? []) as ServiceCategory[])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [router])

  async function save() {
    if (!provider) return
    if (provider.kyc_status === 'approved') {
      toast.error('Profile is locked after KYC verification.')
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const areasArr = areas.split(',').map((a) => a.trim()).filter(Boolean)
      const { error } = await supabase
        .from('providers')
        .update({
          business_name: businessName,
          bio: bio || null,
          service_areas: areasArr,
          category_ids: selectedCats,
        })
        .eq('id', provider.id)
      if (error) {
        toast.error('Failed: ' + error.message)
        return
      }
      toast.success('Profile updated')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  function toggleCat(id: string) {
    setSelectedCats((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>
  }

  if (!provider) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-sm text-gray-600">Provider profile not set up yet. Contact admin.</p>
      </div>
    )
  }

  const isLocked = provider.kyc_status === 'approved'

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Profile &amp; KYC</h1>
      <p className="text-sm text-gray-500 mb-5">
        Status: <Badge variant={
          provider.kyc_status === 'approved' ? 'green' :
          provider.kyc_status === 'rejected' ? 'red' :
          'yellow'
        }>{provider.kyc_status}</Badge>
        {provider.verified_at && (
          <span className="ml-2 text-xs text-gray-400">Verified {formatDate(provider.verified_at)}</span>
        )}
      </p>

      {isLocked && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-900">
          Your profile is locked. Contact admin to make changes.
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Business name</label>
            <input
              type="text"
              value={businessName}
              disabled={isLocked}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Bio</label>
            <textarea
              value={bio}
              disabled={isLocked}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Service areas (comma separated)</label>
            <input
              type="text"
              value={areas}
              disabled={isLocked}
              placeholder="e.g. Kurnool, Nandyal, Adoni"
              onChange={(e) => setAreas(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Service categories</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categories.map((c) => {
              const checked = selectedCats.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => toggleCat(c.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left ${
                    checked
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-white border-gray-200 text-gray-700'
                  } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <span className="text-lg">{c.emoji}</span>
                  <span className="text-xs">{c.name_en}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">KYC documents</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p>Aadhaar: {provider.aadhaar_masked ?? <span className="text-gray-400">Not submitted</span>}</p>
            <p>PAN: {provider.pan_masked ?? <span className="text-gray-400">Not submitted</span>}</p>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Document upload via admin only. Contact support to update KYC.
          </p>
        </div>

        {!isLocked && (
          <Button variant="primary" onClick={save} loading={saving} className="w-full">
            Save profile
          </Button>
        )}
      </div>
    </div>
  )
}
