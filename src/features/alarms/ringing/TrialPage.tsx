import { useMissionLabel } from '@/editions/useEdition'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { alarmSound } from '@/audio/alarmSound'
import { AuroraBackdrop } from '@/components/effects/AuroraBackdrop'
import { ImpactText } from '@/components/fx/ImpactText'
import { speak } from '@/audio/voice'
import { getHero, pickLine } from '@/features/hero/hero'
import { SentinelHero } from '@/editions/sentinel/SentinelHero'
import { SpeechBubble } from '@/features/hero/SpeechBubble'
import { IdentityCheck } from '@/features/faceid/IdentityCheck'
import { useProfile } from '@/features/faceid/useProfile'
import { MISSIONS } from '@/features/missions/registry'
import { useWakeLock } from '@/hooks/useWakeLock'
import { exitStrictFullscreen, useStrictLock } from '../useStrictLock'
import { spring } from '@/motion/tokens'
import { completeMission, finishAlarm, markIdentityVerified, swapForFallback } from '../actions'
import { useActiveAlarm } from '../useActiveAlarm'
import { EmergencyExit } from './EmergencyExit'
import { RopeProgress } from './RopeProgress'

const IDLE_MS = 10_000

export function TrialPage() {
  const lbl = useMissionLabel()
  const active = useActiveAlarm()
  const profile = useProfile()
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [failure, setFailure] = useState<string | null>(null)
  const [cheer, setCheer] = useState(false)
  const [line, setLine] = useState<string | null>(null)
  const idleTimer = useRef<number | null>(null)
  const finishing = useRef(false)
  useWakeLock(true)
  const escapes = useStrictLock(true)

  // Alarm dips while you're making progress; comes back to full after 10s idle.
  const markActivity = useCallback(() => {
    alarmSound.setDucked(true)
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current)
    idleTimer.current = window.setTimeout(() => alarmSound.setDucked(false), IDLE_MS)
  }, [])

  useEffect(
    () => () => {
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current)
      alarmSound.setDucked(false)
    },
    [],
  )

  useEffect(() => {
    if (active === null && !finishing.current) navigate('/app', { replace: true })
  }, [active, navigate])

  const current = active?.missions.find((m) => !active.completed.includes(m.uid))
  const crew = active ? getHero(active.crewId) : null

  const finish = useCallback(async () => {
    if (finishing.current) return
    finishing.current = true
    const record = await finishAlarm()
    exitStrictFullscreen()
    navigate('/app/victory', { replace: true, state: record })
  }, [navigate])

  useEffect(() => {
    if (active && !current) void finish()
  }, [active, current, finish])

  useEffect(() => {
    if (!crew) return
    setLine(pickLine(crew.lines.taunt, Math.random() * 100))
    const id = window.setInterval(() => setLine(pickLine(crew.lines.taunt, Math.random() * 100)), 6000)
    return () => window.clearInterval(id)
  }, [crew])

  useEffect(() => {
    if (crew && line) speak(crew.id, line)
  }, [crew, line])

  if (!active || !current || !crew || profile === undefined) return null
  const needsIdentity = Boolean(profile) && !active.identityVerified
  const def = MISSIONS[current.type]
  const index = active.completed.length
  const total = active.missions.length
  const overall = (index + progress) / total

  async function handleComplete() {
    if (!current || !active || !crew) return
    speak(crew.id, pickLine(crew.lines.cheer, index))
    setCheer(true)
    setProgress(0)
    await completeMission(current.uid)
    window.setTimeout(() => setCheer(false), 1400)
    if (index + 1 >= total) await finish()
  }

  function handleFail(reason: string) {
    setFailure(reason)
    window.setTimeout(() => {
      setFailure(null)
      setProgress(0)
      setAttempt((a) => a + 1)
    }, 2000)
  }

  const { Runner } = def
  const bubble = needsIdentity ? 'Prove it is really you.' : cheer ? pickLine(crew.lines.cheer, index) : (line ?? crew.lines.taunt[0])

  return (
    <main className="relative min-h-dvh overflow-hidden px-4 pb-10">
      {escapes > 0 && (
        <motion.div
          key={escapes}
          role="alert"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[65] mx-auto max-w-md rounded-xl border border-red-400/60 bg-red-700/90 px-4 py-2 text-center text-sm font-bold text-white shadow-xl"
        >
          🚫 No escape — finish every mission to stop the alarm.
        </motion.div>
      )}
      <AuroraBackdrop intensity={0.45} still />
      <div className="relative z-10 mx-auto flex max-w-md flex-col items-center gap-4 pt-4">
        <div className="glass flex w-full items-center gap-3 rounded-[1.75rem] p-2 pr-4">
          <SentinelHero mood={cheer ? 'cheer' : 'angry'} className="h-24 w-24 shrink-0" />
          <SpeechBubble text={bubble} className="min-w-0 flex-1" />
        </div>

        <RopeProgress value={needsIdentity ? 0 : overall} steps={total} />

        {needsIdentity && profile ? (
          <motion.section key="identity" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex w-full flex-col items-center gap-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">Step 0 · Identity check</p>
            <h1 className="font-display text-4xl tracking-wide text-outline manga-shadow">🪪 Identity check</h1>
            <IdentityCheck profile={profile} onVerified={() => void markIdentityVerified()} />
          </motion.section>
        ) : (
          <>
            <motion.header key={current.uid} initial={{ scale: 0.6, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={spring.bouncy} className="text-center">
              <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">
                Trial {index + 1} of {total}
              </p>
              <h1 className="font-display text-4xl tracking-wide text-outline manga-shadow">
                {lbl(def).icon} {lbl(def).name}
              </h1>
            </motion.header>

            <section className="w-full" aria-live="polite">
              <AnimatePresence mode="wait">
                {failure ? (
                  <motion.p key="fail" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ opacity: 0 }} className="text-center font-display text-3xl text-accent">
                    {failure} — again!
                  </motion.p>
                ) : (
                  <motion.div key={`${current.uid}-${attempt}`} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={spring.snappy}>
                    <Runner
                      config={current.config}
                      onProgress={(p) => {
                        setProgress(p)
                        markActivity()
                      }}
                      onComplete={() => void handleComplete()}
                      onFail={handleFail}
                      onUnavailable={() => void swapForFallback(current.uid)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </>
        )}

        <EmergencyExit />
      </div>

      <AnimatePresence>
        {cheer && (
          <motion.div className="pointer-events-none fixed inset-0 z-30 grid place-items-center bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ImpactText text="CLEARED!" className="text-8xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
