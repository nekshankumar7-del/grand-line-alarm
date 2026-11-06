import { useLiveQuery } from 'dexie-react-hooks'
import { ACTIVE_KEY, db } from '@/db/db'
import type { ActiveAlarm } from './types'

/** `undefined` while loading, `null` when nothing is ringing. */
export function useActiveAlarm(): ActiveAlarm | null | undefined {
  return useLiveQuery(async () => (await db.active.get(ACTIVE_KEY)) ?? null, [])
}
