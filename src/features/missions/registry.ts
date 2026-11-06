import { jumpingJacksMission, squatsMission } from './exercise/exerciseMission'
import { faceCheckMission } from './face-check/faceCheckMission'
import { mathMission } from './math/mathMission'
import { rpsMission } from './rps/rpsMission'
import { smileMission } from './smile/smileMission'
import { typingMission } from './typing/typingMission'
import { vaultMission } from './vault/vaultMission'
import { memoryMission } from './memory/memoryMission'
import type { MissionDefinition, MissionType } from './types'

export const MISSIONS: Record<MissionType, MissionDefinition<unknown>> = {
  'jumping-jacks': jumpingJacksMission,
  squats: squatsMission,
  rps: rpsMission,
  'face-check': faceCheckMission,
  smile: smileMission,
  math: mathMission,
  typing: typingMission,
  vault: vaultMission,
  memory: memoryMission,
}

export const MISSION_LIST = Object.values(MISSIONS)

export const MAX_MISSIONS = 5
