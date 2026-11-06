import { useMissionLabel } from '@/editions/useEdition'
import { motion } from 'motion/react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { describeDays, formatCountdown, formatTime } from '@/features/alarms/format'
import type { Alarm } from '@/features/alarms/types'
import { getHero } from '@/features/hero/hero'
import { SentinelHero } from '@/editions/sentinel/SentinelHero'
import { SpeechBubble } from '@/features/hero/SpeechBubble'
import { MISSIONS } from '@/features/missions/registry'
import { spring } from '@/motion/tokens'

interface NextAlarmHeroProps {
  next: { at: Date; alarm: Alarm } | null
  onBedside(): void
}

const DAY_MS = 24 * 3600_000

function CountdownRing({ remaining }: { remaining: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  const frac = Math.min(1, remaining / DAY_MS)
  return (
    <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden>
      <circle cx={60} cy={60} r={r} fill="none" stroke="rgb(255 255 255 / 0.15)" strokeWidth={6} />
      <motion.circle
        cx={60}
        cy={60}
        r={r}
        fill="none"
        stroke="url(#ring-grad)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * frac }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
      <defs>
        <linearGradient id="ring-grad">
          <stop offset="0" stopColor="var(--c-gold)" />
          <stop offset="1" stopColor="var(--c-accent)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function NextAlarmHero({ next, onBedside }: NextAlarmHeroProps) {
  const lbl = useMissionLabel()
  if (!next) {
    return (
      <div className="glass relative overflow-hidden rounded-[2rem] p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <SentinelHero mood="idle" className="h-44 w-28 shrink-0" />
          <div className="min-w-0 flex-1">
            <SpeechBubble tail="left" text="No watch scheduled. Set your first alarm." />
            <p className="mt-3 text-sm text-white/80">Pick a time, a ringtone and your morning missions. The alarm only stops when you beat them.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
              <ButtonLink to="/app/alarms/new" variant="secondary" size="md">
                ＋ Schedule a watch
              </ButtonLink>
              <Button variant="ghost" onClick={onBedside}>
                🌙 Bedside mode
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { at, alarm } = next
  const remaining = at.getTime() - Date.now()
  const crew = getHero(alarm.crewId)

  return (
    <div className="glass relative overflow-hidden rounded-[2rem] p-5">
      <motion.div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full blur-3xl" style={{ background: crew.aura, opacity: 0.35 }} animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 6, repeat: Infinity }} />
      <p className="relative text-xs font-extrabold uppercase tracking-[0.3em] text-gold">Next alarm</p>
      <div className="relative mt-2 flex flex-col items-center gap-5 sm:flex-row">
        <div className="relative grid size-44 shrink-0 place-items-center">
          <CountdownRing remaining={remaining} />
          <div className="text-center">
            <motion.p key={formatTime(at.getHours(), at.getMinutes())} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring.bouncy} className="font-display text-5xl tabular-nums tracking-wide text-shine">
              {formatTime(at.getHours(), at.getMinutes())}
            </motion.p>
            <p className="text-xs font-bold text-white/80">in {formatCountdown(remaining)}</p>
          </div>
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="font-display text-3xl tracking-wide">{alarm.label}</p>
          <p className="text-sm text-white/75">{describeDays(alarm.days)}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {alarm.missions.map((m) => (
              <span key={m.uid} className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold">
                {lbl(MISSIONS[m.type]).icon} {lbl(MISSIONS[m.type]).name}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 sm:justify-start">
            <SentinelHero className="h-14 w-10" />
            <p className="text-sm">
              <b>{crew.name}</b> will wake you
            </p>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
            <ButtonLink to="/app/alarms/new" variant="secondary">
              ＋ New alarm
            </ButtonLink>
            <Button variant="ghost" onClick={onBedside}>
              🌙 Bedside mode
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
