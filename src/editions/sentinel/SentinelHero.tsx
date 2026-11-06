import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'
import { LITE } from '@/lib/perf'

export type HeroMood = 'idle' | 'angry' | 'cheer'

/**
 * The Sentinel — Night Sentinel's single original hero.
 * Hooded long coat, visor with a glowing slit, amber scarf, lantern, eye-in-crescent emblem.
 *  idle  → hangs upside-down by the ankles, swaying gently, lantern dangling below
 *  angry → (alarm ringing / being pulled) swings hard, visor strobes red, lantern flashes
 *  cheer → stands upright in a victory pose
 *
 * The hanging pose uses a plain SVG `transform` attribute (not CSS transforms), so nested
 * parts always stay in the right place in every browser.
 */

const INK = '#0b0f19'
const COAT = '#0f2a33'
const COAT_DARK = '#081a20'
const AMBER = '#f59e0b'
const SKIN = '#e8c2a4'

function Emblem({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M4 -10 A12 12 0 1 0 12 6 A9.5 9.5 0 1 1 4 -10Z" fill={AMBER} />
      <path d="M-7 0 Q0 -6 7 0 Q0 6 -7 0Z" fill={AMBER} />
      <circle r={2.2} fill={INK} />
    </g>
  )
}

/** The figure drawn upright (head at top, feet at bottom, arms raised). */
function Figure({ ringing, happy, reduce }: { ringing: boolean; happy: boolean; reduce: boolean | null }) {
  return (
    <g>
      {/* legs + boots */}
      <path d="M84 196 L80 296 L97 296 L99 196Z" fill="#111827" stroke={INK} strokeWidth={3} />
      <path d="M101 196 L103 296 L120 296 L116 196Z" fill="#111827" stroke={INK} strokeWidth={3} />
      <path d="M79 274 L98 274 L98 298 L76 298Z M102 274 L121 274 L124 298 L102 298Z" fill="#1f2937" stroke={INK} strokeWidth={3} />
      <path d="M79 280 L98 280 M102 280 L121 280" stroke={AMBER} strokeWidth={2.5} />

      {/* long coat */}
      <path fill={COAT} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" d="M62 112 Q100 98 138 112 L154 252 Q126 262 104 254 L100 214 L96 254 Q74 262 46 252Z" />
      <path d="M100 116 L100 214" stroke={COAT_DARK} strokeWidth={3} />
      <path d="M62 112 L46 252 M138 112 L154 252" stroke={AMBER} strokeWidth={1.6} opacity={0.7} />
      <rect x={64} y={180} width={72} height={10} rx={3} fill="#111827" stroke={INK} strokeWidth={2.5} />
      <Emblem x={100} y={185} s={0.55} />
      <Emblem x={100} y={145} s={0.9} />

      {/* arms raised (when hanging they point at the ground) */}
      <path d="M70 116 L54 34 L70 28 L86 112Z" fill={COAT} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M130 116 L146 34 L130 28 L114 112Z" fill={COAT} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <circle cx={61} cy={28} r={9} fill="#1f2937" stroke={INK} strokeWidth={3} />
      <circle cx={139} cy={28} r={9} fill="#1f2937" stroke={INK} strokeWidth={3} />

      {/* scarf */}
      <path d="M76 106 Q100 120 124 106 L126 118 Q100 132 74 118Z" fill={AMBER} stroke={INK} strokeWidth={3} />
      <motion.path
        fill="none"
        stroke={AMBER}
        strokeWidth={10}
        strokeLinecap="round"
        d="M116 118 Q136 140 150 132 Q160 150 172 142"
        initial={false}
        animate={reduce || LITE ? undefined : { d: ['M116 118 Q136 140 150 132 Q160 150 172 142', 'M116 118 Q138 130 154 140 Q166 132 176 150', 'M116 118 Q136 140 150 132 Q160 150 172 142'] }}
        transition={{ duration: ringing ? 0.6 : 2, repeat: Infinity }}
      />

      {/* head: hood, lower face, visor */}
      <path d="M64 98 Q58 36 100 32 Q142 36 136 98 Q122 114 100 114 Q78 114 64 98Z" fill={COAT} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M74 92 Q72 54 100 52 Q128 54 126 92 Q116 108 100 108 Q84 108 74 92Z" fill={SKIN} stroke={INK} strokeWidth={2.5} />
      <path d="M74 66 Q100 58 126 66 L126 84 Q100 78 74 84Z" fill="#111827" stroke={INK} strokeWidth={2.5} />
      <motion.path
        d="M82 73 L118 73"
        stroke={AMBER}
        strokeWidth={4}
        strokeLinecap="round"
        initial={false}
        animate={reduce ? undefined : ringing ? { stroke: ['#ef4444', '#f59e0b', '#ef4444'], opacity: [1, 0.4, 1] } : { opacity: [0.7, 1, 0.7] }}
        transition={{ duration: ringing ? 0.3 : 2, repeat: Infinity }}
        style={{ filter: 'drop-shadow(0 0 4px #f59e0b)' }}
      />
      <path d={happy ? 'M90 96 Q100 104 110 96' : ringing ? 'M90 98 L110 98' : 'M92 97 Q100 100 108 97'} fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M66 70 Q60 92 70 102 M134 70 Q140 92 130 102" fill="none" stroke={COAT_DARK} strokeWidth={2} />
    </g>
  )
}

