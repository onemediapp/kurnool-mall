import { Redirect } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/Spinner'

export default function Index() {
  const { session, loading } = useAuth()
  if (loading) return <Spinner />
  if (!session) return <Redirect href="/(auth)/login" />
  return <Redirect href="/(tabs)" />
}
