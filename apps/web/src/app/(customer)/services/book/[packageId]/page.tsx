'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StepWizard, Spinner, type WizardStep } from '@/components/shared'
import { toast } from '@/components/shared/toast'
import { formatPrice, formatDate } from '@/lib/utils'
import type { ServicePackage, Address } from '@/lib/types'

interface Props {
  params: { packageId: string }
}

interface AddressForm {
  label: string
  address_line: string
  city: string
  pincode: string
}

export default function BookServicePage({ params }: Props) {
  const router = useRouter()

  // Services mode colors - Orange theme
  const colors = {
    bg: 'bg-orange-50',
    bgLight: 'bg-orange-50',
    bgDark: 'bg-orange-600',
    border: 'border-orange-200',
    text: 'text-orange-600',
    textDark: 'text-orange-700',
    accent: 'bg-orange-100',
    accentText: 'text-orange-800',
    header: 'text-orange-600',
    button: 'bg-orange-600 hover:bg-orange-700',
    buttonHover: 'hover:bg-orange-700',
    ring: 'ring-orange-600/20',
    focus: 'focus:ring-orange-600/20',
  }

  const [pkg, setPkg] = useState<ServicePackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(0)

  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [manualAddress, setManualAddress] = useState<AddressForm>({
    label: 'Home',
    address_line: '',
    city: 'Kurnool',
    pincode: '',
  })
  const [useManual, setUseManual] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase
        .from('service_packages')
        .select('*, category:service_categories(*)')
        .eq('id', params.packageId)
        .eq('is_active', true)
        .single(),
      supabase.auth.getUser(),
    ]).then(async ([pkgRes, userRes]) => {
      if (pkgRes.data) setPkg(pkgRes.data as ServicePackage)
      const user = userRes.data.user
      if (user) {
        const { data: addrs } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
        setSavedAddresses((addrs ?? []) as Address[])
        const def = (addrs ?? []).find((a) => a.is_default) ?? (addrs ?? [])[0]
        if (def) setSelectedAddressId(def.id)
      }
      setLoading(false)
    })
  }, [params.packageId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className={`min-h-screen ${colors.bgLight} flex flex-col items-center justify-center p-6`}>
        <p className="text-sm text-gray-600">Package not found.</p>
        <Link href="/services" className={`text-sm ${colors.text} mt-2`}>Back to services</Link>
      </div>
    )
  }

  const minDateTime = (() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() + 60)
    return d.toISOString().slice(0, 16)
  })()

  const scheduledAtIso = scheduledDate && scheduledTime
    ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
    : ''

  const finalAddress = useManual
    ? manualAddress
    : (() => {
        const a = savedAddresses.find((x) => x.id === selectedAddressId)
        if (!a) return null
        return {
          label: a.label,
          address_line: a.address_line,
          city: a.city,
          pincode: a.pincode,
        }
      })()

  const canStepOne = true
  const canStepTwo = !!scheduledAtIso
  const canStepThree = !!finalAddress && !!finalAddress.address_line && !!finalAddress.pincode
  const canStepFour = true

  async function handleSubmit() {
    if (!pkg || !finalAddress || !scheduledAtIso) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login?redirect=/services'); return }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-service-booking`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            package_id: pkg.id,
            scheduled_at: scheduledAtIso,
            address: finalAddress,
            notes: notes || null,
            auto_assign: true,
          }),
        }
      )
      const result = await res.json()
      if (!res.ok || result.error) {
        toast.error(result.error?.message ?? 'Failed to create booking')
        return
      }
      const booking = result.data.booking
      const otp = result.data.otp
      toast.success(`Booking confirmed! OTP: ${otp}`)
      router.push(`/services/bookings/${booking.id}?new=1`)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const steps: WizardStep[] = [
    {
      id: 'package',
      label: 'Package',
      canAdvance: canStepOne,
      content: (
        <div className="space-y-3">
          <div className={`bg-white rounded-xl border ${colors.border} p-4`}>
            <div className="flex items-start gap-3">
              <div className={`h-12 w-12 rounded-full ${colors.accent} flex items-center justify-center text-2xl`}>
                {pkg.category?.emoji || '🛠️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{pkg.name_en}</p>
                <p className="text-[11px] text-gray-500 font-telugu">{pkg.name_te}</p>
                {pkg.description_en && (
                  <p className="text-xs text-gray-600 mt-2">{pkg.description_en}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {pkg.duration_mins} mins
                  </span>
                </div>
              </div>
              <p className={`text-base font-bold ${colors.text}`}>{formatPrice(pkg.price)}</p>
            </div>
            {pkg.inclusions && pkg.inclusions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[11px] font-medium text-gray-700 mb-1">What's included</p>
                <ul className="space-y-0.5">
                  {pkg.inclusions.map((inc, i) => (
                    <li key={i} className="text-[11px] text-gray-600 flex items-start gap-1">
                      <span className="text-green-600">✓</span> {inc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'slot',
      label: 'Slot',
      canAdvance: canStepTwo,
      content: (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Pick a date &amp; time</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Date</label>
              <input
                type="date"
                value={scheduledDate}
                min={minDateTime.slice(0, 10)}
                onChange={(e) => setScheduledDate(e.target.value)}
                className={`mt-1 w-full px-3 py-2 border ${colors.border} rounded-lg text-sm focus:outline-none focus:ring-2 ${colors.focus}`}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className={`mt-1 w-full px-3 py-2 border ${colors.border} rounded-lg text-sm focus:outline-none focus:ring-2 ${colors.focus}`}
              />
            </div>
          </div>
          {scheduledAtIso && (
            <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              {formatDate(scheduledAtIso)}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'address',
      label: 'Address',
      canAdvance: canStepThree,
      content: (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Service address</p>
          {savedAddresses.length > 0 && !useManual && (
            <div className="space-y-2">
              {savedAddresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedAddressId(a.id)}
                  className={`w-full text-left bg-white rounded-xl border p-3 ${
                    selectedAddressId === a.id ? `border-orange-600 ring-1 ${colors.ring}` : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{a.label}</p>
                      <p className="text-xs text-gray-600">{a.address_line}, {a.city} - {a.pincode}</p>
                    </div>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUseManual(true)}
                className="text-xs text-[#1A56DB] font-medium"
              >
                + Enter a different address
              </button>
            </div>
          )}
          {(useManual || savedAddresses.length === 0) && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Label (Home, Work...)"
                value={manualAddress.label}
                onChange={(e) => setManualAddress({ ...manualAddress, label: e.target.value })}
                className={`w-full px-3 py-2 border ${colors.border} rounded-lg text-sm`}
              />
              <textarea
                placeholder="Full address"
                value={manualAddress.address_line}
                onChange={(e) => setManualAddress({ ...manualAddress, address_line: e.target.value })}
                rows={2}
                className={`w-full px-3 py-2 border ${colors.border} rounded-lg text-sm`}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={manualAddress.city}
                  onChange={(e) => setManualAddress({ ...manualAddress, city: e.target.value })}
                  className={`px-3 py-2 border ${colors.border} rounded-lg text-sm`}
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={manualAddress.pincode}
                  onChange={(e) => setManualAddress({ ...manualAddress, pincode: e.target.value })}
                  className={`px-3 py-2 border ${colors.border} rounded-lg text-sm`}
                />
              </div>
              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseManual(false)}
                  className="text-xs text-[#1A56DB] font-medium"
                >
                  ← Use saved address
                </button>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'notes',
      label: 'Notes',
      canAdvance: canStepFour,
      content: (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">Anything else? <span className="text-gray-400 text-xs">(optional)</span></p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Special instructions for the provider..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
          />
        </div>
      ),
    },
    {
      id: 'review',
      label: 'Review',
      canAdvance: true,
      content: (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Review &amp; confirm</p>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            <div className="p-3 flex justify-between text-sm">
              <span className="text-gray-500">Service</span>
              <span className="font-medium text-gray-900 text-right">{pkg.name_en}</span>
            </div>
            <div className="p-3 flex justify-between text-sm">
              <span className="text-gray-500">When</span>
              <span className="font-medium text-gray-900 text-right">{scheduledAtIso ? formatDate(scheduledAtIso) : '—'}</span>
            </div>
            <div className="p-3 text-sm">
              <p className="text-gray-500 mb-1">Where</p>
              <p className="font-medium text-gray-900 text-xs">
                {finalAddress
                  ? `${finalAddress.label}: ${finalAddress.address_line}, ${finalAddress.city} - ${finalAddress.pincode}`
                  : '—'}
              </p>
            </div>
            {notes && (
              <div className="p-3 text-sm">
                <p className="text-gray-500 mb-1">Notes</p>
                <p className="text-gray-700 text-xs">{notes}</p>
              </div>
            )}
            <div className={`p-3 flex justify-between text-sm ${colors.accent}`}>
              <span className="font-semibold text-gray-900">Total</span>
              <span className={`font-bold ${colors.text}`}>{formatPrice(pkg.price)}</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-500">
            You'll receive a 6-digit OTP after confirming. Share it with the provider on arrival to start the job.
          </p>
        </div>
      ),
    },
  ]

  return (
    <div className={`${colors.bgLight} min-h-screen flex flex-col`}>
      <div className={`sticky top-0 z-10 bg-white border-b ${colors.border} px-4 py-3 flex items-center gap-3`}>
        <Link
          href={`/services/${pkg.category?.slug ?? ''}`}
          className={`p-2 -ml-2 rounded-full hover:bg-orange-50 active:bg-orange-100 touch-target flex items-center justify-center`}
          aria-label="Go back"
        >
          <ArrowLeft className={`h-5 w-5 ${colors.textDark}`} />
        </Link>
        <h1 className={`text-base font-semibold ${colors.textDark}`}>Book service</h1>
      </div>

      <div className="flex-1 p-4 flex flex-col" style={{ minHeight: 'calc(100vh - 60px)' }}>
        <StepWizard
          steps={steps}
          current={step}
          onChange={setStep}
          onSubmit={handleSubmit}
          submitLabel="Confirm booking"
          loading={submitting}
        />
      </div>
    </div>
  )
}
