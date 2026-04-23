'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared'
import { toast } from '@/components/shared/toast'

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function cancel() {
    if (!confirm('Cancel this booking? This cannot be undone.')) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-booking-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            booking_id: bookingId,
            to_status: 'cancelled',
            note: 'Cancelled by customer',
          }),
        }
      )
      const result = await res.json()
      if (!res.ok || result.error) {
        toast.error(result.error?.message ?? 'Failed to cancel')
        return
      }
      toast.success('Booking cancelled')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={cancel} loading={loading} className="w-full">
      Cancel booking
    </Button>
  )
}
