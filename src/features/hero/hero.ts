/**
 * The Sentinel — Night Sentinel's single, original hero.
 * (Alarms store a `crewId` for compatibility; every id resolves to the Sentinel.)
 */
export type HeroId = 'sentinel'

export interface HeroVoice {
  pitch: number
  rate: number
  prefer: 'male' | 'female'
}

export interface Hero {
  id: HeroId
  name: string
  role: string
  tagline: string
  personality: string
  catchphrase: string
  aura: string
  voice: HeroVoice
  lines: { ring: string[]; taunt: string[]; cheer: string[] }
}

export const HERO: Hero = {
  id: 'sentinel',
  name: 'The Sentinel',
  role: 'Night Sentinel',
  tagline: 'Hangs from the skyline all night. Lets go only when you rise.',
  personality: 'Quiet, steady, unshakeable. Few words — every one of them an order to get up.',
  catchphrase: 'The night is over. Rise.',
  aura: '#f59e0b',
  voice: { pitch: 0.7, rate: 0.9, prefer: 'male' },
  lines: {
    ring: ['The night is over. Rise.', 'I have watched all night. Your turn.', 'The city is waking. So are you.', 'Lights on. Feet on the floor.'],
    taunt: ['Focus.', 'Again. Faster.', 'The city does not wait.', 'Stay sharp.'],
    cheer: ['Dawn secured.', 'Good. The day is yours.', 'You are ready.', 'Watch complete.'],
  },
}

/** Every stored hero/crew id resolves to the Sentinel. */
export function getHero(_id?: string): Hero {
  return HERO
}

export function pickLine(lines: string[], seed = Date.now()) {
  return lines[Math.abs(Math.floor(seed)) % lines.length]
}
