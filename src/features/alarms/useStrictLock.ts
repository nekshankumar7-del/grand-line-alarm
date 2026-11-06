import { useEffect, useState } from 'react'
import { alarmSound } from '@/audio/alarmSound'

/**
 * Strict mode while an alarm is active (ringing or missions in progress).
 * What a web app CAN do (and does here):
 *  - trap the Android/browser Back button (history guard)
 *  - ask for confirmation on reload / closing the tab
 *  - go fullscreen (hides the phone's navigation bar) after the first tap
 *  - when you leave and come back: alarm snaps back to full volume + warning
 * What it can't do: block the Home button / app switcher — only the native Android build
 * (screen pinning / lock-task mode) can do that.
 */
export function useStrictLock(active: boolean) {
  const [escapes, setEscapes] = useState(0)

  useEffect(() => {
    if (!active) return

    // 1) Back-button trap: keep a guard entry on top of history.
    const guard = () => history.pushState({ strictLock: true }, '', location.href)
    guard()
    const onPop = () => {
      guard()
      setEscapes((n) => n + 1)
      navigator.vibrate?.([200, 80, 200])
    }
    window.addEventListener('popstate', onPop)

    // 2) Reload / close confirmation.
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)

    // 3) Fullscreen on the first interaction (browsers require a user gesture).
    const goFullscreen = () => {
      const el = document.documentElement
      if (!document.fullscreenElement && el.requestFullscreen) {
        el.requestFullscreen({ navigationUI: 'hide' }).catch(() => undefined)
      }
      try {
        const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
        void orientation.lock?.('portrait').catch(() => undefined)
      } catch {
        /* unsupported */
      }
    }
    window.addEventListener('pointerdown', goFullscreen)

    // 4) Leaving the app and coming back: full volume again + warning.
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') return
      setEscapes((n) => n + 1)
      alarmSound.setDucked(false)
      alarmSound.unlock()
      navigator.vibrate?.([400, 120, 400])
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('pointerdown', goFullscreen)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [active])

  return escapes
}

/** Leave fullscreen once the alarm is finished. */
export function exitStrictFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
}
