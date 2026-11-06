import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
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


function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatches(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return matches
}

export function WatchtowerPage() {
  const wide = useMediaQuery('(min-width: 1280px)')
  const alarms = useLiveQuery(() => db.alarms.toArray().then((list) => list.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))), [])
  const profile = useProfile()
  const { bounty, streak, name, title } = usePlayerStore()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpenState] = useState(params.get('profile') === '1')
  useEffect(() => {
    if (params.get('profile') === '1') setProfileOpenState(true)
  }, [params])
  const setProfileOpen = (open: boolean) => {
    setProfileOpenState(open)
    if (!open && params.get('profile')) navigate('/app', { replace: true })
  }
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
      {wide ? <HangingSentinel id="watchtower-xl" defaultX={0.88} rope={150} size={120} /> : <HangingSentinel id="watchtower" defaultX={0.82} rope={70} size={70} />}
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
      <AvatarLightbox open={zoomOpen} onClose={() => setZoomOpen(false)} />

      <motion.div
        className="relative z-10 mx-auto flex max-w-md flex-col gap-5 px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))] lg:grid lg:h-dvh lg:max-w-[100rem] lg:grid-cols-[15rem_minmax(0,1fr)_21rem] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-x-6 lg:gap-y-5 lg:px-8 lg:pb-10 lg:pt-6 xl:grid-cols-[16rem_minmax(0,1fr)_24rem]"
        variants={staggerContainer(0.08, 0.1)}
        initial="hidden"
        animate="show"
      >
        <motion.header variants={fadeUp} className="flex w-full min-w-0 items-center justify-between gap-3 lg:col-span-3">
          <div className="flex min-w-0 items-center gap-3">
            <motion.span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-amber-500/60 bg-black/50 shadow-[0_0_24px_rgba(245,158,11,0.35)]"
              animate={{ boxShadow: ['0 0 12px rgba(245,158,11,0.25)', '0 0 28px rgba(245,158,11,0.6)', '0 0 12px rgba(245,158,11,0.25)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <SentinelEmblem color="#f59e0b" className="size-8" />
            </motion.span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400/90">{greeting()}</p>
              <h1 className="truncate font-display text-4xl leading-none tracking-[0.06em] text-white manga-shadow sm:text-5xl">{APP.home}</h1>
            </div>
          </div>
          <ThemeSwitcher />
        </motion.header>

        {/* MOBILE: compact profile strip */}
        <motion.button
          type="button"
          variants={fadeUp}
          onClick={() => setProfileOpen(true)}
          className="glass flex w-full items-center gap-3 rounded-2xl p-3 text-left lg:hidden"
          aria-label="Open your case file"
        >
          <PlayerAvatar aura={false} className="size-14 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-2xl leading-none tracking-wide">{name || 'Sentinel'}</p>
            <p className="truncate text-xs font-bold uppercase tracking-widest text-amber-400">{title} · {rank.title}</p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500" style={{ width: `${rankProgress * 100}%` }} />
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-2xl leading-none tabular-nums">{bounty.toLocaleString()}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">REP · 🔦 {streak}</p>
          </div>
        </motion.button>

        {/* LEFT: case file (desktop) */}
        <div className="hidden flex-col items-center gap-4 lg:flex lg:min-h-0 lg:items-stretch">
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
          {next && next.at.getTime() - Date.now() < 12 * 3600_000 && (
            <motion.button
              type="button"
              variants={fadeUp}
              onClick={() => setBedside(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3 text-left lg:hidden"
            >
              <span className="text-2xl">🌙</span>
              <span className="min-w-0 flex-1 text-sm">
                <b className="block text-amber-300">Going to sleep? Turn on Bedside mode</b>
                <span className="text-white/70">Keep the app open and charging so the alarm can ring on time.</span>
              </span>
              <span className="text-amber-300">›</span>
            </motion.button>
          )}
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
