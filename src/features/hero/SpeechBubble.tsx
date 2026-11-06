import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { spring } from '@/motion/tokens'

interface SpeechBubbleProps {
  text: string
  className?: string
  tail?: 'left' | 'bottom'
}

export function SpeechBubble({ text, className, tail = 'left' }: SpeechBubbleProps) {
  return (
    <div className={cn('relative', className)} aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={text}
          initial={{ opacity: 0, scale: 0.6, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={spring.bouncy}
          className="relative rounded-2xl border-[3px] border-ink bg-white px-4 py-2 font-display text-xl leading-tight tracking-wide text-ink hard-shadow"
        >
          {text}
          <span
            aria-hidden
            className={cn(
              'absolute size-4 rotate-45 border-ink bg-white',
              tail === 'left' ? '-left-[10px] top-1/2 -translate-y-1/2 border-b-[3px] border-l-[3px]' : '-bottom-[10px] left-8 border-b-[3px] border-r-[3px]',
            )}
          />
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
