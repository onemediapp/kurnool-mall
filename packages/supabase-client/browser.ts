import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@kurnool-mall/shared-types/database.types'

// Singleton pattern for browser client
// Note: @supabase/ssr@0.1.0 was built against supabase-js@2.33.1.
// We use 'any' cast for SSR client due to type incompatibility with supabase-js@2.102.x.
// The Database type is available in database.types.ts for reference.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: ReturnType<typeof createBrowserClient<any>> | null = null

export function createClient() {
  if (client) return client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client = createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return client
}

// Re-export Database type for use in type assertions
export type { Database }
