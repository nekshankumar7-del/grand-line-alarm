import { AnimatePresence, motion } from 'motion/react'
import { SentinelEmblem } from '@/editions/sentinel/SentinelEmblem'
import { ease } from '@/motion/tokens'

/** Route-change transition: a dark shutter crosses the screen with a searchlight beam and the emblem. */
export function WaveWipe({ routeKey }: { routeKey: string }) {
  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={routeKey}
        aria-hidden
        className="pointer-events-none fixed inset-y-0 -left-[30vw] z-[60] w-[160vw]"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        exit={{ opacity: 0, transition: { duration: 0 } }}
        transition={{ duration: 0.85, ease: ease.inOut }}
      >
        <div className="absolute inset-0 skew-x-[-12deg] bg-gradient-to-r from-transparent via-[#020617] to-transparent" />
        <div className="absolute inset-y-0 left-1/2 w-40 -translate-x-1/2 skew-x-[-12deg] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent blur-md" />
        <SentinelEmblem color="#f59e0b" className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]" />
      </motion.div>
    </AnimatePresence>
  )
}
