import { motion } from 'motion/react'
import type { ReactNode, RefObject } from 'react'
import { cn } from '@/lib/cn'
import { spring } from '@/motion/tokens'

export type CircleTone = 'idle' | 'good' | 'bad'

const TONE: Record<CircleTone, string> = { idle: 'rgb(255 255 255 / 0.5)', good: 'var(--c-gold)', bad: 'var(--c-accent)' }

interface FaceCircleProps {
  videoRef: RefObject<HTMLVideoElement | null>
  progress: number
  tone: CircleTone
  children?: ReactNode
  className?: string
}

/** Round mirrored camera view wrapped in an animated progress ring — modern face-ID style. */
export function FaceCircle({ videoRef, progress, tone, children, className }: FaceCircleProps) {
  const r = 47
  const c = 2 * Math.PI * r
  return (
    <motion.div
      className={cn('relative aspect-square w-full max-w-[19rem]', className)}
      animate={tone === 'bad' ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        aria-hidden
        className="absolute -inset-3 rounded-full"
        style={{ background: `conic-gradient(from 0deg, transparent, ${TONE[tone]}, transparent 60%)` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute inset-0 overflow-hidden rounded-full border-4 border-ink bg-ink">
        <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
        <motion.div
          aria-hidden
          className="absolute inset-x-0 h-1/4 bg-gradient-to-b from-transparent via-white/25 to-transparent"
          animate={{ top: ['-25%', '100%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
        {children}
      </div>
      <svg viewBox="0 0 100 100" className="absolute -inset-1.5 h-[calc(100%+0.75rem)] w-[calc(100%+0.75rem)] -rotate-90" aria-hidden>
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgb(255 255 255 / 0.15)" strokeWidth={3} />
        <motion.circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={TONE[tone === 'idle' ? 'good' : tone]}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, progress)) }}
          transition={spring.gentle}
        />
      </svg>
    </motion.div>
  )
}
