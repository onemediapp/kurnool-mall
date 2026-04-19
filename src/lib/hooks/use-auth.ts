'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, UserRole } from '@/lib/types'

interface AuthState {
  user: User | null
  role: UserRole | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    loading: true,
  })

  useEffect(() => {
    const supabase = createClient()

    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
          setState({ user: null, role: null, loading: false })
          return
        }

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (profile) {
          setState({ user: profile as User, role: profile.role as UserRole, loading: false })
        } else {
          setState({ user: null, role: null, loading: false })
        }
      } catch {
        setState({ user: null, role: null, loading: false })
      }
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setState({ user: null, role: null, loading: false })
      } else {
        loadUser()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return state
}
