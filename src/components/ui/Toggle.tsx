import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { spring } from '@/motion/tokens'

interface ToggleProps {
  checked: boolean
  label: string
  onChange(checked: boolean): void
}

export function Toggle({ checked, label, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      onPointerDownCapture={(e) => e.stopPropagation()}
      className={cn(
        'flex h-9 w-16 shrink-0 items-center rounded-full border-[3px] border-ink p-1 transition-colors',
        checked ? 'justify-end bg-accent' : 'justify-start bg-ink/30',
      )}
    >
      <motion.span layout transition={spring.bouncy} className="size-6 rounded-full border-2 border-ink bg-gold" />
    </button>
  )
}
