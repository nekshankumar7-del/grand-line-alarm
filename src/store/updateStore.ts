import { create } from 'zustand'

interface UpdateState {
  /** A new web version is downloaded and waiting (PWA / browser). */
  ready: boolean
  /** Activates the waiting version and reloads. */
  apply: (() => Promise<void>) | null
  /** Android app: a newer version exists on the website (needs a new APK). */
  nativeLatest: string | null
  dismissedAt: number
  setReady(apply: () => Promise<void>): void
  setNativeLatest(version: string): void
  dismiss(): void
}

export const useUpdateStore = create<UpdateState>((set) => ({
  ready: false,
  apply: null,
  nativeLatest: null,
  dismissedAt: 0,
  setReady: (apply) => set({ ready: true, apply }),
  setNativeLatest: (nativeLatest) => set({ nativeLatest }),
  dismiss: () => set({ dismissedAt: Date.now() }),
}))
