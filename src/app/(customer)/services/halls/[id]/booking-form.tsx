'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared'
import { toast } from '@/components/shared/toast'
import { formatPrice } from '@/lib/utils'

export function HallBookingForm({ hallId, pricePerDay }: { hallId: string; pricePerDay: number }) {
  const router = useRouter()
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const minDate = new Date().toISOString().slice(0, 10)

  async function book() {
    if (!date) {
      toast.error('Pick a date')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/services/halls')
        return
      }

      const { error } = await supabase.from('hall_bookings').insert({
        hall_id: hallId,
        customer_id: user.id,
        booking_date: date,
        status: 'pending',
        price: pricePerDay,
        notes: notes || null,
      })

      if (error) {
        toast.error('Failed to request booking: ' + error.message)
        return
      }

      toast.success('Hall booking request sent!')
      router.push('/services/bookings')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Book this hall</p>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-600">Event date</label>
          <input
            type="date"
            value={date}
            min={minDate}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600">Notes <span className="text-gray-400">(optional)</span></label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Number of guests, catering needs, etc."
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
          />
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
          <span className="text-gray-500">Total</span>
          <span className="font-bold text-[#1A56DB]">{formatPrice(pricePerDay)}</span>
        </div>
        <Button variant="primary" onClick={book} loading={loading} className="w-full">
          Request booking
        </Button>
      </div>
    </div>
  )
}
