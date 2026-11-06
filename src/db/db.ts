import Dexie, { type EntityTable } from 'dexie'
import type { ActiveAlarm, Alarm, FaceProfile, WakeRecord } from '@/features/alarms/types'

/** An alarm sound the user picked from their device (stored only on this device). */
export interface CustomSound {
  id: string
  name: string
  blob: Blob
  createdAt: number
}

const SCHEMA = {
  alarms: 'id, enabled',
  active: 'id',
  history: '++id, firedAt',
  profile: 'id',
}

export const db = new Dexie('night-sentinel') as Dexie & {
  alarms: EntityTable<Alarm, 'id'>
  active: EntityTable<ActiveAlarm, 'id'>
  history: EntityTable<WakeRecord, 'id'>
  profile: EntityTable<FaceProfile, 'id'>
  sounds: EntityTable<CustomSound, 'id'>
}

db.version(1).stores(SCHEMA)
db.version(2).stores({ ...SCHEMA, sounds: 'id, createdAt' })

export const ACTIVE_KEY = 'current' as const

/** Copies data from the app's previous database name (one time), then removes it. */
export async function migrateLegacyDb() {
  const LEGACY = 'grand-line-alarm'
  try {
    if (!(await Dexie.exists(LEGACY))) return
    const old = new Dexie(LEGACY)
    old.version(2).stores(SCHEMA)
    await old.open()
    await db.transaction('rw', db.alarms, db.active, db.history, db.profile, async () => {
      for (const name of Object.keys(SCHEMA) as Array<keyof typeof SCHEMA>) {
        const rows = await old.table(name).toArray()
        if (rows.length && (await db.table(name).count()) === 0) await db.table(name).bulkPut(rows)
      }
    })
    old.close()
    await Dexie.delete(LEGACY)
  } catch {
    /* keep the legacy DB if anything fails */
  }
}
