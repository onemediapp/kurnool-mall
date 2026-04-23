import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export type { SupabaseClient } from '@supabase/supabase-js'
export { createClient } from '@supabase/supabase-js'

// Cross-platform factory — pass your own url/key and options.
// Web uses createClient() from ./browser (SSR) or ./server (RSC).
// Mobile constructs its own client with expo-secure-store as storage.
export function createSupabaseClientFactory(
  url: string,
  anonKey: string,
  options?: Parameters<typeof createSupabaseClient>[2]
) {
  return createSupabaseClient(url, anonKey, options)
}
