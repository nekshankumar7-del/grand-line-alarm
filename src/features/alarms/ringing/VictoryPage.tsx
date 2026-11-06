import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { CoinRain } from '@/components/effects/CoinRain'
import { ConfettiBurst } from '@/components/effects/ConfettiBurst'
import { ImpactText } from '@/components/fx/ImpactText'
import { ButtonLink } from '@/components/ui/Button'
import { CountUp } from '@/components/ui/CountUp'
import { rankFor } from '@/editions/editions'
import { useEdition } from '@/editions/useEdition'
import { db } from '@/db/db'
import { speak } from '@/audio/voice'
import { getHero, pickLine } from '@/features/hero/hero'
import { SentinelHero } from '@/editions/sentinel/SentinelHero'
import { SpeechBubble } from '@/features/hero/SpeechBubble'
import { fadeUp, popIn, staggerContainer } from '@/motion/variants'
import { usePlayerStore } from '@/store/playerStore'
import type { WakeRecord } from '../types'
import { useActiveAlarm } from '../useActiveAlarm'

const QUOTES = [
  'The city belongs to those who rise to meet it.',
  'Legends are made before sunrise.',
  'Plan your patrol before the world wakes.',
  'Every watch begins with one step out of bed.',
  'The night rewards the ones who show up.',
]

export function VictoryPage() {
  const location = useLocation()
  const edition = useEdition()
  const navigate = useNavigate()
  const active = useActiveAlarm()
  const [record, setRecord] = useState<WakeRecord | null>((location.state as WakeRecord | null) ?? null)
  const { bounty, streak } = usePlayerStore()
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])

  useEffect(() => {
    if (!record) void db.history.orderBy('firedAt').last().then((r) => setRecord(r ?? null))
  }, [record])

  // A different alarm started ringing → go back to it.
  useEffect(() => {
    if (active && (!record || active.firedAt !== record.firedAt)) navigate('/app/ring', { replace: true })
  }, [active, record, navigate])

  const cheerLine = record ? (record.emergency ? 'Rest. The city can wait today.' : pickLine(getHero(record.crewId).lines.cheer, record.id)) : ''
  useEffect(() => {
    if (record) speak(getHero(record.crewId).id, cheerLine)
  }, [record, cheerLine])

  if (!record) return null
  const seconds = Math.round((record.finishedAt - record.firedAt) / 1000)

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#1e3a5f,#0b1026_60%,#020617)] px-4 py-10 text-center">
      <ConfettiBurst />
      {!record.emergency && record.bounty > 0 && <CoinRain />}
      <motion.div className="relative z-10 flex w-full max-w-md flex-col items-center gap-4" variants={staggerContainer(0.12)} initial="hidden" animate="show">
        <motion.div variants={popIn}>
          <ImpactText text={record.emergency ? 'STOPPED' : 'VICTORY!'} className="text-7xl" repeatDelay={2} />
        </motion.div>
        <motion.div variants={popIn} className="flex items-center gap-3">
          <SentinelHero mood="cheer" className="h-48 w-32 shrink-0" />
          <SpeechBubble text={cheerLine} />
        </motion.div>

        <motion.div variants={fadeUp} className="paper-grain w-full rounded-3xl border-[3px] border-ink p-5 text-ink hard-shadow">
          {record.emergency ? (
            <p className="font-bold">Emergency stop logged. No reputation today — the watch resumes tomorrow.</p>
          ) : (
            <>
              <p className="text-xs font-extrabold uppercase tracking-[0.3em] opacity-70">{edition.currency} earned</p>
              <CountUp value={record.bounty} suffix={edition.currencySuffix} className="block font-display text-6xl tabular-nums text-accent" />
              <div className="mt-3 grid grid-cols-3 gap-2 border-t-2 border-dashed border-ink/30 pt-3 text-sm font-bold">
                <div>
                  <p className="font-display text-2xl">{seconds}s</p>to wake
                </div>
                <div>
                  <p className="font-display text-2xl">🔥 {streak}</p>night watch
                </div>
                <div>
                  <p className="font-display text-2xl">{bounty.toLocaleString()}</p>
                  {rankFor(edition.id, bounty).title}
                </div>
              </div>
              {record.bounty === 0 && <p className="mt-2 text-sm opacity-70">Test alarms don’t earn reputation.</p>}
            </>
          )}
        </motion.div>

        <motion.p variants={fadeUp} className="font-display text-2xl tracking-wide text-white/90">
          “{quote}”
        </motion.p>
        <motion.div variants={fadeUp}>
          <ButtonLink to="/app" size="lg">
            🗼 Back to the Watchtower
          </ButtonLink>
        </motion.div>
      </motion.div>
    </main>
  )
}
