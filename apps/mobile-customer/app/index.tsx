import { Redirect } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/Spinner'

export default function Index() {
  const { session, loading } = useAuth()
  if (loading) return <Spinner />
  return <Redirect href={session ? '/(tabs)' : '/(auth)/login'} />
}
