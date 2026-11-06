import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'
import { LITE } from '@/lib/perf'

const BLOBS = [
  { color: 'var(--c-sky-deep)', size: '60vmax', x: ['-20%', '10%', '-20%'], y: ['-20%', '5%', '-20%'], d: 18 },
  { color: 'var(--c-accent)', size: '45vmax', x: ['60%', '35%', '60%'], y: ['50%', '20%', '50%'], d: 22 },
  { color: 'var(--c-gold)', size: '35vmax', x: ['10%', '45%', '10%'], y: ['70%', '55%', '70%'], d: 26 },
]

const BUBBLES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  size: 6 + ((i * 13) % 18),
  delay: (i * 0.9) % 8,
  duration: 9 + ((i * 7) % 8),
}))

/** Soft animated gradient-mesh background with rising bubbles (transform/opacity only). */
export function AuroraBackdrop({ className, intensity = 0.55, still = false }: { className?: string; intensity?: number; /** freeze motion (e.g. while the camera runs) */ still?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <div aria-hidden className={cn('pointer-events-none fixed inset-0 -z-0 overflow-hidden bg-sea-deep', className)}>
      {BLOBS.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: b.size, height: b.size, background: `radial-gradient(closest-side, ${b.color}, transparent)`, opacity: intensity }}
          initial={{ x: b.x[0], y: b.y[0] }}
          animate={reduce || still || LITE ? undefined : { x: b.x, y: b.y, scale: [1, 1.15, 1] }}
          transition={{ duration: b.d, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.08)_1px,transparent_1px)] [background-size:22px_22px]" />
      {!reduce && !still && !LITE &&
        BUBBLES.map((b, i) => (
          <motion.span
            key={i}
            className="absolute bottom-[-40px] rounded-full border border-white/40 bg-white/10"
            style={{ left: b.left, width: b.size, height: b.size }}
            animate={{ y: [0, -1200], x: [0, 20, -20, 0], opacity: [0, 0.8, 0] }}
            transition={{ duration: b.duration, delay: b.delay, repeat: Infinity, ease: 'linear' }}
          />
        ))}
    </div>
  )
}
