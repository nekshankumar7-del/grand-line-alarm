import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { speak } from '@/audio/voice'
import { CaseFile } from '@/components/ui/CaseFile'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { db } from '@/db/db'
import { APP, nextRankFor, rankFor } from '@/editions/editions'
import { SentinelCity } from '@/editions/sentinel/SentinelCity'
import { HangingSentinel } from '@/editions/sentinel/HangingSentinel'
import { SentinelEmblem } from '@/editions/sentinel/SentinelEmblem'
import { nextOccurrence } from '@/features/alarms/schedule'
import type { Alarm } from '@/features/alarms/types'
import { useProfile } from '@/features/faceid/useProfile'
import { AvatarLightbox } from '@/features/hero/AvatarLightbox'
import { PlayerAvatar } from '@/features/hero/PlayerAvatar'
import { ProfileSheet } from '@/features/hero/ProfileSheet'
import { useTicker } from '@/hooks/useTicker'
import { fadeUp, popIn, staggerContainer } from '@/motion/variants'
import { usePlayerStore } from '@/store/playerStore'
import { AlarmCard } from './components/AlarmCard'
import { BedsideOverlay } from './components/BedsideOverlay'
import { NextAlarmHero } from './components/NextAlarmHero'
import { PatrolMap } from './components/PatrolMap'

function useNextAlarm(alarms: Alarm[] | undefined) {
  useTicker(30_000)
  let best: { at: Date; alarm: Alarm } | null = null
  for (const alarm of alarms ?? []) {
    if (!alarm.enabled) continue
    const at = nextOccurrence(alarm)
    if (at && (!best || at < best.at)) best = { at, alarm }
  }
  return best
}

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Still on watch?'
  if (h < 12) return 'Morning, Sentinel'
  if (h < 18) return 'The city is quiet'
  return 'Night falls, Sentinel'
}

