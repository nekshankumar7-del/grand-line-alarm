import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { APP } from '@/editions/editions'
import { SentinelEmblem } from '@/editions/sentinel/SentinelEmblem'
import { cn } from '@/lib/cn'

/** Night-watch streak map: a blueprint of the city with district stops and a patrol car on the route. */

const POS = [
  { x: 40, y: 150 },
  { x: 92, y: 96 },
  { x: 150, y: 140 },
  { x: 206, y: 82 },
  { x: 262, y: 132 },
  { x: 312, y: 70 },
  { x: 352, y: 140 },
]

const ROUTE = `M14 172 C 30 160, 30 150, 40 150 S 70 100, 92 96 S 130 150, 150 140 S 186 80, 206 82 S 240 140, 262 132 S 296 66, 312 70 S 346 120, 352 140`

const C = {
  grid: '#60a5fa',
  route: '#93c5fd',
  trail: '#f59e0b',
  text: '#e0f2fe',
  sub: '#7dd3fc',
  lit: '#38bdf8',
  dim: '#1e40af',
}

function District({ x, y, reached, current, name, icon, days }: { x: number; y: number; reached: boolean; current: boolean; name: string; icon: string; days: number }) {
  const stroke = reached ? C.lit : C.dim
  return (
    <g>
      <motion.g style={{ transformBox: 'fill-box', transformOrigin: 'center' }} animate={current ? { scale: [1, 1.14, 1] } : undefined} transition={{ duration: 1.6, repeat: Infinity }} opacity={reached ? 1 : 0.55}>
        <rect x={x - 14} y={y - 14} width={10} height={18} fill="none" stroke={stroke} strokeWidth={1.6} />
        <rect x={x - 3} y={y - 22} width={9} height={26} fill="none" stroke={stroke} strokeWidth={1.6} />
        <rect x={x + 7} y={y - 10} width={9} height={14} fill="none" stroke={stroke} strokeWidth={1.6} />
        {reached && <circle cx={x + 1} cy={y - 16} r={1.8} fill={C.trail} />}
      </motion.g>
      <text x={x} y={y + 20} textAnchor="middle" fontSize={7.5} fontWeight={800} fill={reached ? C.text : C.sub} opacity={reached ? 1 : 0.75} fontFamily="Nunito Variable, sans-serif">
        {icon} {name}
      </text>
      <text x={x} y={y + 28} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={C.sub} fontFamily="Nunito Variable, sans-serif">
        Night {days}
      </text>
    </g>
  )
}

