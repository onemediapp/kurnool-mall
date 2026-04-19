'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner, Button } from '@/components/shared'
import { toast } from '@/components/shared/toast'
import type { Provider, ProviderAvailability } from '@/lib/types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface DayRow {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
  id?: string
}

export default function ProviderAvailabilityPage() {
  const router = useRouter()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [rows, setRows] = useState<DayRow[]>(
    Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      start_time: '09:00',
      end_time: '18:00',
      is_active: i !== 0,
    })),
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [available, setAvailable] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prov } = await supabase
      .from('providers')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (!prov) { setLoading(false); return }
    setProvider(prov as Provider)
    setAvailable(prov.is_available)
    const { data: avail } = await supabase
      .from('provider_availability')
      .select('*')
      .eq('provider_id', prov.id)
    if (avail && avail.length > 0) {
      const map = new Map<number, ProviderAvailability>(
        (avail as ProviderAvailability[]).map((a) => [a.day_of_week, a]),
      )
      setRows((prev) =>
        prev.map((r) => {
          const a = map.get(r.day_of_week)
          if (!a) return r
          return {
            day_of_week: r.day_of_week,
            start_time: a.start_time.slice(0, 5),
            end_time: a.end_time.slice(0, 5),
            is_active: a.is_active,
            id: a.id,
          }
        }),
      )
    }
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  function update(idx: number, patch: Partial<DayRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  async function save() {
    if (!provider) return
    setSaving(true)
    try {
      const supabase = createClient()
      // Wipe and reinsert (simpler than upsert with composite key)
      await supabase.from('provider_availability').delete().eq('provider_id', provider.id)
      const insertRows = rows
        .filter((r) => r.is_active)
        .map((r) => ({
          provider_id: provider.id,
          day_of_week: r.day_of_week,
          start_time: r.start_time,
          end_time: r.end_time,
          is_active: true,
        }))
      if (insertRows.length > 0) {
        const { error } = await supabase.from('provider_availability').insert(insertRows)
        if (error) {
          toast.error('Failed to save: ' + error.message)
          return
        }
      }
      await supabase
        .from('providers')
        .update({ is_available: available })
        .eq('id', provider.id)
      toast.success('Schedule saved')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Availability</h1>
      <p className="text-sm text-gray-500 mb-5">Set your weekly working hours.</p>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-semibold text-gray-900">Accepting new bookings</p>
            <p className="text-xs text-gray-500">Toggle off when you're not taking work.</p>
          </div>
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="h-5 w-5 accent-[#0F3B2E]"
          />
        </label>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
        {rows.map((r, idx) => (
          <div key={r.day_of_week} className="p-4 flex items-center gap-4">
            <label className="flex items-center gap-2 w-20">
              <input
                type="checkbox"
                checked={r.is_active}
                onChange={(e) => update(idx, { is_active: e.target.checked })}
                className="h-4 w-4 accent-[#0F3B2E]"
              />
              <span className="text-sm font-semibold text-gray-900">{DAYS[r.day_of_week]}</span>
            </label>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="time"
                value={r.start_time}
                disabled={!r.is_active}
                onChange={(e) => update(idx, { start_time: e.target.value })}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-400"
              />
              <span className="text-gray-400">to</span>
              <input
                type="time"
                value={r.end_time}
                disabled={!r.is_active}
                onChange={(e) => update(idx, { end_time: e.target.value })}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>
        ))}
      </div>

      <Button variant="primary" onClick={save} loading={saving} className="w-full mt-4">
        Save schedule
      </Button>
    </div>
  )
}
