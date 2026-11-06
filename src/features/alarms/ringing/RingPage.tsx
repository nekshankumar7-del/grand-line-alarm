import { useEdition, useMissionLabel } from '@/editions/useEdition'
import { SentinelEmblem } from '@/editions/sentinel/SentinelEmblem'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { alarmSound, isCustomSound } from '@/audio/alarmSound'
import { ringtoneFor } from '@/audio/ringtones'
import { ImpactText } from '@/components/fx/ImpactText'
import { SpeedLines } from '@/components/fx/SpeedLines'
import { Button } from '@/components/ui/Button'
import { speak } from '@/audio/voice'
import { getHero, pickLine } from '@/features/hero/hero'
import { SentinelHero } from '@/editions/sentinel/SentinelHero'
import { SpeechBubble } from '@/features/hero/SpeechBubble'
import { MISSIONS } from '@/features/missions/registry'
import { useTicker } from '@/hooks/useTicker'
import { useWakeLock } from '@/hooks/useWakeLock'
import { useStrictLock } from '../useStrictLock'
import { gsapEase } from '@/motion/tokens'
import { startTrials } from '../actions'
import { formatTime } from '../format'
import { useActiveAlarm } from '../useActiveAlarm'
import { EmergencyExit } from './EmergencyExit'

gsap.registerPlugin(useGSAP)

/** "The Raid": anime cut-in → impact text → shaking, pulsing alarm screen. */
export function RingPage() {
  const lbl = useMissionLabel()
  const edition = useEdition()
  const active = useActiveAlarm()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const tick = useTicker(1000)
  const root = useRef<HTMLDivElement>(null)
  useWakeLock(true)
  const escapes = useStrictLock(true)

  useEffect(() => {
    if (active === null) navigate('/app', { replace: true })
  }, [active, navigate])

  const ready = Boolean(active)
  useGSAP(
    () => {
      if (!ready || reduceMotion) return
      const tl = gsap.timeline()
      tl.fromTo('.raid-flash', { opacity: 1 }, { opacity: 0, duration: 0.5, ease: 'power2.out' })
        .fromTo('.raid-panel', { xPercent: -130, skewX: -18 }, { xPercent: 0, skewX: -8, duration: 0.5, ease: 'power4.out' }, 0.05)
        .fromTo('.raid-char', { scale: 1.9, x: -120, opacity: 0 }, { scale: 1, x: 0, opacity: 1, duration: 0.7, ease: gsapEase.impact }, 0.15)
        .fromTo('.raid-time', { scale: 3.2, opacity: 0, rotate: -12 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.55, ease: gsapEase.impact }, 0.5)
        .fromTo('.raid-ui > *', { y: 50, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'back.out(2)' }, 0.75)
      gsap.to('.raid-shake', { x: 'random(-7, 7)', y: 'random(-5, 5)', duration: 0.06, repeat: -1, repeatRefresh: true, ease: 'none', delay: 1.2 })
      gsap.to('.raid-pulse', { opacity: 0.85, duration: 0.5, repeat: -1, yoyo: true, ease: 'sine.inOut' })
    },
    { scope: root, dependencies: [ready, reduceMotion] },
  )

  const line = active ? pickLine(getHero(active.crewId).lines.ring, Math.floor(tick / 5)) : ''
  const crewId = active?.crewId
  useEffect(() => {
    if (crewId && line) speak(getHero(crewId).id, line)
  }, [crewId, line])

  if (!active) return null
  const crew = getHero(active.crewId)
  const now = new Date()

  async function begin() {
    alarmSound.unlock()
    await startTrials()
    navigate('/app/trial', { replace: true })
  }

  return (
    <main ref={root} className="relative min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#3b0764,#0b1026_55%,#020617)] text-center">
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
      {<SentinelEmblem color="#facc15" className="raid-pulse pointer-events-none absolute left-1/2 top-[18%] size-[60vmin] -translate-x-1/2 opacity-20" />}
      <div className="raid-pulse pointer-events-none absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgb(0_0_0/0.6))] opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(0_0_0/0.18)_1.5px,transparent_1.5px)] [background-size:10px_10px]" />
      <SpeedLines className="text-white/35" speed={14} />

      <div className="raid-shake relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-4 py-8">
        {/* anime cut-in panel */}
        <div className="raid-panel relative w-[115%] -skew-x-[8deg] overflow-hidden border-y-[6px] border-ink bg-gradient-to-r from-ink via-[#2a1438] to-ink py-3 shadow-[0_20px_0_rgb(0_0_0/0.35)]">
          <div className="skew-x-[8deg] flex items-center justify-center gap-2 px-6">
            <SentinelHero mood="angry" className="raid-char h-44 w-44 shrink-0 drop-shadow-[0_8px_0_rgba(0,0,0,0.5)]" />
            <div className="min-w-0 text-left">
              <p className="font-display text-sm tracking-[0.3em] text-gold">{crew.role.toUpperCase()}</p>
              <p className="font-display text-3xl leading-none tracking-wide text-white">{crew.name}</p>
              <SpeechBubble text={line} className="mt-2" />
            </div>
          </div>
        </div>

        <ImpactText text={edition.shout} className="mt-2 text-7xl md:text-8xl" repeatDelay={0.6} />
        <p className="raid-time font-display text-[7rem] leading-none tabular-nums tracking-wide text-outline manga-shadow">{formatTime(now.getHours(), now.getMinutes())}</p>

        <div className="raid-ui flex w-full flex-col items-center gap-3">
          <p className="font-display text-2xl tracking-wide">
            {active.label}
            {active.test ? ' (test)' : ''} · {isCustomSound(active.sound) ? '🎵 Your sound' : `${ringtoneFor(active.sound).icon} ${ringtoneFor(active.sound).name}`}
          </p>
          <ul className="flex flex-wrap justify-center gap-2" aria-label="Trials to complete">
            {active.missions.map((m, i) => (
              <motion.li
                key={m.uid}
                animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                className="glass rounded-full px-3 py-1 font-bold"
              >
                {lbl(MISSIONS[m.type]).icon} {lbl(MISSIONS[m.type]).name}
              </motion.li>
            ))}
          </ul>
          {alarmSound.blocked && <p className="rounded-xl bg-ink/60 px-3 py-2 text-sm font-bold">🔇 Your browser muted the horn — tap anywhere to sound it.</p>}
          <Button size="lg" variant="secondary" className="glow-ring mt-2 w-full" onClick={() => void begin()}>
            ⚔️ Start the trials
          </Button>
          <p className="text-sm text-white/80">No stop button. Prove it’s you, then clear every trial.</p>
          <EmergencyExit />
        </div>
      </div>

      {edition.id === "sentinel" && (
        <>
          <motion.div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[9vh] bg-black" initial={{ y: "-100%" }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} />
          <motion.div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-[9vh] bg-black" initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} />
        </>
      )}
      <div className="raid-flash pointer-events-none fixed inset-0 z-50 bg-white opacity-0" />
    </main>
  )
}
