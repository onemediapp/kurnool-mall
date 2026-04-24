import * as SecureStore from 'expo-secure-store'

// SecureStore enforces ~2 KB per key, so we chunk longer Supabase session
// blobs. Chunk index suffix on the stored key; reading stops at the first
// missing index so old sessions clean up naturally.
const CHUNK_SIZE = 1900
const MAX_CHUNKS = 20

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const chunks: string[] = []
      for (let i = 0; i < MAX_CHUNKS; i++) {
        const chunk = await SecureStore.getItemAsync(`${key}_${i}`)
        if (!chunk) break
        chunks.push(chunk)
      }
      return chunks.length > 0 ? chunks.join('') : null
    } catch {
      return null
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    for (let i = 0; i < MAX_CHUNKS; i++) {
      await SecureStore.deleteItemAsync(`${key}_${i}`).catch(() => {})
    }
    const count = Math.ceil(value.length / CHUNK_SIZE)
    for (let i = 0; i < count; i++) {
      const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
      await SecureStore.setItemAsync(`${key}_${i}`, chunk)
    }
  },

  async removeItem(key: string): Promise<void> {
    for (let i = 0; i < MAX_CHUNKS; i++) {
      await SecureStore.deleteItemAsync(`${key}_${i}`).catch(() => {})
    }
  },
}
