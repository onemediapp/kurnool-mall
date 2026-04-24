import { useEffect } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { supabase } from '@/lib/supabase'

const APP: 'customer' | 'vendor' = 'customer'

export function usePushToken(userId: string | null) {
  useEffect(() => {
    if (!userId || !Device.isDevice) return
    register(userId).catch(() => {
      // Permission denial or a missing projectId (Expo Go w/o eas init)
      // shouldn't break the app — the user just won't receive pushes.
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])
}

async function register(userId: string) {
  const { status: existing } = await Notifications.getPermissionsAsync()
  let status = existing
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync()
    status = req.status
  }
  if (status !== 'granted') return

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId || projectId === 'TO_BE_FILLED_AFTER_EAS_INIT') return

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
  if (!token) return

  await supabase.from('user_devices').upsert(
    {
      user_id: userId,
      push_token: token,
      platform: Platform.OS,
      app: APP,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,push_token' }
  )

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1A56DB',
    })
  }
}
