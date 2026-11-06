import { DEFAULT_RINGTONE } from '@/audio/ringtones'
import { ACTIVE_KEY, db } from '@/db/db'
import { MISSIONS } from '@/features/missions/registry'
import type { MissionType } from '@/features/missions/types'
import { usePlayerStore } from '@/store/playerStore'
import { fireKey } from './schedule'
import type { ActiveAlarm, Alarm, MissionEntry, WakeRecord } from './types'

export const newUid = () => crypto.randomUUID()

export function createMission(type: MissionType, config?: unknown): MissionEntry {
  return { uid: newUid(), type, config: config ?? structuredClone(MISSIONS[type].defaultConfig) }
}

export function newAlarmDraft(): Alarm {
  const at = new Date(Date.now() + 8 * 3600_000)
  return {
    id: newUid(),
    hour: at.getHours(),
    minute: Math.round(at.getMinutes() / 5) * 5 % 60,
    days: [1, 2, 3, 4, 5],
    label: 'Night watch',
    enabled: true,
    crewId: 'sentinel',
    sound: DEFAULT_RINGTONE,
    missions: [createMission('face-check'), createMission('jumping-jacks')],
    createdAt: Date.now(),
    armedAt: Date.now(),
  }
}

function toActive(alarm: Alarm, test = false): ActiveAlarm {
  return {
    id: ACTIVE_KEY,
    alarmId: alarm.id,
    label: alarm.label || 'Alarm',
    crewId: alarm.crewId,
    sound: alarm.sound ?? DEFAULT_RINGTONE,
    // Fresh uids per ring so progress never leaks between rings.
    missions: alarm.missions.map((m) => ({ ...m, uid: newUid() })),
    completed: [],
    firedAt: Date.now(),
    stage: 'ringing',
    test,
  }
}

export async function fireAlarm(alarm: Alarm, occurrence: Date) {
  await db.transaction('rw', db.alarms, db.active, async () => {
    const patch: Partial<Alarm> = { lastFiredKey: fireKey(occurrence) }
    if (alarm.days.length === 0) patch.enabled = false
    await db.alarms.update(alarm.id, patch)
    if (!(await db.active.get(ACTIVE_KEY))) await db.active.put(toActive(alarm))
  })
}

export async function ringNow(alarm: Alarm) {
  await db.active.put(toActive(alarm, true))
}

export async function startTrials() {
  await db.active.update(ACTIVE_KEY, { stage: 'trials' })
}

export async function markIdentityVerified() {
  await db.active.update(ACTIVE_KEY, { identityVerified: true })
}

export async function completeMission(uid: string) {
  await db.active
    .where('id')
    .equals(ACTIVE_KEY)
    .modify((a) => {
      if (!a.completed.includes(uid)) a.completed.push(uid)
    })
}

/** Camera unavailable → swap for a harder non-camera trial (never a free skip). */
export async function swapForFallback(uid: string) {
  await db.active
    .where('id')
    .equals(ACTIVE_KEY)
    .modify((a) => {
      a.missions = a.missions.map((m) =>
        m.uid === uid ? { uid: newUid(), type: 'math', config: { count: 5, difficulty: 'hard' } } : m,
      )
    })
}

function bountyFor(active: ActiveAlarm, finishedAt: number) {
  const seconds = (finishedAt - active.firedAt) / 1000
  const base = 500 * active.missions.length
  const speedBonus = Math.max(0, Math.round((3000 - seconds * 5) / 10) * 10)
  return base + speedBonus
}

async function closeActive(emergency: boolean): Promise<WakeRecord | null> {
  const active = await db.active.get(ACTIVE_KEY)
  if (!active) return null
  const finishedAt = Date.now()
  const bounty = emergency || active.test ? 0 : bountyFor(active, finishedAt)
  const streak = bounty > 0 ? usePlayerStore.getState().recordWake(bounty) : usePlayerStore.getState().streak
  const record: Omit<WakeRecord, 'id'> = {
    alarmId: active.alarmId,
    label: active.label,
    crewId: active.crewId,
    firedAt: active.firedAt,
    finishedAt,
    missions: active.missions.length,
    bounty,
    streak,
    emergency,
  }
  const id = await db.transaction('rw', db.active, db.history, async () => {
    await db.active.delete(ACTIVE_KEY)
    return db.history.add(record)
  })
  return { ...record, id }
}

export const finishAlarm = () => closeActive(false)
export const emergencyExit = () => closeActive(true)
