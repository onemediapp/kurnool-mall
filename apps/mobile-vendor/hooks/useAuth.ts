import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { User } from '@kurnool-mall/shared-types'
import { supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function loadFromSession(session: Session | null) {
      if (!session?.user) {
        if (!cancelled) setState({ session: null, user: null, loading: false })
        return
      }
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (!cancelled) {
        setState({
          session,
          user: (data as User | null) ?? null,
          loading: false,
        })
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => loadFromSession(session))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadFromSession(session)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return state
}
