import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { FaceProfile } from '@/features/alarms/types'

/** `undefined` while loading, `null` when no face is registered. */
export function useProfile(): FaceProfile | null | undefined {
  return useLiveQuery(async () => (await db.profile.get('me')) ?? null, [])
}
