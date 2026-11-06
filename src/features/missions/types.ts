import type { FC } from 'react'

export type MissionType = 'face-check' | 'smile' | 'jumping-jacks' | 'squats' | 'rps' | 'math' | 'typing' | 'vault' | 'memory'

export interface MissionRunnerProps<Config> {
  config: Config
  onProgress(p: number): void
  onComplete(): void
  onFail(reason: string): void
  /** Called when the mission physically can't run (e.g. no camera); the trial is swapped, never skipped. */
  onUnavailable?(reason: string): void
}

export interface MissionDefinition<Config> {
  id: MissionType
  name: string
  icon: string
  description: string
  needsCamera: boolean
  /** Which on-device model to pre-download when this trial is added. */
  visionModel?: 'face' | 'pose' | 'gesture'
  defaultConfig: Config
  summary(config: Config): string
  ConfigEditor: FC<{ value: Config; onChange(c: Config): void }>
  Runner: FC<MissionRunnerProps<Config>>
}

export function defineMission<Config>(def: MissionDefinition<Config>) {
  return def as unknown as MissionDefinition<unknown>
}
