import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { ChipGroup } from '@/components/ui/ChipGroup'
import { cn } from '@/lib/cn'
import { spring } from '@/motion/tokens'
import { defineMission, type MissionRunnerProps } from '../types'

interface VaultConfig {
  tumblers: '3' | '4'
}

const NUMBERS = 40
const HOLD_MS = 700

const circDist = (a: number, b: number) => {
  const d = Math.abs(a - b) % NUMBERS
  return Math.min(d, NUMBERS - d)
}

function makeCombo(n: number) {
  const combo: number[] = []
  while (combo.length < n) {
    const v = Math.floor(Math.random() * NUMBERS)
    if (!combo.some((c) => circDist(c, v) < 6)) combo.push(v)
  }
  return combo
}

function VaultRunner({ config, onProgress, onComplete }: MissionRunnerProps<VaultConfig>) {
  const count = Number(config.tumblers)
  const [combo] = useState(() => makeCombo(count))
  const [angle, setAngle] = useState(0) // degrees, unbounded
  const [step, setStep] = useState(0)
  const [lastDir, setLastDir] = useState<1 | -1 | 0>(0)
  const [hold, setHold] = useState(0)
  const drag = useRef<{ start: number; base: number } | null>(null)
  const dialRef = useRef<HTMLDivElement>(null)
  const lastNumber = useRef(0)

  const needDir: 1 | -1 = step % 2 === 0 ? 1 : -1 // right (clockwise), then left, …
  const number = (((Math.round(-angle / (360 / NUMBERS)) % NUMBERS) + NUMBERS) % NUMBERS)
  const target = combo[step]
  const dist = target === undefined ? NUMBERS : circDist(number, target)
  const heat = Math.max(0, 1 - dist / 12)
  const onTarget = dist === 0 && lastDir === needDir

  // haptic "click" on every number passed; stronger near the target
  useEffect(() => {
    if (number === lastNumber.current) return
    lastNumber.current = number
    navigator.vibrate?.(heat > 0.8 ? 25 : 6)
  }, [number, heat])

  // hold on the right number (approached from the right direction) to drop the tumbler
  useEffect(() => {
    if (!onTarget || step >= count) {
      setHold(0)
      return
    }
    const started = performance.now()
    const id = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - started) / HOLD_MS)
      setHold(p)
      if (p >= 1) {
        window.clearInterval(id)
        const next = step + 1
        navigator.vibrate?.([40, 30, 80])
        setStep(next)
        setLastDir(0)
        onProgress(next / count)
        if (next >= count) window.setTimeout(onComplete, 900)
      }
    }, 50)
    return () => window.clearInterval(id)
  }, [onTarget, step, count, onProgress, onComplete])

  function rotateBy(delta: number) {
    setAngle((a) => a + delta)
    setLastDir(delta < 0 ? 1 : -1) // dragging clockwise lowers the number index under the marker
  }

  const centerAngle = (e: PointerEvent) => {
    const r = dialRef.current!.getBoundingClientRect()
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI
  }

  function onDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { start: centerAngle(e), base: angle }
  }
  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    let delta = centerAngle(e) - drag.current.start
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    const next = drag.current.base + delta
    if (Math.abs(next - angle) > 0.5) {
      setLastDir(next > angle ? -1 : 1)
      setAngle(next)
    }
    drag.current = { start: centerAngle(e), base: next }
  }

  const heatColor = `hsl(${(1 - heat) * 210}, 90%, ${50 + heat * 10}%)`

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2" aria-label="Tumblers">
        {combo.map((_, i) => (
          <motion.span
            key={i}
            animate={i < step ? { scale: [1.6, 1], rotate: [0, -20, 0] } : { scale: 1 }}
            transition={spring.bouncy}
            className={cn('grid size-11 place-items-center rounded-xl border-[3px] border-ink font-display text-xl', i < step ? 'bg-gold text-ink' : i === step ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40')}
          >
            {i < step ? '🔓' : i === step ? (needDir === 1 ? '↻' : '↺') : '🔒'}
          </motion.span>
        ))}
      </div>

      <p className="text-center font-display text-2xl tracking-wide">
        {step >= count ? 'VAULT OPEN!' : <>Turn {needDir === 1 ? 'RIGHT ↻' : 'LEFT ↺'} · find number {step + 1}</>}
      </p>

      <div className="relative">
        {/* marker */}
        <span aria-hidden className="absolute left-1/2 top-[-14px] z-10 -translate-x-1/2 text-3xl text-accent drop-shadow">▼</span>
        <motion.div
          ref={dialRef}
          role="slider"
          aria-label="Safe dial"
          aria-valuemin={0}
          aria-valuemax={NUMBERS - 1}
          aria-valuenow={number}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') rotateBy(-360 / NUMBERS)
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') rotateBy(360 / NUMBERS)
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={() => (drag.current = null)}
          className="relative grid size-64 cursor-grab touch-none place-items-center rounded-full border-[6px] border-ink bg-[radial-gradient(circle_at_35%_30%,#6b7280,#1f2937_70%)] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8),inset_0_4px_10px_rgba(255,255,255,0.15)] active:cursor-grabbing"
          style={{ boxShadow: `0 0 ${20 + heat * 50}px ${heat * 12}px ${heatColor}` }}
        >
          <motion.svg viewBox="0 0 200 200" className="absolute inset-0" animate={{ rotate: angle }} transition={{ type: 'spring', stiffness: 400, damping: 40 }}>
            {Array.from({ length: NUMBERS }, (_, i) => {
              const a = (i / NUMBERS) * Math.PI * 2 - Math.PI / 2
              const major = i % 5 === 0
              return (
                <g key={i}>
                  <line x1={100 + Math.cos(a) * 92} y1={100 + Math.sin(a) * 92} x2={100 + Math.cos(a) * (major ? 80 : 86)} y2={100 + Math.sin(a) * (major ? 80 : 86)} stroke="#e5e7eb" strokeWidth={major ? 2.5 : 1.2} />
                  {major && (
                    <text x={100 + Math.cos(a) * 70} y={100 + Math.sin(a) * 70 + 4} textAnchor="middle" fontSize={11} fontWeight={800} fill="#f3f4f6" transform={`rotate(${(i / NUMBERS) * 360} ${100 + Math.cos(a) * 70} ${100 + Math.sin(a) * 70})`}>
                      {i}
                    </text>
                  )}
                </g>
              )
            })}
          </motion.svg>
          <div className="relative grid size-24 place-items-center rounded-full border-4 border-ink bg-[radial-gradient(circle_at_35%_30%,#d1d5db,#4b5563)]">
            <span className="font-display text-4xl tabular-nums text-ink">{number}</span>
          </div>
          {hold > 0 && (
            <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 -rotate-90">
              <circle cx={50} cy={50} r={48} fill="none" stroke="#ffc53d" strokeWidth={3} strokeDasharray={301} strokeDashoffset={301 * (1 - hold)} />
            </svg>
          )}
        </motion.div>
      </div>

      {/* heat meter */}
      <div className="w-full max-w-xs" aria-live="polite">
        <div className="flex justify-between text-xs font-bold text-white/70">
          <span>❄️ Cold</span>
          <span>🔥 Hot</span>
        </div>
        <div className="mt-1 h-3 overflow-hidden rounded-full bg-white/15">
          <motion.div className="h-full rounded-full" animate={{ width: `${heat * 100}%`, backgroundColor: heatColor }} transition={spring.snappy} />
        </div>
        <AnimatePresence mode="popLayout">
          <motion.p key={dist === 0 ? (lastDir === needDir ? 'hold' : 'dir') : heat > 0.6 ? 'warm' : 'cold'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-center text-sm font-bold">
            {dist === 0 ? (lastDir === needDir ? 'Click… hold steady!' : `Wrong way — approach it turning ${needDir === 1 ? 'right' : 'left'}`) : heat > 0.6 ? 'Getting hot…' : 'Keep turning…'}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => rotateBy(360 / NUMBERS)} className="glass rounded-full px-4 py-2 font-bold">
          ↺ Left
        </button>
        <button type="button" onClick={() => rotateBy(-360 / NUMBERS)} className="glass rounded-full px-4 py-2 font-bold">
          Right ↻
        </button>
      </div>
    </div>
  )
}

function VaultEditor({ value, onChange }: { value: VaultConfig; onChange(c: VaultConfig): void }) {
  return (
    <ChipGroup
      label="Tumblers"
      value={value.tumblers}
      options={[
        { value: '3', label: '3' },
        { value: '4', label: '4' },
      ]}
      onChange={(tumblers) => onChange({ tumblers })}
    />
  )
}

export const vaultMission = defineMission<VaultConfig>({
  id: 'vault',
  name: 'Vault Cracker',
  icon: '🔒',
  description: 'Spin the dial right, left, right — feel for the hot spot to crack each tumbler. No camera.',
  needsCamera: false,
  defaultConfig: { tumblers: '3' },
  summary: (c) => `${c.tumblers} tumblers`,
  ConfigEditor: VaultEditor,
  Runner: VaultRunner,
})
