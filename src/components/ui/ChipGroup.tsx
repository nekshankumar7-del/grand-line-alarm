import { motion } from 'motion/react'
import { useId } from 'react'
import { cn } from '@/lib/cn'
import { spring } from '@/motion/tokens'

interface ChipGroupProps<T extends string> {
  label: string
  options: Array<{ value: T; label: string }>
  value: T
  onChange(v: T): void
}

export function ChipGroup<T extends string>({ label, options, value, onChange }: ChipGroupProps<T>) {
  const id = useId()
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="mr-auto font-bold">{label}</span>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn('relative rounded-full border-[3px] border-ink px-3 py-1 font-bold', selected ? 'text-white' : 'bg-white')}
          >
            {selected && (
              <motion.span layoutId={`chip-${id}`} transition={spring.snappy} className="absolute inset-0 rounded-full bg-accent" />
            )}
            <span className="relative">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
