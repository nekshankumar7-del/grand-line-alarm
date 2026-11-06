import type { MissionType } from '@/features/missions/types'

/**
 * Night Sentinel — app-wide configuration (names, ranks, route stops, copy).
 * Everything here is original to this app.
 */
export type Edition = 'sentinel'

export interface Stop {
  days: number
  name: string
  icon: string
}

export const APP = {
  id: 'sentinel' as Edition,
  appName: 'Night Sentinel',
  shortName: 'Night Sentinel',
  tagline: 'One lone guardian hangs over the city all night — and only lets go when you rise.',
  emoji: '🌃',
  home: 'Watchtower',
  currency: 'Reputation',
  currencySuffix: ' REP',
  posterTitle: 'CASE FILE',
  posterTagline: 'Status: Awake',
  shout: 'RISE!',
  trials: 'Missions',
  streak: 'night watch',
  mapTitle: 'NIGHT WATCH ROUTE',
  stops: [
    { days: 1, name: 'Lamplight Lane', icon: '🏮' },
    { days: 3, name: 'Rainy Market', icon: '🌧️' },
    { days: 7, name: 'Clockwork Sq.', icon: '🕰️' },
    { days: 14, name: 'Old Observatory', icon: '🔭' },
    { days: 30, name: 'Iron Bridge', icon: '🌉' },
    { days: 60, name: 'Skyline Spire', icon: '🏙️' },
    { days: 100, name: 'The Watchtower', icon: '🗼' },
  ] as Stop[],
  ranks: [
    { title: 'Rookie', minBounty: 0 },
    { title: 'Watcher', minBounty: 10_000 },
    { title: 'Guardian', minBounty: 100_000 },
    { title: 'Sentinel', minBounty: 1_000_000 },
    { title: 'Legend of the Night', minBounty: 10_000_000 },
  ],
  defaultCrew: 'sentinel',
  titles: ['Sentinel', 'Night Watch', 'Detective', 'Inspector', 'Rooftop Runner', 'Codebreaker', 'Guardian', 'Rookie'],
  defaultSound: 'clocktower',
  missionNames: {} as Partial<Record<MissionType, { name: string; icon: string }>>,
}

export type EditionConfig = typeof APP

/** Kept for call sites written against the old multi-edition API. */
export const EDITIONS: Record<Edition, EditionConfig> = { sentinel: APP }

export function rankFor(_edition: Edition, bounty: number) {
  return [...APP.ranks].reverse().find((r) => bounty >= r.minBounty) ?? APP.ranks[0]
}

export function nextRankFor(_edition: Edition, bounty: number) {
  return APP.ranks.find((r) => r.minBounty > bounty) ?? null
}
