import { motion, useMotionValue, useSpring, useTransform, type Variants } from 'motion/react'
import type { PointerEvent, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface TiltCardProps {
  children: ReactNode
  className?: string
  maxTilt?: number
  variants?: Variants
}

const springConfig = { stiffness: 200, damping: 18 }

export function TiltCard({ children, className, maxTilt = 10, variants }: TiltCardProps) {
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(py, [0, 1], [maxTilt, -maxTilt]), springConfig)
  const rotateY = useSpring(useTransform(px, [0, 1], [-maxTilt, maxTilt]), springConfig)

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    px.set((event.clientX - rect.left) / rect.width)
    py.set((event.clientY - rect.top) / rect.height)
  }

  function reset() {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <motion.div
      variants={variants}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={cn('rounded-3xl border-[3px] border-ink hard-shadow', className)}
    >
      {children}
    </motion.div>
  )
}
