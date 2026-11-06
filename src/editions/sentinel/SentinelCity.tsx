import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { SentinelEmblem } from './SentinelEmblem'

/**
 * Night Sentinel backdrop: the original rainy city of Ravenmoor.
 * Layers: sky → moon/clouds → searchlight with the eye-and-crescent emblem → 3 parallax skyline rows
 * with flickering windows → rooftop with water tower → weather (rain / fog / neon glow).
 */

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

interface Building {
  x: number
  w: number
  h: number
  roof: 'flat' | 'spire' | 'step' | 'dome'
}

function skyline(seed: number, count: number, minH: number, maxH: number): Building[] {
  const out: Building[] = []
  let x = -20
  for (let i = 0; i < count; i++) {
    const w = 50 + rand(seed + i) * 90
    const h = minH + rand(seed + i * 3) * (maxH - minH)
    const r = rand(seed + i * 7)
    out.push({ x, w, h, roof: r < 0.55 ? 'flat' : r < 0.7 ? 'spire' : r < 0.85 ? 'step' : 'dome' })
    x += w + rand(seed + i * 5) * 12
  }
  return out
}

const FAR = skyline(1, 22, 140, 300)
const MID = skyline(50, 18, 110, 240)
const NEAR = skyline(99, 14, 70, 160)

