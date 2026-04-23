import { createCartStore } from '@kurnool-mall/shared-hooks'
import { asyncStorageAdapter } from '@/lib/async-storage-adapter'

export const useCart = createCartStore({ storage: asyncStorageAdapter })
