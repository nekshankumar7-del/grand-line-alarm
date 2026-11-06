import { registerSW } from 'virtual:pwa-register'
import { APP_VERSION, compareVersions } from '@/config/version'
import { isNativeAndroid } from '@/native/sentinelAlarm'
import { useUpdateStore } from '@/store/updateStore'

const SITE = 'https://grand-line-alarm.vercel.app'

/**
 * Updates are offered, never forced: when a new version is deployed it downloads in the
 * background and the app shows "New version available — Update now". Tapping it activates
 * the new version and reloads.
 */
export function registerServiceWorker() {
  if (isNativeAndroid) {
    // The Android app bundles its screens; a newer version means a new APK.
    void checkNativeUpdate()
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && void checkNativeUpdate())
    return
  }

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      useUpdateStore.getState().setReady(() => updateSW(true))
    },
    onRegisteredSW(_url, registration) {
      // Look for a new version whenever the app is opened / brought back, and every 30 min.
      const check = () => void registration?.update().catch(() => undefined)
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
      window.setInterval(check, 30 * 60_000)
    },
  })
}

async function checkNativeUpdate() {
  try {
    const res = await fetch(`${SITE}/version.json`, { cache: 'no-store' })
    if (!res.ok) return
    const { version } = (await res.json()) as { version?: string }
    if (version && compareVersions(version, APP_VERSION) > 0) useUpdateStore.getState().setNativeLatest(version)
  } catch {
    /* offline — try again later */
  }
}
