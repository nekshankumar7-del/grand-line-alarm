import { animate, motion, useDragControls, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { SentinelHero, type HeroMood } from './SentinelHero'

interface HangingSentinelProps {
  /** Storage key so each screen remembers where you hung the Sentinel. */
  id: string
  /** Default anchor position along the top edge (0 = left, 1 = right). */
  defaultX?: number
  /** Visibility classes (e.g. "hidden md:block"). */
  className?: string
  /** Resting rope length in px. */
  rope?: number
  /** Hero width in px (height follows the 200×320 artwork). */
  size?: number
  mood?: HeroMood
}

const EDGE = 28

function readSaved(key: string): number | null {
  try {
    const v = Number(localStorage.getItem(key))
    return Number.isFinite(v) && v > 0 && v < 1 ? v : null
  } catch {
    return null
  }
}

/**
 * The Sentinel hanging from a clamp on a rail along the top of the screen.
 *  • Drag the clamp to move the hanging point anywhere along the top (position is remembered).
 *  • Grab the hero and pull: the rope stretches, the hero tilts along it, and springs back on release.
 */
export function HangingSentinel({ id, defaultX = 0.85, className, rope = 220, size = 130, mood = 'idle' }: HangingSentinelProps) {
  const reduce = useReducedMotion()
  const storageKey = `ns-hanger-${id}`
  const anchorX = useMotionValue(0)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const [dragging, setDragging] = useState(false)
  const [moving, setMoving] = useState(false)
  const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 1024 : window.innerWidth))
  const anchorControls = useDragControls()
  const heroControls = useDragControls()
  const [coarse] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches)

  // Place the anchor from the saved fraction (or the default) and keep it valid on resize.
  useEffect(() => {
    const place = () => {
      const w = window.innerWidth
      setWidth(w)
      const fraction = readSaved(storageKey) ?? defaultX
      anchorX.set(Math.min(w - EDGE, Math.max(EDGE, fraction * w)))
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [storageKey, defaultX, anchorX])

  const ropeEndY = useTransform(y, (v) => rope + v)
  const tilt = useTransform([x, y], ([vx, vy]: number[]) => (-Math.atan2(vx, Math.max(20, rope + vy)) * 180) / Math.PI)
  const stretch = useTransform([x, y], ([vx, vy]: number[]) => Math.hypot(vx, rope + vy) / rope)
  const ropeWidth = useTransform(stretch, (s) => Math.max(1.2, 3.2 / Math.max(1, s)))

  // Gentle idle sway when nobody is holding anything.
  useEffect(() => {
    if (dragging || moving || reduce) return
    const controls = animate(x, [0, 14, -14, 0], { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.2 })
    return () => controls.stop()
  }, [dragging, moving, reduce, x])

  const springBack = () => {
    const spring = { type: 'spring' as const, stiffness: 180, damping: 5, mass: 0.9 }
    animate(x, 0, spring)
    animate(y, 0, spring)
  }

  const height = (size * 320) / 200

  return (
    <div className={cn('pointer-events-none fixed inset-x-0 top-0 z-20 h-0', className)}>
      {/* rail along the top edge (visible while repositioning) */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent"
        animate={{ opacity: moving ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />

      <motion.div
        className="absolute left-0 top-0"
        style={{ x: anchorX }}
        drag="x"
        dragListener={false}
        dragControls={anchorControls}
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{ left: EDGE, right: width - EDGE }}
        onDragStart={() => {
          x.stop()
          setMoving(true)
        }}
        onDrag={(_, info) => {
          // The hero lags behind the moving clamp like a real pendulum.
          x.set(Math.max(-rope, Math.min(rope, x.get() - info.delta.x * 0.9)))
        }}
        onDragEnd={() => {
          setMoving(false)
          springBack()
          try {
            localStorage.setItem(storageKey, String(anchorX.get() / window.innerWidth))
          } catch {
            /* ignore */
          }
        }}
      >
        {/* rope */}
        <svg className="absolute left-0 top-0 overflow-visible" width={1} height={1} aria-hidden>
          <motion.line x1={0} y1={8} x2={x} y2={ropeEndY} stroke="#cbd5e1" strokeLinecap="round" style={{ strokeWidth: ropeWidth }} />
        </svg>

        {/* clamp handle: drag to move the hanging point along the top */}
        <motion.button
          type="button"
          aria-label="Move the hanging point — drag left or right along the top"
          title="Drag to move along the top"
          onPointerDown={(e) => anchorControls.start(e)}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 80 : 24
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
            e.preventDefault()
            const next = Math.min(width - EDGE, Math.max(EDGE, anchorX.get() + (e.key === 'ArrowRight' ? step : -step)))
            animate(anchorX, next, { type: 'spring', stiffness: 300, damping: 30 })
            x.set(x.get() + (e.key === 'ArrowRight' ? -step : step) * 0.6)
            springBack()
            try {
              localStorage.setItem(storageKey, String(next / window.innerWidth))
            } catch {
              /* ignore */
            }
          }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          className="group pointer-events-auto absolute left-0 top-0 grid h-6 w-12 -translate-x-1/2 cursor-ew-resize touch-none place-items-center rounded-b-lg border border-t-0 border-amber-400/70 bg-[#0b0f19] shadow-[0_0_14px_rgba(245,158,11,0.45)]"
        >
          <span className="text-[11px] font-bold leading-none text-amber-400">⇔</span>
          <span className="pointer-events-none absolute top-7 whitespace-nowrap rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
            drag to move
          </span>
        </motion.button>

        {/* the hero: grab, pull (rope stretches), release (bounces back) */}
        <motion.div
          role="img"
          aria-label="The Sentinel hanging on a rope — drag to pull it, release to let it bounce back"
          className={cn('absolute left-0 select-none', coarse ? 'pointer-events-none' : 'pointer-events-auto cursor-grab touch-none active:cursor-grabbing')}
          style={{ x, y, rotate: tilt, top: rope, width: size, height, marginLeft: -size / 2, originX: 0.5, originY: 0 }}
          drag
          dragListener={!coarse}
          dragControls={heroControls}
          dragMomentum={false}
          dragElastic={0.9}
          onDragStart={() => {
            x.stop()
            setDragging(true)
          }}
          onDragEnd={() => {
            setDragging(false)
            springBack()
          }}
          whileTap={coarse ? undefined : { scale: 1.04 }}
        >
          {coarse && (
            <button
              type="button"
              aria-label="Grab the Sentinel's rope — drag to pull, release to bounce back"
              onPointerDown={(e) => heroControls.start(e)}
              className="pointer-events-auto absolute left-1/2 top-[-6%] z-10 grid size-9 -translate-x-1/2 touch-none place-items-center rounded-full border-2 border-amber-300 bg-black/70 text-xs shadow-[0_0_14px_rgba(245,158,11,0.7)]"
            >
              <span aria-hidden>✊</span>
            </button>
          )}
          <div className="-mt-[13%] h-full w-full">
            <SentinelHero mood={dragging || moving ? 'angry' : mood} className="h-full w-full drop-shadow-[0_14px_24px_rgba(0,0,0,0.6)]" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
