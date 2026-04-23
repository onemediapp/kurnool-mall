export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await queryFn()
    if (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Database error'
      console.error('[Supabase Error]', error)
      return { data: null, error: message }
    }
    return { data, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Query Error]', message)
    return { data: null, error: message }
  }
}
