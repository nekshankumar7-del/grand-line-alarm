type Bezier = [number, number, number, number]

export const duration = {
  instant: 0.1,
  fast: 0.2,
  base: 0.35,
  slow: 0.6,
  cinematic: 1.2,
} as const

export const ease: Record<'out' | 'inOut' | 'anticipate', Bezier> = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
  anticipate: [0.68, -0.6, 0.32, 1.6],
}

export const spring = {
  snappy: { type: 'spring', stiffness: 500, damping: 30 },
  bouncy: { type: 'spring', stiffness: 300, damping: 12 },
  gentle: { type: 'spring', stiffness: 120, damping: 20 },
} as const

export const stagger = {
  tight: 0.04,
  base: 0.08,
  loose: 0.15,
} as const

export const gsapEase = {
  impact: 'back.out(3)',
  wave: 'sine.inOut',
  punch: 'elastic.out(1, 0.4)',
} as const
