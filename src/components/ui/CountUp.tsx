import { animate, motion, useInView, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useRef } from 'react'
import { ease } from '@/motion/tokens'

interface CountUpProps {
  value: number
  duration?: number
  suffix?: string
  className?: string
}

export function CountUp({ value, duration = 1.6, suffix = '', className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const text = useTransform(count, (v) => `${Math.round(v).toLocaleString()}${suffix}`)

  useEffect(() => {
    if (!inView) return
    const controls = animate(count, value, { duration, ease: ease.out })
    return () => controls.stop()
  }, [inView, value, duration, count])

  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  )
}
