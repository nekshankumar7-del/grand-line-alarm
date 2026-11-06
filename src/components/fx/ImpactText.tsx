import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useReducedMotion } from 'motion/react'
import { useRef } from 'react'
import { cn } from '@/lib/cn'
import { impactTimeline } from '@/motion/timelines/impact'

gsap.registerPlugin(useGSAP)

interface ImpactTextProps {
  text: string
  className?: string
  repeatDelay?: number
}

export function ImpactText({ text, className, repeatDelay = 1.5 }: ImpactTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduceMotion = useReducedMotion()

  useGSAP(
    () => {
      if (!ref.current || reduceMotion) return
      impactTimeline(ref.current, repeatDelay)
    },
    { scope: ref, dependencies: [text, repeatDelay, reduceMotion] },
  )

  return (
    <span
      ref={ref}
      aria-hidden
      className={cn('inline-block font-display tracking-wider text-gold text-outline manga-shadow', className)}
    >
      {text}
    </span>
  )
}
