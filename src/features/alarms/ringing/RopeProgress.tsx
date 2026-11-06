import { useEdition } from '@/editions/useEdition'
import { motion } from 'motion/react'
import { spring } from '@/motion/tokens'

/** Mission progress line across the city with a searchlight marker. */
export function RopeProgress({ value, steps }: { value: number; steps: number }) {
  const sentinel = useEdition().id === 'sentinel'
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div role="progressbar" aria-label="Trial progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="relative w-full px-6 pt-6">
      <div className="relative h-3 rounded-full border-2 border-ink bg-[repeating-linear-gradient(45deg,var(--c-sand)_0_6px,var(--c-wood)_6px_12px)]">
        <motion.div className="absolute inset-y-0 left-0 rounded-full bg-gold/80" animate={{ width: `${pct}%` }} transition={spring.gentle} />
        {Array.from({ length: Math.max(0, steps - 1) }, (_, i) => (
          <span key={i} className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-white" style={{ left: `${((i + 1) / steps) * 100}%` }} />
        ))}
        <motion.span
          aria-hidden
          className="absolute -top-7 -translate-x-1/2 text-2xl"
          animate={{ left: `${pct}%`, rotate: [-6, 6, -6] }}
          transition={{ left: spring.gentle, rotate: { duration: 1.6, repeat: Infinity } }}
        >
          {sentinel ? '🔦' : '⛵'}
        </motion.span>
      </div>
      <span aria-hidden className="absolute -left-1 top-4 text-xl">{sentinel ? '🏙️' : '🏝️'}</span>
      <span aria-hidden className="absolute -right-1 top-4 text-xl">{sentinel ? '🌅' : '🏆'}</span>
    </div>
  )
}
