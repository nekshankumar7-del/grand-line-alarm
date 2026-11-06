import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type WheelEvent } from 'react'
import { spring } from '@/motion/tokens'
import { pressable } from '@/motion/variants'
import { pad } from '../format'

const NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']

/** Clocktower face behind the digits; its hands follow the chosen time. */
function ClockTowerDial({ hour, minute }: { hour: number; minute: number }) {
  const hourAngle = (hour % 12) * 30 + minute * 0.5
  const minuteAngle = minute * 6
  return (
    <svg aria-hidden viewBox="0 0 200 200" className="absolute inset-0 m-auto h-full w-full opacity-35">
      <circle cx={100} cy={100} r={96} fill="none" stroke="#f59e0b" strokeWidth={2} />
      <circle cx={100} cy={100} r={88} fill="none" stroke="#f59e0b" strokeWidth={0.8} strokeDasharray="1 4" />
      {NUMERALS.map((n, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2
        return (
          <text key={n} x={100 + Math.cos(a) * 76} y={100 + Math.sin(a) * 76 + 4} textAnchor="middle" fontSize={11} fill="#fde68a" fontFamily="Georgia, serif">
            {n}
          </text>
        )
      })}
      <motion.line x1={100} y1={100} x2={100} y2={52} stroke="#fde68a" strokeWidth={5} strokeLinecap="round" style={{ originX: '100px', originY: '100px' }} animate={{ rotate: hourAngle }} transition={spring.gentle} />
      <motion.line x1={100} y1={100} x2={100} y2={30} stroke="#f59e0b" strokeWidth={3} strokeLinecap="round" style={{ originX: '100px', originY: '100px' }} animate={{ rotate: minuteAngle }} transition={spring.gentle} />
      <circle cx={100} cy={100} r={6} fill="#f59e0b" />
    </svg>
  )
}

function useHoldRepeat(action: () => void) {
  const timer = useRef<number | null>(null)
  const latest = useRef(action)
  latest.current = action
  const stop = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(() => stop, [])
  const start = () => {
    latest.current()
    const repeat = (delay: number) => {
      timer.current = window.setTimeout(() => {
        latest.current()
        repeat(Math.max(50, delay * 0.8))
      }, delay)
    }
    repeat(400)
  }
  return { onPointerDown: start, onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop }
}

function Column({ value, max, label, onChange }: { value: number; max: number; label: string; onChange(v: number): void }) {
  const [dir, setDir] = useState(1)
  const step = (d: number) => {
    setDir(d)
    onChange((value + d + max) % max)
  }
  const up = useHoldRepeat(() => step(1))
  const down = useHoldRepeat(() => step(-1))
  const onWheel = (e: WheelEvent) => step(e.deltaY < 0 ? 1 : -1)

  return (
    <div className="flex flex-col items-center" onWheel={onWheel}>
      <motion.button type="button" {...pressable} {...up} aria-label={`${label} up`} className="px-4 text-3xl text-gold">
        ▲
      </motion.button>
      <div className="relative h-24 w-24 overflow-hidden" role="spinbutton" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max - 1}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') step(1)
          if (e.key === 'ArrowDown') step(-1)
        }}
      >
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.span
            key={value}
            custom={dir}
            variants={{
              enter: (d: number) => ({ y: d > 0 ? 50 : -50, opacity: 0 }),
              center: { y: 0, opacity: 1 },
              exit: (d: number) => ({ y: d > 0 ? -50 : 50, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={spring.snappy}
            className="absolute inset-0 grid place-items-center font-display text-7xl tabular-nums text-outline manga-shadow"
          >
            {pad(value)}
          </motion.span>
        </AnimatePresence>
      </div>
      <motion.button type="button" {...pressable} {...down} aria-label={`${label} down`} className="px-4 text-3xl text-gold">
        ▼
      </motion.button>
    </div>
  )
}

interface TimeDialProps {
  hour: number
  minute: number
  onChange(hour: number, minute: number): void
}

export function TimeDial({ hour, minute, onChange }: TimeDialProps) {
  return (
    <div className="relative mx-auto grid w-full max-w-xs place-items-center py-4">
      <ClockTowerDial hour={hour} minute={minute} />
      <div className="relative flex items-center gap-1">
        <Column value={hour} max={24} label="Hour" onChange={(h) => onChange(h, minute)} />
        <span className="font-display text-6xl text-gold">:</span>
        <Column value={minute} max={60} label="Minute" onChange={(m) => onChange(hour, m)} />
      </div>
      <label className="relative mt-2 flex items-center gap-2 text-sm text-white/80">
        or type it:
        <input
          type="time"
          value={`${pad(hour)}:${pad(minute)}`}
          onChange={(e) => {
            const [h, m] = e.target.value.split(':').map(Number)
            if (!Number.isNaN(h) && !Number.isNaN(m)) onChange(h, m)
          }}
          className="rounded-lg border-2 border-ink bg-white px-2 py-0.5 text-ink"
        />
      </label>
    </div>
  )
}
