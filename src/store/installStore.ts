import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isStandalone } from '@/pwa/platform'
import type { BeforeInstallPromptEvent, InstallOutcome } from '@/pwa/types'

interface InstallState {
  deferred: BeforeInstallPromptEvent | null
  standalone: boolean
  installed: boolean
  justInstalled: boolean
  bannerDismissed: boolean
  setDeferred(event: BeforeInstallPromptEvent): void
  setStandalone(standalone: boolean): void
  markInstalled(): void
  clearCelebration(): void
  dismissBanner(): void
  promptInstall(): Promise<InstallOutcome>
}

export const useInstallStore = create<InstallState>()(
  persist(
    (set, get) => ({
      deferred: null,
      standalone: isStandalone(),
      installed: false,
      justInstalled: false,
      bannerDismissed: false,
      setDeferred: (deferred) => set({ deferred, installed: false }),
      setStandalone: (standalone) => set({ standalone }),
      markInstalled: () => set({ installed: true, justInstalled: true, deferred: null }),
      clearCelebration: () => set({ justInstalled: false }),
      dismissBanner: () => set({ bannerDismissed: true }),
      promptInstall: async () => {
        const { deferred } = get()
        if (!deferred) return 'unavailable'
        await deferred.prompt()
        const { outcome } = await deferred.userChoice
        set({ deferred: null })
        return outcome
      },
    }),
    {
      name: 'ns-install',
      partialize: ({ installed, bannerDismissed }) => ({ installed, bannerDismissed }),
    },
  ),
)
