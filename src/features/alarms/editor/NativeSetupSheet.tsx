import { useCallback, useEffect, useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { isNativeAndroid, nativeStatus, SentinelAlarm, type NativeStatus } from '@/native/sentinelAlarm'
import { cn } from '@/lib/cn'

const SEEN_KEY = 'ns-native-setup-seen'

/** Has the strict-mode setup been completed/acknowledged (Android app only)? */
export async function needsNativeSetup() {
  if (!isNativeAndroid) return false
  const status = await nativeStatus()
  const missing = !status || !status.notifications || !status.exactAlarms || !status.fullScreen || !status.battery
  let seen = false
  try {
    seen = localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    /* ignore */
  }
  return missing || !seen
}

interface Row {
  key: keyof NativeStatus | 'pinning'
  icon: string
  title: string
  why: string
  action: string
  run(): Promise<unknown>
}

const ROWS: Row[] = [
  { key: 'notifications', icon: '🔔', title: 'Notifications', why: 'Shows the ringing alarm and brings you back to your missions.', action: 'Allow', run: () => SentinelAlarm.requestNotifications() },
  { key: 'exactAlarms', icon: '⏰', title: 'Exact alarms', why: 'Rings at the exact minute, even when the app is closed.', action: 'Open settings', run: () => SentinelAlarm.openExactAlarmSettings() },
  { key: 'fullScreen', icon: '📱', title: 'Full-screen alarm', why: 'Opens the alarm over the lock screen.', action: 'Open settings', run: () => SentinelAlarm.openFullScreenSettings() },
  { key: 'battery', icon: '🔋', title: 'Battery: unrestricted', why: 'Stops Android from killing the alarm to save power.', action: 'Allow', run: () => SentinelAlarm.openBatterySettings() },
  {
    key: 'pinning',
    icon: '📌',
    title: 'App pinning (strict lock)',
    why: 'While the alarm rings, the app pins itself so Home, Recents and “Clear all” are blocked until your missions are done. Turn on “App pinning” (Security settings), then accept “Pin app?” when it rings.',
    action: 'Open settings',
    run: () => SentinelAlarm.openPinningSettings(),
  },
]

export function NativeSetupSheet({ open, onDone, onClose }: { open: boolean; onDone(): void; onClose(): void }) {
  const [status, setStatus] = useState<NativeStatus | null>(null)

  const refresh = useCallback(async () => setStatus(await nativeStatus()), [])

  useEffect(() => {
    if (!open) return
    void refresh()
    // Coming back from Android settings → re-check.
    const onVisible = () => document.visibilityState === 'visible' && void refresh()
    document.addEventListener('visibilitychange', onVisible)
    const id = window.setInterval(() => void refresh(), 2000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(id)
    }
  }, [open, refresh])

  const ok = (key: Row['key']) => (key === 'pinning' ? null : status ? Boolean(status[key]) : false)
  const allSet = ROWS.every((r) => r.key === 'pinning' || ok(r.key))

  function finish() {
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* ignore */
    }
    onDone()
  }

  return (
    <Sheet open={open} title="Make it strict" onClose={onClose}>
      <p className="text-sm opacity-80">Allow these once so the alarm rings on time, keeps ringing even if the app is cleared, and locks the phone to your missions.</p>
      <ul className="mt-4 space-y-3">
        {ROWS.map((r) => {
          const state = ok(r.key)
          return (
            <li key={r.key} className="rounded-2xl border-2 border-black/15 bg-white/60 p-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{r.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {r.title}{' '}
                    {state !== null && <span className={cn('ml-1 text-xs', state ? 'text-emerald-700' : 'text-red-700')}>{state ? '✅ Done' : '⚠️ Needed'}</span>}
                  </p>
                  <p className="text-xs opacity-75">{r.why}</p>
                </div>
                {state !== true && (
                  <button type="button" onClick={() => void r.run().then(refresh)} className="shrink-0 rounded-full bg-[#0b0f19] px-3 py-1.5 text-xs font-bold text-amber-400">
                    {r.action}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <button type="button" onClick={finish} className={cn('mt-5 w-full rounded-2xl border-2 border-black py-3 font-display text-2xl tracking-wide', allSet ? 'bg-amber-400' : 'bg-white')}>
        {allSet ? '✔ All set — save alarm' : 'Continue anyway'}
      </button>
    </Sheet>
  )
}
