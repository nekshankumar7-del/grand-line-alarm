import type { Variants } from 'motion/react'
import { duration, ease, spring, stagger } from './tokens'

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: ease.out } },
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: spring.bouncy },
}

export function staggerContainer(gap: number = stagger.base, delay = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: gap, delayChildren: delay } },
  }
}

export const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, y: -16, transition: { duration: duration.fast, ease: ease.inOut } },
}

export const pressable = {
  whileHover: { y: -2 },
  whileTap: { scaleX: 1.08, scaleY: 0.88, y: 4 },
  transition: spring.snappy,
}
