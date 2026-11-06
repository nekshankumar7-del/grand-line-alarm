import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
import { pad } from '../format'

const ITEM = 48
const VISIBLE = 5

interface WheelProps<T extends string | number> {
  label: string
  values: T[]
  value: T
  format?(v: T): string
  onChange(v: T): void
  className?: string
}

/** One snap-scrolling wheel column (touch flick, mouse wheel, or arrow keys). */
function Wheel<T extends string | number>({ label, values, value, format = String, onChange, className }: WheelProps<T>) {
  const ref = useRef<HTMLDivElement>(null)
  const settle = useRef<number | null>(null)
  const index = Math.max(0, values.indexOf(value))

  // Keep the wheel aligned when the value changes from outside.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const target = index * ITEM
    if (Math.abs(el.scrollTop - target) > 2) el.scrollTo({ top: target, behavior: 'smooth' })
  }, [index])

  function onScroll() {
    if (settle.current !== null) window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => {
      const el = ref.current
      if (!el) return
      const i = Math.min(values.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM)))
      if (values[i] !== value) {
        onChange(values[i])
        navigator.vibrate?.(8)
      }
    }, 90)
  }

  const step = (d: number) => onChange(values[Math.min(values.length - 1, Math.max(0, index + d))])

  return (
    <div
      ref={ref}
      role="spinbutton"
      aria-label={label}
      aria-valuetext={format(value)}
      tabIndex={0}
      onScroll={onScroll}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          step(-1)
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          step(1)
        }
      }}
      className={cn(
        'relative snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        'touch-pan-y focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
        className,
      )}
      style={{ height: ITEM * VISIBLE, paddingTop: ITEM * 2, paddingBottom: ITEM * 2 }}
    >
      {values.map((v, i) => {
        const dist = Math.abs(i - index)
        return (
          <button
            key={String(v)}
            type="button"
            tabIndex={-1}
            onClick={() => onChange(v)}
            className={cn(
              'block w-full snap-center text-center font-display tabular-nums transition-all duration-150',
              dist === 0 ? 'text-5xl text-white' : dist === 1 ? 'text-3xl text-white/45' : 'text-2xl text-white/20',
            )}
            style={{ height: ITEM, lineHeight: `${ITEM}px` }}
          >
            {format(v)}
          </button>
        )
      })}
    </div>
  )
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)
const PERIODS = ['AM', 'PM'] as const

interface WheelTimePickerProps {
  hour: number
  minute: number
  onChange(hour: number, minute: number): void
}

/** Mobile-first time picker: hour / minute / AM-PM wheels with a highlighted centre band. */
export function WheelTimePicker({ hour, minute, onChange }: WheelTimePickerProps) {
  const period: (typeof PERIODS)[number] = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  const to24 = (h12: number, p: string) => (h12 % 12) + (p === 'PM' ? 12 : 0)

  return (
    <div className="relative mx-auto w-full max-w-sm select-none">
      {/* selection band */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-12 -translate-y-1/2 rounded-2xl border border-amber-400/50 bg-amber-400/10 shadow-[0_0_24px_rgba(245,158,11,0.25)]" />
      {/* fade top/bottom */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-[#0b1026] to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-[#0b1026] to-transparent" />
      <div className="relative grid grid-cols-[1fr_auto_1fr_0.8fr] items-center">
        <Wheel label="Hour" values={HOURS} value={hour12} format={(v) => String(v)} onChange={(h) => onChange(to24(h, period), minute)} />
        <span className="font-display text-5xl text-amber-400">:</span>
        <Wheel label="Minute" values={MINUTES} value={minute} format={(v) => pad(v)} onChange={(m) => onChange(hour, m)} />
        <Wheel label="AM or PM" values={[...PERIODS]} value={period} onChange={(p) => onChange(to24(hour12, p), minute)} className="[&>button]:!text-2xl" />
      </div>
    </div>
  )
}
