import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { spring } from '@/motion/tokens'
import { DAY_LETTERS, DAY_NAMES, describeDays } from '../format'

const PRESETS: Array<{ label: string; days: number[] }> = [
  { label: 'Once', days: [] },
  { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { label: 'Every day', days: [0, 1, 2, 3, 4, 5, 6] },
]

export function DayPicker({ days, onChange }: { days: number[]; onChange(days: number[]): void }) {
  const toggle = (d: number) => onChange(days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort())
  return (
    <div className="space-y-3">
      <div className="flex justify-between gap-1">
        {DAY_LETTERS.map((letter, d) => {
          const on = days.includes(d)
          return (
            <motion.button
              key={d}
              type="button"
              aria-pressed={on}
              aria-label={DAY_NAMES[d]}
              onClick={() => toggle(d)}
              whileTap={{ scale: 0.85 }}
              animate={{ scale: on ? 1.08 : 1, rotate: on ? -6 : 0 }}
              transition={spring.bouncy}
              className={cn(
                'grid size-11 place-items-center rounded-full border-[3px] border-ink font-display text-xl',
                on ? 'bg-gold text-ink hard-shadow' : 'bg-white/10 text-white',
              )}
            >
              {letter}
            </motion.button>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" onClick={() => onChange(p.days)} className="rounded-full border-2 border-white/40 px-3 py-1 font-bold">
            {p.label}
          </button>
        ))}
        <span className="ml-auto text-white/70">{describeDays(days)}</span>
      </div>
    </div>
  )
}
