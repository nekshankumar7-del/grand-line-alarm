import type { Alarm } from './types'

type Timing = Pick<Alarm, 'hour' | 'minute' | 'days'>

/** Uses local wall-clock time, so DST and timezone changes are handled by the Date object. */
export function occurrenceOn(day: Date, alarm: Timing) {
  const d = new Date(day)
  d.setHours(alarm.hour, alarm.minute, 0, 0)
  return d
}

export function nextOccurrence(alarm: Timing, from = new Date()): Date | null {
  for (let i = 0; i <= 7; i++) {
    const day = new Date(from)
    day.setDate(from.getDate() + i)
    const occ = occurrenceOn(day, alarm)
    if (occ.getTime() <= from.getTime()) continue
    if (alarm.days.length === 0 || alarm.days.includes(occ.getDay())) return occ
  }
  return null
}

export function fireKey(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Returns today's occurrence if it is due now (within a grace window for throttled/sleeping tabs). */
export function dueOccurrence(alarm: Alarm, now = new Date(), graceMs = 5 * 60_000): Date | null {
  const occ = occurrenceOn(now, alarm)
  const late = now.getTime() - occ.getTime()
  if (late < 0 || late > graceMs) return null
  if (occ.getTime() < alarm.armedAt) return null
  if (alarm.days.length > 0 && !alarm.days.includes(occ.getDay())) return null
  if (alarm.lastFiredKey === fireKey(occ)) return null
  return occ
}
