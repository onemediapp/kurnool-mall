import type { PersistStorage, StateStorage } from 'zustand/middleware'

// Mirrors zustand/middleware StateStorage; both localStorage (sync) and
// AsyncStorage (async) satisfy this via createJSONStorage.
export type StorageAdapter = StateStorage

export type { PersistStorage, StateStorage }
