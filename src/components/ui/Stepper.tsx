import { motion } from 'motion/react'
import { pressable } from '@/motion/variants'

interface StepperProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  format?(v: number): string
  onChange(v: number): void
}

export function Stepper({ label, value, min, max, step = 1, format = String, onChange }: StepperProps) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)))
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-bold">{label}</span>
      <div className="flex items-center gap-2">
        <motion.button
          type="button"
          {...pressable}
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => set(value - step)}
          className="grid size-9 place-items-center rounded-xl border-[3px] border-ink bg-white font-display text-xl disabled:opacity-40"
        >
          −
        </motion.button>
        <motion.span
          key={value}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="min-w-14 text-center font-display text-2xl tabular-nums"
          aria-live="polite"
        >
          {format(value)}
        </motion.span>
        <motion.button
          type="button"
          {...pressable}
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => set(value + step)}
          className="grid size-9 place-items-center rounded-xl border-[3px] border-ink bg-white font-display text-xl disabled:opacity-40"
        >
          +
        </motion.button>
      </div>
    </div>
  )
}
