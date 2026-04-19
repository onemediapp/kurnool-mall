'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Briefcase, Star, Wallet, Clock, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Spinner, KPICard, BookingStatusBadge, EmptyState } from '@/components/shared'
import { formatDate, formatPrice } from '@/lib/utils'
import type { ServiceBooking, Provider } from '@/lib/types'

export default function ProviderDashboardPage() {
  const router = useRouter()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [todayCount, setTodayCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [earningsMtd, setEarningsMtd] = useState(0)
  const [upcoming, setUpcoming] = useState<ServiceBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: pData } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (cancelled) return
      if (!pData) { setLoading(false); return }
      setProvider(pData as Provider)

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const [todayRes, pendingRes, mtdRes, upcomingRes] = await Promise.all([
        supabase
          .from('service_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', pData.id)
          .gte('scheduled_at', todayStart.toISOString())
          .lte('scheduled_at', todayEnd.toISOString()),
        supabase
          .from('service_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', pData.id)
          .in('status', ['pending', 'confirmed']),
        supabase
          .from('service_bookings')
          .select('price, commission')
          .eq('provider_id', pData.id)
          .in('status', ['completed', 'paid'])
          .gte('completed_at', monthStart.toISOString()),
        supabase
          .from('service_bookings')
          .select('*, category:service_categories(*), package:service_packages(*)')
          .eq('provider_id', pData.id)
          .in('status', ['pending', 'confirmed', 'en_route', 'in_progress'])
          .order('scheduled_at', { ascending: true })
          .limit(5),
      ])

      if (cancelled) return
      setTodayCount(todayRes.count ?? 0)
      setPendingCount(pendingRes.count ?? 0)
      const mtd = (mtdRes.data ?? []).reduce(
        (s: number, r: { price: number; commission: number }) => s + (r.price - r.commission),
        0,
      )
      setEarningsMtd(mtd)
      setUpcoming((upcomingRes.data ?? []) as ServiceBooking[])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>
  }

  if (!provider) {
    return (
      <div className="p-6">
        <EmptyState
          title="Provider profile not set up"
          description="Please contact admin to complete your provider profile."
        />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {provider.business_name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {provider.is_available ? '🟢 Available' : '🔴 Unavailable'} · Rating {provider.rating?.toFixed(1) ?? '—'} · {provider.total_jobs} jobs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard label="Today" value={String(todayCount)} icon={<Clock className="h-5 w-5" />} />
        <KPICard label="Pending" value={String(pendingCount)} icon={<Briefcase className="h-5 w-5" />} />
        <KPICard label="Earnings (MTD)" value={formatPrice(earningsMtd)} icon={<Wallet className="h-5 w-5" />} />
        <KPICard label="Rating" value={provider.rating?.toFixed(1) ?? '—'} icon={<Star className="h-5 w-5" />} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Upcoming bookings</h2>
          <Link href="/provider/bookings" className="text-xs text-[#0F3B2E] font-medium flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No upcoming bookings" description="You're all caught up." />
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {upcoming.map((b) => (
              <li key={b.id}>
                <Link href={`/provider/bookings?id=${b.id}`} className="block px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-xl">
                      {b.category?.emoji ?? '🛠️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{b.package?.name_en}</p>
                      <p className="text-[11px] text-gray-500">#{b.booking_number} · {formatDate(b.scheduled_at)}</p>
                    </div>
                    <BookingStatusBadge status={b.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