export function WatchtowerPage() {
  const alarms = useLiveQuery(() => db.alarms.toArray().then((list) => list.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))), [])
  const profile = useProfile()
  const { bounty, streak, name, title } = usePlayerStore()
  const [profileOpen, setProfileOpen] = useState(false)
  const [zoomOpen, setZoomOpen] = useState(false)
  const rank = rankFor('sentinel', bounty)
  const nextRank = nextRankFor('sentinel', bounty)
  const next = useNextAlarm(alarms)
  const [bedside, setBedside] = useState(false)
  const [deleted, setDeleted] = useState<Alarm | null>(null)

  useEffect(() => {
    if (!deleted) return
    const id = window.setTimeout(() => setDeleted(null), 5000)
    return () => window.clearTimeout(id)
  }, [deleted])

  function remove(alarm: Alarm) {
    void db.alarms.delete(alarm.id)
    setDeleted(alarm)
  }

  const portrait = profile ? (
    <button type="button" onClick={() => setZoomOpen(true)} aria-label="View your portrait full screen" className="group relative block h-full w-full cursor-zoom-in">
      <PlayerAvatar aura={false} className="h-full w-full transition-transform group-hover:scale-105" />
      <span className="absolute bottom-1 right-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">🔍 View</span>
    </button>
  ) : undefined
  const rankProgress = nextRank ? Math.min(1, (bounty - rank.minBounty) / (nextRank.minBounty - rank.minBounty)) : 1

  return (
    <div className="relative min-h-dvh">
      <SentinelCity />
      {/* grab it, pull it, let go — it bounces back */}
      <HangingSentinel id="watchtower-xl" defaultX={0.88} className="hidden xl:block" rope={150} size={120} />
      <HangingSentinel id="watchtower" defaultX={0.82} className="xl:hidden" rope={70} size={70} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
      <AvatarLightbox open={zoomOpen} onClose={() => setZoomOpen(false)} />

      <motion.div
        className="relative z-10 mx-auto flex max-w-md flex-col gap-5 px-4 pb-40 pt-6 lg:grid lg:h-dvh lg:max-w-[100rem] lg:grid-cols-[15rem_minmax(0,1fr)_21rem] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-x-6 lg:gap-y-5 lg:px-8 lg:pb-10 lg:pt-6 xl:grid-cols-[16rem_minmax(0,1fr)_24rem]"
        variants={staggerContainer(0.08, 0.1)}
        initial="hidden"
        animate="show"
      >
        <motion.header variants={fadeUp} className="flex w-full items-center justify-between gap-3 lg:col-span-3">
          <div className="flex items-center gap-3">
            <motion.span
              aria-hidden
              className="grid size-12 place-items-center rounded-xl border border-amber-500/60 bg-black/50 shadow-[0_0_24px_rgba(245,158,11,0.35)]"
              animate={{ boxShadow: ['0 0 12px rgba(245,158,11,0.25)', '0 0 28px rgba(245,158,11,0.6)', '0 0 12px rgba(245,158,11,0.25)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <SentinelEmblem color="#f59e0b" className="size-8" />
            </motion.span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400/90">{greeting()}</p>
              <h1 className="font-display text-5xl leading-none tracking-[0.08em] text-white manga-shadow">{APP.home}</h1>
            </div>
          </div>
          <ThemeSwitcher />
        </motion.header>

        {/* LEFT: case file */}
        <div className="flex flex-col items-center gap-4 lg:min-h-0 lg:items-stretch">
          <motion.div variants={popIn} className="relative self-center">
            <CaseFile name={name || 'Sentinel'} reputation={bounty} title={title} subtitle={`Rank · ${rank.title}`} portrait={portrait} className="w-52 lg:w-full" />
            <motion.button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label="Edit your case file"
              whileHover={{ scale: 1.1, rotate: -8 }}
              whileTap={{ scale: 0.9 }}
              className="absolute -left-3 -top-3 z-10 grid size-10 place-items-center rounded-full border border-amber-500/70 bg-black text-lg shadow-lg"
            >
              ✏️
            </motion.button>
            {streak > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1, rotate: 8 }} className="absolute -right-4 -top-3 rounded-md bg-amber-500 px-2.5 py-1 font-display text-lg tracking-wider text-black shadow-lg">
                🔦 {streak} nights
              </motion.span>
            )}
          </motion.div>
          <motion.div variants={fadeUp} className="glass w-full rounded-xl p-3">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-amber-400">{rank.title}</span>
              <span className="text-white/60">{nextRank ? nextRank.title : 'Max rank'}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500" initial={{ width: 0 }} animate={{ width: `${rankProgress * 100}%` }} transition={{ duration: 1.2, delay: 0.4 }} />
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="w-full">
            <Link to="/app/face" className="glass flex items-center gap-3 rounded-xl px-3 py-2.5">
              {profile?.photo ? (
                <img src={profile.photo} alt="" className="size-9 rounded-full border-2 border-amber-500 object-cover" />
              ) : (
                <motion.span className="grid size-9 place-items-center rounded-full bg-red-600 text-lg" animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
                  🪪
                </motion.span>
              )}
              <span className="flex-1 text-sm font-bold leading-tight">{profile ? 'Face ID active' : 'Register your face first'}</span>
              <span className="text-amber-400">›</span>
            </Link>
          </motion.div>
        </div>

        {/* CENTER: next alarm + alarms */}
        <div className="flex min-h-0 flex-col gap-4">
          <motion.div variants={fadeUp}>
            <NextAlarmHero next={next} onBedside={() => setBedside(true)} />
          </motion.div>
          {alarms && alarms.length > 0 && (
            <motion.section variants={fadeUp} className="flex min-h-0 flex-col">
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-xs font-extrabold uppercase tracking-[0.3em] text-white/90">Your alarms ({alarms.length})</h2>
                <span className="text-xs text-white/60">tap to edit · swipe left to delete</span>
              </div>
              <ul className="grid min-h-0 gap-3 lg:overflow-y-auto lg:pb-2 lg:pr-1 xl:grid-cols-2" aria-label="Your alarms">
                <AnimatePresence initial={false}>
                  {alarms.map((alarm) => (
                    <AlarmCard key={alarm.id} alarm={alarm} onDelete={remove} />
                  ))}
                </AnimatePresence>
              </ul>
            </motion.section>
          )}
        </div>

        {/* RIGHT: patrol map + guardian status */}
        <div className="flex flex-col gap-4 lg:min-h-0">
          <motion.div variants={popIn}>
            <PatrolMap streak={streak} />
          </motion.div>
          <motion.section variants={fadeUp} className="glass flex items-center gap-3 rounded-xl p-4">
            <motion.span
              aria-hidden
              className="grid size-14 shrink-0 place-items-center rounded-full border border-amber-400/70 bg-black/40"
              animate={{ boxShadow: ['0 0 0 0 rgba(245,158,11,0.6)', '0 0 0 14px rgba(245,158,11,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <SentinelEmblem color="#f59e0b" className="size-9" />
            </motion.span>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-400">Your guardian</h2>
              <p className="font-display text-2xl leading-tight tracking-wide">The Sentinel is on watch</p>
              <p className="text-xs text-white/70">Hanging over the city until your alarm. It won’t let go until you rise.</p>
            </div>
            <button type="button" onClick={() => speak('sentinel', 'I am watching the city. Sleep well. Rise on time.')} aria-label="Hear the Sentinel" className="glass grid size-10 shrink-0 place-items-center rounded-full">
              🔊
            </button>
          </motion.section>
        </div>
      </motion.div>

      {/* floating action button (mobile) */}
      <motion.div className="fixed bottom-6 left-5 z-30 lg:hidden" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.8, type: 'spring', stiffness: 260, damping: 14 }}>
        <Link to="/app/alarms/new" aria-label="New alarm" className="glow-ring grid size-16 place-items-center rounded-full border border-amber-300 bg-gradient-to-br from-amber-400 to-red-600 text-4xl font-bold text-black shadow-xl">
          +
        </Link>
      </motion.div>

      <AnimatePresence>
        {deleted && (
          <motion.div
            role="status"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-4 bottom-28 z-40 mx-auto flex max-w-md items-center justify-between rounded-xl border border-white/20 bg-[#0b0f19] px-4 py-3 text-white shadow-2xl"
          >
            <span className="font-bold">Alarm removed</span>
            <button
              type="button"
              className="font-display text-xl tracking-wider text-amber-400"
              onClick={() => {
                void db.alarms.put(deleted)
                setDeleted(null)
              }}
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{bedside && <BedsideOverlay next={next ? { at: next.at, label: next.alarm.label } : null} onClose={() => setBedside(false)} />}</AnimatePresence>
    </div>
  )
}
