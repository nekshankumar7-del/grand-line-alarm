import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { alarmSound } from '@/audio/alarmSound'
import { db } from '@/db/db'
import { getHero } from '@/features/hero/hero'
import { fireAlarm } from './actions'
import { dueOccurrence } from './schedule'
import type { ActiveAlarm } from './types'
import { useActiveAlarm } from './useActiveAlarm'

const LOCKED_ROUTES = ['/app/ring', '/app/trial', '/app/victory']
const LATE_FIRE_MS = 3 * 60 * 60_000

async function notifyRinging(active: ActiveAlarm) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const title = `⏰ ${active.label} — still ringing!`
  const options: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
    body: `${getHero(active.crewId).name}: complete your missions to stop the alarm.`,
    tag: 'gla-ring',
    renotify: true,
    requireInteraction: true,
    vibrate: [500, 200, 500, 200, 500],
    icon: '/pwa-192x192.png',
    data: { url: '/app/ring' },
  }
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.showNotification(title, options)
    else new Notification(title, options)
  } catch {
    /* notifications unsupported in this context */
  }
}

/** Mounted once at the root: fires due alarms, keeps the alarm ringing and pins the user to the trials. */
export function useAlarmEngine() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const active = useActiveAlarm()

  // Pre-decode device sounds of enabled alarms so they ring instantly (no fallback beep).
  useEffect(() => {
    void db.alarms
      .filter((a) => a.enabled)
      .toArray()
      .then((list) => list.forEach((a) => alarmSound.warm(a.sound)))
  }, [])

  // Scheduler: check every second, and immediately when the tab wakes up.
  useEffect(() => {
    let busy = false
    const check = async () => {
      if (busy) return
      busy = true
      try {
        const now = new Date()
        const alarms = await db.alarms.filter((a) => a.enabled).toArray()
        for (const alarm of alarms) {
          // Phones freeze background web apps, so an alarm that came due while frozen
          // still fires (strictly) as soon as the app is opened — up to 3 hours late.
          const occ = dueOccurrence(alarm, now, LATE_FIRE_MS)
          if (occ) await fireAlarm(alarm, occ)
        }
      } finally {
        busy = false
      }
    }
    void check()
    const id = window.setInterval(check, 1000)
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    window.addEventListener('pageshow', check)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
      window.removeEventListener('pageshow', check)
    }
  }, [])

  // Route guard: an active alarm always wins.
  useEffect(() => {
    if (!active || LOCKED_ROUTES.includes(pathname)) return
    navigate(active.stage === 'trials' ? '/app/trial' : '/app/ring', { replace: true })
  }, [active, pathname, navigate])

  // Sound, vibration and re-notification while ringing.
  const ringing = Boolean(active)
  const firedAt = active?.firedAt
  const sound = active?.sound
  useEffect(() => {
    if (!ringing || firedAt === undefined) {
      alarmSound.stop()
      return
    }
    alarmSound.start(firedAt, sound)
    const vibrate = () => navigator.vibrate?.([600, 250, 600])
    vibrate()
    const vibeId = window.setInterval(vibrate, 2000)
    return () => {
      window.clearInterval(vibeId)
      navigator.vibrate?.(0)
    }
  }, [ringing, firedAt, sound])

  useEffect(() => {
    if (!active) return
    if (document.visibilityState === 'hidden') void notifyRinging(active)
    const onHide = () => {
      if (document.visibilityState === 'hidden') void notifyRinging(active)
    }
    document.addEventListener('visibilitychange', onHide)
    // Re-fire every 60s while the app is hidden.
    const id = window.setInterval(() => {
      if (document.visibilityState === 'hidden') void notifyRinging(active)
    }, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.clearInterval(id)
    }
  }, [active])
}
