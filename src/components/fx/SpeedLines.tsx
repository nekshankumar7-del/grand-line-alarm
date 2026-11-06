import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

const COUNT = 56

const LINES = Array.from({ length: COUNT }, (_, i) => {
  const angle = (i / COUNT) * Math.PI * 2
  const inner = 30 + ((i * 37) % 14)
  return {
    x1: 50 + Math.cos(angle) * inner,
    y1: 50 + Math.sin(angle) * inner,
    x2: 50 + Math.cos(angle) * 90,
    y2: 50 + Math.sin(angle) * 90,
    width: 0.3 + ((i * 13) % 10) / 12,
  }
})

interface SpeedLinesProps {
  className?: string
  speed?: number
}

export function SpeedLines({ className, speed = 60 }: SpeedLinesProps) {
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      animate={{ rotate: 360, opacity: [0.6, 1, 0.6] }}
      transition={{
        rotate: { duration: speed, repeat: Infinity, ease: 'linear' },
        opacity: { duration: 0.4, repeat: Infinity },
      }}
    >
      {LINES.map((line, i) => (
        <line key={i} {...line} stroke="currentColor" strokeWidth={line.width} strokeLinecap="round" />
      ))}
    </motion.svg>
  )
}