function Row({ buildings, color, windowColor, litRatio, seed, neon }: { buildings: Building[]; color: string; windowColor: string; litRatio: number; seed: number; neon?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 1440 400" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-full w-full">
      {buildings.map((b, i) => {
        const top = 400 - b.h
        const cols = Math.max(2, Math.floor(b.w / 16))
        const rows = Math.max(3, Math.floor(b.h / 22))
        return (
          <g key={i}>
            <rect x={b.x} y={top} width={b.w} height={b.h} fill={color} />
            {b.roof === 'spire' && <path d={`M${b.x + b.w / 2 - 6} ${top} L${b.x + b.w / 2} ${top - 40} L${b.x + b.w / 2 + 6} ${top}Z`} fill={color} />}
            {b.roof === 'step' && <rect x={b.x + b.w * 0.2} y={top - 18} width={b.w * 0.6} height={18} fill={color} />}
            {b.roof === 'dome' && <path d={`M${b.x + 6} ${top} Q${b.x + b.w / 2} ${top - 34} ${b.x + b.w - 6} ${top}Z`} fill={color} />}
            {Array.from({ length: rows * cols }, (_, k) => {
              const cx = k % cols
              const cy = Math.floor(k / cols)
              const lit = rand(seed + i * 131 + k) < litRatio
              if (!lit) return null
              const flicker = !reduce && rand(seed + k * 17 + i) < 0.06
              return (
                <motion.rect
                  key={k}
                  x={b.x + 6 + cx * ((b.w - 12) / cols)}
                  y={top + 10 + cy * 22}
                  width={6}
                  height={9}
                  fill={windowColor}
                  animate={flicker ? { opacity: [1, 0.15, 1, 0.6, 1] } : undefined}
                  transition={flicker ? { duration: 3 + rand(k) * 4, repeat: Infinity, delay: rand(i + k) * 5 } : undefined}
                />
              )
            })}
            {neon && i % 4 === 1 && (
              <motion.rect
                x={b.x + b.w * 0.15}
                y={top + 24}
                width={b.w * 0.7}
                height={10}
                rx={5}
                fill={i % 8 === 1 ? '#f472b6' : '#22d3ee'}
                style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}
                animate={reduce ? undefined : { opacity: [1, 0.4, 1, 1, 0.2, 1] }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 0.3 }}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}

function Searchlight({ color }: { color: string }) {
  const reduce = useReducedMotion()
  return (
    <div className="absolute bottom-[34%] left-[18%] h-[70vh] w-0">
      <motion.div
        className="absolute bottom-0 left-0 h-full w-[38vh] origin-bottom-left"
        style={{ background: `linear-gradient(to top, ${color}, transparent 85%)`, clipPath: 'polygon(0 100%, 3% 100%, 100% 0, 60% 0)', opacity: 0.35 }}
        animate={reduce ? undefined : { rotate: [-18, 6, -18] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* emblem projected on the cloud deck */}
      <motion.div
        className="absolute -top-6 left-[12vh] size-28 rounded-full md:size-36"
        style={{ background: `radial-gradient(circle, ${color} 0%, ${color}cc 45%, transparent 70%)` }}
        animate={reduce ? undefined : { x: [-60, 70, -60], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      >
        <SentinelEmblem className="absolute inset-[18%] opacity-90" />
      </motion.div>
    </div>
  )
}

const DROPS = { size: '90px 90px', image: 'linear-gradient(100deg, transparent 47%, rgb(200 215 235 / 0.8) 49%, transparent 51%)' }

export function SentinelCity() {
  const mood = useThemeStore((s) => s.theme)
  const reduce = useReducedMotion()
  const [flash, setFlash] = useState(0)

  useEffect(() => {
    if (mood !== 'downpour' || reduce) return
    let id = 0
    const schedule = () => {
      id = window.setTimeout(() => {
        setFlash((f) => f + 1)
        schedule()
      }, 4000 + Math.random() * 6000)
    }
    schedule()
    return () => window.clearTimeout(id)
  }, [mood, reduce])

  const dawn = mood === 'dawn'
  const sky =
    dawn
      ? 'linear-gradient(to bottom, #1e3a8a 0%, #6d28d9 28%, #db2777 52%, #f97316 72%, #fcd34d 92%)'
      : mood === 'neon'
      ? 'linear-gradient(to bottom, #12021f 0%, #3b0a6b 40%, #7e22ce 70%, #db2777 92%)'
      : mood === 'downpour'
        ? 'linear-gradient(to bottom, #0b0f19 0%, #1f2937 50%, #374151 85%)'
        : 'linear-gradient(to bottom, #050816 0%, #0f1a3d 45%, #23336b 85%, #3b4a7a 100%)'

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ background: sky }}>
      {/* rising sun (dawn) */}
      {dawn && (
        <>
          <motion.div
            className="absolute bottom-[34%] left-1/2 size-56 -translate-x-1/2 rounded-full md:size-80"
            style={{ background: 'radial-gradient(circle at 50% 45%, #fffbeb, #fde68a 45%, #f97316 80%)', boxShadow: '0 0 140px 70px rgb(251 146 60 / 0.55)' }}
            initial={{ y: 60 }}
            animate={reduce ? { y: 0 } : { y: [40, 0, 40] }}
            transition={{ duration: 40, repeat: Infinity, ease: 'easeInOut' }}
          />
          {!reduce &&
            Array.from({ length: 12 }, (_, i) => (
              <motion.span
                key={i}
                className="absolute bottom-[40%] left-1/2 h-[60vh] w-1 origin-bottom rounded-full bg-gradient-to-t from-amber-200/40 to-transparent"
                style={{ rotate: -70 + i * 12.7 }}
                animate={{ opacity: [0.15, 0.5, 0.15] }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 0.25 }}
              />
            ))}
        </>
      )}

      {/* moon */}
      {mood !== 'downpour' && !dawn && (
        <motion.div
          className="absolute right-[10%] top-[8%] size-28 rounded-full md:size-40"
          style={{ background: 'radial-gradient(circle at 35% 35%, #fffef2, #fde68a 60%, #d4b968)', boxShadow: `0 0 90px 30px ${mood === 'neon' ? 'rgb(244 114 182 / 0.45)' : 'rgb(254 243 199 / 0.45)'}` }}
          animate={reduce ? undefined : { scale: [1, 1.04, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      )}
      {/* low clouds */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute h-24 w-[60vw] rounded-full blur-2xl"
          style={{ top: `${6 + i * 9}%`, background: mood === 'neon' ? 'rgb(190 24 93 / 0.25)' : 'rgb(148 163 184 / 0.22)' }}
          initial={{ x: '-60vw' }}
          animate={reduce ? undefined : { x: '110vw' }}
          transition={{ duration: 70 + i * 20, repeat: Infinity, ease: 'linear', delay: -i * 25 }}
        />
      ))}

      <Searchlight color={mood === 'neon' ? '#fde68a' : '#fef3c7'} />


      <div className="absolute inset-x-0 bottom-0 h-[62vh]">
        <Row buildings={FAR} color={dawn ? '#4c1d95' : mood === 'neon' ? '#2e1065' : '#1e293b'} windowColor={mood === 'neon' ? '#f0abfc' : '#fde68a'} litRatio={dawn ? 0.03 : 0.12} seed={3} />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[48vh]">
        <Row buildings={MID} color={dawn ? '#2e1065' : mood === 'neon' ? '#1e0b3a' : '#111827'} windowColor="#fcd34d" litRatio={dawn ? 0.06 : 0.2} seed={7} neon={mood === 'neon'} />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[30vh]">
        <Row buildings={NEAR} color={dawn ? '#1a0b2e' : '#05060b'} windowColor="#fbbf24" litRatio={dawn ? 0.1 : 0.28} seed={11} neon={mood === 'neon'} />
      </div>

      {/* rooftop foreground with water tower + antenna */}
      <svg viewBox="0 0 400 160" preserveAspectRatio="xMaxYMax meet" className="absolute bottom-0 right-0 h-[26vh] w-auto">
        <rect x={0} y={120} width={400} height={40} fill="#020205" />
        <g fill="#020205">
          <rect x={250} y={40} width={70} height={60} rx={6} />
          <path d="M244 40 L285 14 L326 40Z" />
          <path d="M258 100 L252 122 M312 100 L318 122 M285 100 L285 122" stroke="#020205" strokeWidth={5} />
          <rect x={120} y={20} width={4} height={100} />
          <path d="M110 40 L134 40 M114 60 L130 60" stroke="#020205" strokeWidth={3} />
        </g>
        <motion.circle cx={122} cy={18} r={4} fill="#ef4444" animate={reduce ? undefined : { opacity: [1, 0.1, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
      </svg>

      {/* weather */}
      {(mood === 'downpour' || mood === 'neon') && !reduce && (
        <>
          {[
            { o: mood === 'downpour' ? 0.5 : 0.25, d: 2.4 },
            { o: mood === 'downpour' ? 0.35 : 0.18, d: 3.6 },
          ].map((l, i) => (
            <motion.div
              key={i}
              className="absolute inset-x-[-20%] -top-full h-[200%]"
              style={{ opacity: l.o, backgroundSize: DROPS.size, backgroundImage: DROPS.image, rotate: 10 }}
              animate={{ y: ['0%', '50%'] }}
              transition={{ duration: l.d, repeat: Infinity, ease: 'linear' }}
            />
          ))}
        </>
      )}
      {mood === 'downpour' && (
        <motion.div
          className="absolute inset-x-[-30%] bottom-[18%] h-40 blur-2xl"
          style={{ background: 'linear-gradient(90deg, transparent, rgb(203 213 225 / 0.25), transparent)' }}
          animate={reduce ? undefined : { x: ['-10%', '10%', '-10%'] }}
          transition={{ duration: 18, repeat: Infinity }}
        />
      )}
      {mood === 'neon' && <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-fuchsia-600/25 to-transparent" />}
      <AnimatePresence>
        {flash > 0 && <motion.div key={flash} className="absolute inset-0 bg-white" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0, 0.35, 0] }} transition={{ duration: 0.7 }} />}
      </AnimatePresence>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgb(0_0_0/0.55))]" />
    </div>
  )
}