function Lantern({ x, y, ringing, reduce, beamUp = false }: { x: number; y: number; ringing: boolean; reduce: boolean | null; beamUp?: boolean }) {
  // (x, y) = where the hand grips the handle; the lantern body hangs/rests below it.
  return (
    <g>
      <motion.path
        d={beamUp ? `M${x} ${y - 4} L${x - 34} ${y - 96} L${x + 34} ${y - 96}Z` : `M${x} ${y + 26} L${x - 40} ${y + 120} L${x + 40} ${y + 120}Z`}
        fill={beamUp ? 'url(#sentinel-beam-up)' : 'url(#sentinel-beam)'}
        initial={false}
        animate={reduce ? undefined : { opacity: ringing ? [0.1, 0.9, 0.1] : [0.25, 0.55, 0.25] }}
        transition={{ duration: ringing ? 0.35 : 2.4, repeat: Infinity }}
      />
      <path d={`M${x} ${y} L${x} ${y + 8}`} stroke="#9ca3af" strokeWidth={2} />
      <path d={`M${x - 8} ${y + 8} L${x + 8} ${y + 8} L${x + 11} ${y + 22} Q${x} ${y + 32} ${x - 11} ${y + 22}Z`} fill="#fde68a" stroke={INK} strokeWidth={2.5} />
      <motion.circle cx={x} cy={y + 18} r={4} fill={AMBER} initial={false} animate={reduce ? undefined : { opacity: [0.6, 1, 0.6] }} transition={{ duration: 1, repeat: Infinity }} />
    </g>
  )
}

export function SentinelHero({ mood = 'idle', className, label = 'The Sentinel' }: { mood?: HeroMood; className?: string; label?: string }) {
  const reduce = useReducedMotion()
  const hanging = mood !== 'cheer'
  const ringing = mood === 'angry'
  const swing = reduce || !hanging ? { rotate: 0 } : ringing ? { rotate: [-16, 16, -16] } : { rotate: [-5, 5, -5] }

  return (
    <svg viewBox="0 0 200 320" role="img" aria-label={label} className={cn('overflow-visible', className)}>
      <defs>
        <linearGradient id="sentinel-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" stopOpacity={0.75} />
          <stop offset="1" stopColor="#fde68a" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="sentinel-beam-up" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fde68a" stopOpacity={0.75} />
          <stop offset="1" stopColor="#fde68a" stopOpacity={0} />
        </linearGradient>
      </defs>

      {hanging ? (
        /* pendulum around the rope anchor at the top centre */
        <motion.g
          style={{ transformBox: 'view-box', transformOrigin: '100px 0px' }}
          initial={false}
          animate={swing}
          transition={{ duration: ringing ? 1 : 3.2, repeat: reduce ? 0 : Infinity, ease: 'easeInOut' }}
        >
          <path d="M100 0 L100 34" stroke="#cbd5e1" strokeWidth={2.5} />
          {/* figure flipped upside-down: boots at the top, head and hands at the bottom */}
          <g transform="rotate(180 100 167)">
            <Figure ringing={ringing} happy={false} reduce={reduce} />
            {/* rope loop around the ankles */}
            <ellipse cx={100} cy={292} rx={26} ry={6} fill="none" stroke="#cbd5e1" strokeWidth={3} />
          </g>
          {/* lantern hangs from the (now lower) right hand: hand (139,28) → (61,306) after the flip */}
          <Lantern x={61} y={306} ringing={ringing} reduce={reduce} />
        </motion.g>
      ) : (
        <motion.g initial={{ y: -40, opacity: 0 }} animate={{ y: reduce ? 0 : [0, -16, 0], opacity: 1 }} transition={{ y: { duration: 0.6, repeat: reduce ? 0 : Infinity, repeatDelay: 0.8 }, opacity: { duration: 0.3 } }}>
          <Figure ringing={false} happy reduce={reduce} />
          <Lantern x={139} y={0} ringing={false} reduce={reduce} beamUp />
          {!reduce &&
            [
              [30, 60],
              [170, 50],
              [24, 160],
              [178, 150],
            ].map(([x, y], i) => <motion.circle key={i} cx={x} cy={y} r={4} fill="#fde68a" animate={{ scale: [0, 1.6, 0], opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />)}
        </motion.g>
      )}
    </svg>
  )
}
