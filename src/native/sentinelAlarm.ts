import { Capacitor, registerPlugin } from '@capacitor/core'
import { nextOccurrence } from '@/features/alarms/schedule'
import type { Alarm } from '@/features/alarms/types'

/** What the native Android side reports about alarm readiness. */
export interface NativeStatus {
  notifications: boolean
  exactAlarms: boolean
  fullScreen: boolean
  battery: boolean
  pinned: boolean
  ringing: boolean
}

interface SentinelAlarmPlugin {
  sync(options: { alarms: Array<{ id: string; at: number; label: string }> }): Promise<void>
  startRinging(options: { label: string }): Promise<void>
  stopRinging(): Promise<void>
  setMuted(options: { muted: boolean }): Promise<void>
  lock(): Promise<void>
  unlock(): Promise<void>
  status(): Promise<NativeStatus>
  requestNotifications(): Promise<NativeStatus>
  openExactAlarmSettings(): Promise<void>
  openFullScreenSettings(): Promise<void>
  openBatterySettings(): Promise<void>
  openPinningSettings(): Promise<void>
}

/** True inside the installed Android app (Capacitor), false in the browser / PWA. */
export const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'

export const SentinelAlarm = registerPlugin<SentinelAlarmPlugin>('SentinelAlarm')

const quiet = <T,>(p: Promise<T>) => p.catch(() => undefined)

/** Hand the next occurrence of every enabled alarm to Android's exact alarm clock. */
export async function syncNativeAlarms(alarms: Alarm[]) {
  if (!isNativeAndroid) return
  const list = alarms
    .filter((a) => a.enabled)
    .map((a) => ({ id: a.id, at: nextOccurrence(a)?.getTime() ?? 0, label: a.label || 'Alarm' }))
    .filter((a) => a.at > Date.now())
  await quiet(SentinelAlarm.sync({ alarms: list }))
}

export const nativeStartRinging = (label: string) => (isNativeAndroid ? quiet(SentinelAlarm.startRinging({ label })) : Promise.resolve())
export const nativeStopRinging = () => (isNativeAndroid ? quiet(SentinelAlarm.stopRinging()) : Promise.resolve())
export const nativeSetMuted = (muted: boolean) => (isNativeAndroid ? quiet(SentinelAlarm.setMuted({ muted })) : Promise.resolve())
export const nativeLock = () => (isNativeAndroid ? quiet(SentinelAlarm.lock()) : Promise.resolve())
export const nativeUnlock = () => (isNativeAndroid ? quiet(SentinelAlarm.unlock()) : Promise.resolve())
export const nativeStatus = () => (isNativeAndroid ? SentinelAlarm.status().catch(() => null) : Promise.resolve(null))
