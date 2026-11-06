import { useInstallStore } from '@/store/installStore'
import type { BeforeInstallPromptEvent } from './types'

export function initInstallListeners() {
  const store = useInstallStore.getState()

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    store.setDeferred(event as BeforeInstallPromptEvent)
  })

  window.addEventListener('appinstalled', () => store.markInstalled())

  window
    .matchMedia('(display-mode: standalone)')
    .addEventListener('change', (event) => store.setStandalone(event.matches))
}
