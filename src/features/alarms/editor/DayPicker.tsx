import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { spring } from '@/motion/tokens'
import { DAY_LETTERS, DAY_NAMES, describeDays } from '../format'

const PRESETS: Array<{ label: string; days: number[] }> = [
  { label: 'Once', days: [] },
  { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { label: 'Every day', days: [0, 1, 2, 3, 4, 5, 6] },
]

const same = (a: number[], b: number[]) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i])

/** Mobile-first repeat picker: 7 equal day buttons that always fit the width + preset segmented control. */
export function DayPicker({ days, onChange }: { days: number[]; onChange(days: number[]): void }) {
  const toggle = (d: number) => onChange(days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort())
  const activePreset = PRESETS.find((p) => same(p.days, days))?.label

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
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
              animate={{ scale: on ? 1.04 : 1 }}
              transition={spring.bouncy}
              className={cn(
                'grid aspect-square w-full place-items-center rounded-full border-2 font-display text-lg sm:text-xl',
                on ? 'border-amber-300 bg-amber-400 text-black shadow-[0_0_16px_rgba(245,158,11,0.45)]' : 'border-white/20 bg-white/5 text-white/80',
              )}
            >
              {letter}
            </motion.button>
          )
        })}
      </div>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/30 p-1" role="radiogroup" aria-label="Repeat preset">
        {PRESETS.map((p) => {
          const selected = activePreset === p.label
          return (
            <button
              key={p.label}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(p.days)}
              className={cn('relative rounded-lg py-2 text-sm font-bold', selected ? 'text-black' : 'text-white/80')}
            >
              {selected && <motion.span layoutId="repeat-preset" transition={spring.snappy} className="absolute inset-0 rounded-lg bg-amber-400" />}
              <span className="relative">{p.label}</span>
            </button>
          )
        })}
      </div>
      <p className="text-center text-sm text-white/70">Repeats: {describeDays(days)}</p>
    </div>
  )
}
