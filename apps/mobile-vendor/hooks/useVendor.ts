import { useEffect, useState } from 'react'
import type { Vendor } from '@kurnool-mall/shared-types'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

interface VendorState {
  vendor: Vendor | null
  loading: boolean
  refresh: () => Promise<void>
}

// Resolve the vendors row for the current authenticated user. Null means the
// user has authenticated but hasn't registered a shop yet — callers should
// route to /register.
export function useVendor(): VendorState {
  const { user, loading: authLoading } = useAuth()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!user) {
      setVendor(null)
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    setVendor((data as Vendor | null) ?? null)
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading])

  return { vendor, loading: loading || authLoading, refresh: load }
}