export function PatrolMap({ streak, className }: { streak: number; className?: string }) {
  const stops = APP.stops.map((s, i) => ({ ...s, ...POS[i] }))
  const reduce = useReducedMotion()
  const pathRef = useRef<SVGPathElement>(null)
  const [marker, setMarker] = useState({ x: 14, y: 172 })

  const reachedIdx = stops.reduce((acc, s, i) => (streak >= s.days ? i : acc), -1)
  const nextStop = stops[reachedIdx + 1]
  const prevDays = reachedIdx >= 0 ? stops[reachedIdx].days : 0
  const legProgress = nextStop ? Math.min(1, (streak - prevDays) / (nextStop.days - prevDays)) : 0
  const fraction = Math.min(1, (reachedIdx + 1 + (nextStop ? legProgress : 0)) / stops.length) * 0.97 + 0.03 * Math.min(1, streak)

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const p = path.getPointAtLength(path.getTotalLength() * fraction)
    setMarker({ x: p.x, y: p.y })
  }, [fraction])

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-white/15 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]', className)}>
      <svg viewBox="0 0 380 210" className="block w-full" role="img" aria-label={`${APP.mapTitle}: ${streak}-night ${APP.streak}${nextStop ? `, next stop ${nextStop.name}` : ''}`}>
        <defs>
          <radialGradient id="pm-bg" cx="50%" cy="45%" r="75%">
            <stop offset="0" stopColor="#1e3a5f" />
            <stop offset="0.75" stopColor="#13294a" />
            <stop offset="1" stopColor="#0a1628" />
          </radialGradient>
          <pattern id="pm-grid" width={19} height={19} patternUnits="userSpaceOnUse">
            <path d="M19 0 L0 0 0 19" fill="none" stroke={C.grid} strokeWidth={0.5} opacity={0.25} />
          </pattern>
        </defs>
        <rect width={380} height={210} fill="url(#pm-bg)" />
        <rect width={380} height={210} fill="url(#pm-grid)" />
        <g opacity={0.35} stroke={C.grid} fill="none" strokeWidth={0.8}>
          <path d="M0 190 Q120 170 200 196 T380 186" strokeWidth={6} stroke="#1d4ed8" opacity={0.6} />
          {[[20, 30], [60, 40], [120, 20], [240, 30], [300, 160], [180, 170], [330, 30]].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={26} height={16} />
          ))}
        </g>

        <path d={ROUTE} fill="none" stroke={C.route} strokeWidth={2.2} strokeDasharray="2 6" strokeLinecap="round" />
        <motion.path
          ref={pathRef}
          d={ROUTE}
          fill="none"
          stroke={C.trail}
          strokeWidth={2.6}
          strokeLinecap="round"
          pathLength={1}
          initial={{ strokeDasharray: '0 1' }}
          animate={{ strokeDasharray: `${fraction} 1` }}
          transition={{ duration: reduce ? 0 : 1.6, ease: 'easeInOut' }}
          style={{ filter: `drop-shadow(0 0 3px ${C.trail})` }}
        />

        {stops.map((s, i) => (
          <District key={s.name} {...s} reached={i <= reachedIdx} current={i === reachedIdx + 1} />
        ))}

        {/* the watchtower searchlight at the end of the route */}
        <g transform="translate(362 104)">
          <motion.path d="M0 0 L-24 -60 L24 -60Z" fill="#fef3c7" opacity={0.22} animate={reduce ? undefined : { rotate: [-20, 20, -20] }} transition={{ duration: 5, repeat: Infinity }} style={{ transformOrigin: '0px 0px' }} />
          <foreignObject x={-9} y={-9} width={18} height={18}>
            <SentinelEmblem className="h-full w-full" color="#f59e0b" />
          </foreignObject>
        </g>

        {/* compass */}
        <motion.g transform="translate(34 40)" animate={reduce ? undefined : { rotate: [0, 12, -8, 0] }} transition={{ duration: 6, repeat: Infinity }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <circle r={20} fill="none" stroke={C.route} strokeWidth={1.2} />
          <path d="M0 -20 L5 0 L0 20 L-5 0Z" fill={C.route} />
          <path d="M0 -20 L5 0 L-5 0Z" fill={C.trail} />
          <text y={-24} textAnchor="middle" fontSize={8} fontWeight={900} fill={C.text}>
            N
          </text>
        </motion.g>

        {/* patrol car */}
        <motion.g initial={false} animate={{ x: marker.x, y: marker.y }} transition={{ type: 'spring', stiffness: 60, damping: 14 }}>
          <motion.g animate={reduce ? undefined : { y: [0, -1, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>
            <path d="M-11 -2 L-7 -8 L7 -8 L11 -2 L11 4 L-11 4Z" fill="#1f2937" stroke="#e0f2fe" strokeWidth={1.2} />
            <circle cx={-6} cy={4} r={2.5} fill="#e0f2fe" />
            <circle cx={6} cy={4} r={2.5} fill="#e0f2fe" />
            <motion.rect x={-3} y={-11} width={6} height={3} rx={1} fill="#f59e0b" animate={reduce ? undefined : { fill: ['#f59e0b', '#ef4444', '#f59e0b'] }} transition={{ duration: 0.8, repeat: Infinity }} />
          </motion.g>
        </motion.g>

        <text x={190} y={18} textAnchor="middle" fontSize={14} fontFamily="Bebas Neue, Impact, sans-serif" letterSpacing={3} fill={C.text}>
          {APP.mapTitle}
        </text>
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-[#020617]/90 to-transparent px-4 pb-2 pt-6 text-xs font-bold text-white">
        <span>🔦 {streak}-night watch</span>
        <span>{nextStop ? `Next: ${nextStop.icon} ${nextStop.name} (${nextStop.days - streak} to go)` : '🗼 Route complete!'}</span>
      </div>
    </div>
  )
}
