import type { RingtoneId } from '@/audio/ringtones'
import type { HeroId } from '@/features/hero/hero'
import type { MissionType } from '@/features/missions/types'

export interface MissionEntry {
  uid: string
  type: MissionType
  config: unknown
}

export interface Alarm {
  id: string
  hour: number
  minute: number
  /** 0 = Sunday … 6 = Saturday. Empty = rings once. */
  days: number[]
  label: string
  enabled: boolean
  crewId: HeroId
  sound?: RingtoneId
  missions: MissionEntry[]
  createdAt: number
  /** Occurrences before this moment never fire (stops a just-saved alarm ringing instantly). */
  armedAt: number
  lastFiredKey?: string
}

export interface ActiveAlarm {
  id: 'current'
  alarmId: string
  label: string
  crewId: HeroId
  missions: MissionEntry[]
  completed: string[]
  firedAt: number
  stage: 'ringing' | 'trials'
  sound?: RingtoneId
  /** Same-person face check passed for this ring. */
  identityVerified?: boolean
  test?: boolean
}

export interface FaceProfile {
  id: 'me'
  /** Mean 128-d face descriptor — stays on this device, never uploaded. */
  descriptor: number[]
  samples: number[][]
  /** Small local JPEG used on your case file. */
  photo: string
  /** Colours sampled from your photo, used to draw your anime avatar. */
  skin?: string
  hair?: string
  /** Cel-shaded anime portrait generated from the captured photo (remembered). */
  toon?: string
  toonVersion?: number
  enrolledAt: number
}

export interface WakeRecord {
  id: number
  alarmId: string
  label: string
  crewId: HeroId
  firedAt: number
  finishedAt: number
  missions: number
  bounty: number
  streak: number
  emergency: boolean
}
