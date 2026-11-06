import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/** Case-file picture: toon portrait, real photo, or your face in the Sentinel's suit. */
export type AvatarMode = 'toon' | 'photo' | 'sentinel'
export type SuitFace = 'toon' | 'photo'

interface PlayerState {
  name: string
  title: string
  avatarMode: AvatarMode
  /** Sentinel form: which picture of you goes inside the hood. */
  suitFace: SuitFace
  /** Sentinel form: amber visor over the eyes. */
  visor: boolean
  bounty: number
  streak: number
  bestStreak: number
  wakes: number
  lastWakeDay: string | null
  setProfile(patch: Partial<Pick<PlayerState, 'name' | 'title' | 'avatarMode' | 'suitFace' | 'visor'>>): void
  /** Returns the streak after recording this wake-up. */
  recordWake(bounty: number, at?: Date): number
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      name: 'Sentinel',
      title: 'Sentinel',
      avatarMode: 'toon',
      suitFace: 'toon',
      visor: false,
      bounty: 0,
      streak: 0,
      bestStreak: 0,
      wakes: 0,
      lastWakeDay: null,
      setProfile: (patch) => set(patch),
      recordWake(bounty, at = new Date()) {
        const today = dayKey(at)
        const yesterday = new Date(at)
        yesterday.setDate(at.getDate() - 1)
        const { streak, lastWakeDay, bestStreak } = get()
        const next = lastWakeDay === today ? streak : lastWakeDay === dayKey(yesterday) ? streak + 1 : 1
        set((s) => ({
          bounty: s.bounty + bounty,
          wakes: s.wakes + 1,
          streak: next,
          bestStreak: Math.max(bestStreak, next),
          lastWakeDay: today,
        }))
        return next
      },
    }),
    {
      name: 'ns-player',
      version: 3,
      migrate: (persisted) => {
        const s = persisted as Partial<PlayerState> & { avatarMode?: string }
        const mode = s.avatarMode === 'photo' || s.avatarMode === 'sentinel' ? s.avatarMode : 'toon'
        return { suitFace: 'toon', visor: false, ...s, avatarMode: mode } as PlayerState
      },
    },
  ),
)
