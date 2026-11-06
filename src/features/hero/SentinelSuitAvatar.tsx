import { motion, useReducedMotion } from 'motion/react'
import { useId } from 'react'
import { cn } from '@/lib/cn'

const INK = '#0b0f19'
const COAT = '#0f2a33'
const COAT_DARK = '#081a20'
const AMBER = '#f59e0b'

interface SentinelSuitAvatarProps {
  /** The player's face picture (toon portrait or photo, as a data URL). */
  src: string
  visor?: boolean
  className?: string
}

/**
 * "Sentinel form": the player's own face inside the Sentinel's original costume —
 * rounded hood, long-coat shoulders, amber scarf, eye-in-crescent emblem, optional amber visor.
 * Rendered as one SVG so it can be exported to PNG.
 */
export function SentinelSuitAvatar({ src, visor = false, className }: SentinelSuitAvatarProps) {
  const reduce = useReducedMotion()
  const uid = useId().replace(/:/g, '')
  const faceClip = `suit-face-${uid}`
  const bg = `suit-bg-${uid}`

  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="You in Sentinel form" className={cn('h-full w-full', className)} data-suit>
      <defs>
        <radialGradient id={bg} cx="50%" cy="38%" r="70%">
          <stop offset="0" stopColor="#334155" />
          <stop offset="0.6" stopColor="#0f172a" />
          <stop offset="1" stopColor="#020617" />
        </radialGradient>
        <clipPath id={faceClip}>
          <ellipse cx={100} cy={92} rx={39} ry={47} />
        </clipPath>
      </defs>

      {/* night backdrop with a faint searchlight */}
      <rect width={200} height={200} fill={`url(#${bg})`} />
      <path d="M150 0 L200 0 L120 120Z" fill="#fef3c7" opacity={0.08} />

      {/* hood (back) */}
      <path d="M44 128 Q34 38 100 26 Q166 38 156 128 Q150 150 100 152 Q50 150 44 128Z" fill={COAT} stroke={INK} strokeWidth={4} strokeLinejoin="round" />

      {/* coat shoulders */}
      <path d="M8 200 Q14 150 64 138 L100 162 L136 138 Q186 150 192 200Z" fill={COAT} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M20 200 Q26 168 60 154 L66 200Z" fill={COAT_DARK} opacity={0.7} />
      <path d="M64 138 L100 162 L136 138" fill="none" stroke={AMBER} strokeWidth={2} opacity={0.7} />

      {/* the player's face inside the hood */}
      <g clipPath={`url(#${faceClip})`}>
        <rect x={61} y={45} width={78} height={94} fill="#1f2937" />
        <image href={src} x={42} y={34} width={116} height={116} preserveAspectRatio="xMidYMid slice" />
      </g>
      <ellipse cx={100} cy={92} rx={39} ry={47} fill="none" stroke={INK} strokeWidth={3} />

      {/* hood rim over the face edges */}
      <path d="M58 118 Q50 50 100 42 Q150 50 142 118 Q140 74 100 66 Q60 74 58 118Z" fill={COAT} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M62 112 Q58 62 100 52" fill="none" stroke="#1e3a44" strokeWidth={3} />

      {/* optional amber visor across the eyes */}
      {visor && (
        <g>
          <path d="M60 84 Q100 74 140 84 L140 100 Q100 92 60 100Z" fill="#111827" opacity={0.92} stroke={INK} strokeWidth={2.5} />
          <motion.path
            d="M70 91 L130 91"
            stroke={AMBER}
            strokeWidth={4}
            strokeLinecap="round"
            initial={false}
            animate={reduce ? undefined : { opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ filter: 'drop-shadow(0 0 4px #f59e0b)' }}
          />
        </g>
      )}

      {/* scarf + emblem */}
      <path d="M66 140 Q100 158 134 140 L138 156 Q100 176 62 156Z" fill={AMBER} stroke={INK} strokeWidth={3} />
      <motion.path
        d="M124 156 Q140 176 154 172 Q164 186 176 182"
        fill="none"
        stroke={AMBER}
        strokeWidth={9}
        strokeLinecap="round"
        initial={false}
        animate={reduce ? undefined : { d: ['M124 156 Q140 176 154 172 Q164 186 176 182', 'M124 156 Q142 168 158 178 Q168 172 180 188', 'M124 156 Q140 176 154 172 Q164 186 176 182'] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      />
      <g transform="translate(100 182)">
        <path d="M5 -12 A14 14 0 1 0 14 7 A11 11 0 1 1 5 -12Z" fill={AMBER} />
        <path d="M-8 0 Q0 -7 8 0 Q0 7 -8 0Z" fill={AMBER} />
        <circle r={2.6} fill={INK} />
      </g>
    </svg>
  )
}
