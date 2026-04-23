import AsyncStorage from '@react-native-async-storage/async-storage'
import type { StorageAdapter } from '@kurnool-mall/shared-hooks'

// AsyncStorage already satisfies the async StateStorage shape zustand wants;
// this re-export keeps imports consistent across the app.
export const asyncStorageAdapter: StorageAdapter = AsyncStorage
