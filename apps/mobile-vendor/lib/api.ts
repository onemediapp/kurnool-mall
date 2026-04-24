import { createApiClient } from '@kurnool-mall/api-client'
import { supabase } from './supabase'

const apiUrl = process.env.EXPO_PUBLIC_API_URL
if (!apiUrl) {
  throw new Error(
    'Missing EXPO_PUBLIC_API_URL. Copy .env.example to .env and fill in values.'
  )
}

export const api = createApiClient({ supabase, apiUrl })
