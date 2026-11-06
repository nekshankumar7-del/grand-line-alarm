import type { MissionDefinition } from '@/features/missions/types'
import { APP } from './editions'

/** App configuration (single app: Night Sentinel). */
export function useEdition() {
  return APP
}

/** Mission label lookup (names now live directly on each mission definition). */
export function useMissionLabel() {
  return (def: MissionDefinition<unknown>) => ({ name: def.name, icon: def.icon })
}
