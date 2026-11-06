import { registerSW } from 'virtual:pwa-register'

/** Never interrupt an alarm in progress with a reload. */
const busy = () => ['/app/ring', '/app/trial'].includes(location.pathname)

/**
 * Keeps installed copies up to date: when a new version is deployed, the new service worker
 * takes over and the app reloads once into it (but never while an alarm is ringing).
 */
export function registerServiceWorker() {
  const update = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (!busy()) void update(true)
    },
    onRegisteredSW(_url, registration) {
      // Look for a new version whenever the app is opened / brought back to the front.
      const check = () => void registration?.update().catch(() => undefined)
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
      window.setInterval(check, 30 * 60_000)
    },
  })

  let reloaded = false
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    if (reloaded || busy()) return
    reloaded = true
    location.reload()
  })
}
