import { createAppStore } from '@kurnool-mall/shared-hooks'
import { asyncStorageAdapter } from '@/lib/async-storage-adapter'

export const useAppStore = createAppStore({ storage: asyncStorageAdapter })
export type { ActiveTab, Language } from '@kurnool-mall/shared-hooks'
