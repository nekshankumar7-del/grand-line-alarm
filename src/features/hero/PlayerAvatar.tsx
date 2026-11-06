import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { db } from '@/db/db'
import { SentinelEmblem } from '@/editions/sentinel/SentinelEmblem'
import { toonify, TOON_VERSION } from '@/features/faceid/toonify'
import { useProfile } from '@/features/faceid/useProfile'
import { cn } from '@/lib/cn'
import { usePlayerStore, type AvatarMode } from '@/store/playerStore'
import { SentinelSuitAvatar } from './SentinelSuitAvatar'

interface PlayerAvatarProps {
  className?: string
  /** Override the stored display mode. */
  mode?: AvatarMode
  /** Play the photo → toon transformation when mounted. */
  transform?: boolean
  aura?: boolean
}

let generating = false

/** Generates the toon portrait from the captured photo once, then remembers it in the profile. */
function useToon() {
  const profile = useProfile()
  useEffect(() => {
    if (!profile?.photo || generating || (profile.toon && (profile.toonVersion ?? 1) >= TOON_VERSION)) return
    generating = true
    toonify(profile.photo)
      .then((toon) => db.profile.update('me', { toon, toonVersion: TOON_VERSION }))
      .catch(() => undefined)
      .finally(() => {
        generating = false
      })
  }, [profile])
  return profile
}

function Frame({ children, aura }: { children: ReactNode; aura: boolean }) {
  const reduce = useReducedMotion()
  return (
    <div className="relative h-full w-full">
      {aura && (
        <motion.div
          aria-hidden
          className="absolute inset-[-10%] rounded-full"
          style={{ background: 'conic-gradient(from 0deg, transparent, rgb(245 158 11 / 0.55), transparent 40%)' }}
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      )}
      <div
        className="absolute inset-0 overflow-hidden rounded-full border-[3px] border-black shadow-[0_0_0_3px_#f59e0b,0_0_30px_rgba(245,158,11,0.35)]"
        style={{ background: 'radial-gradient(circle at 50% 35%, #334155 0%, #0f172a 60%, #020617 100%)' }}
      >
        {children}
      </div>
      <span className="absolute -bottom-1 -right-1 grid size-[28%] max-h-10 max-w-10 place-items-center rounded-full border-2 border-black bg-[#0b0f19]">
        <SentinelEmblem color="#f59e0b" className="size-[70%]" />
      </span>
    </div>
  )
}

/** The player's avatar: a toon portrait made from their own photo, or the photo itself. */
export function PlayerAvatar({ className, mode, transform = false, aura = true }: PlayerAvatarProps) {
  const profile = useToon()
  const { name, avatarMode, suitFace, visor } = usePlayerStore()
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<'photo' | 'flash' | 'final'>(transform && !reduce ? 'photo' : 'final')
  const display = mode ?? avatarMode

  useEffect(() => {
    if (!transform || reduce) return
    setPhase('photo')
    const a = window.setTimeout(() => setPhase('flash'), 900)
    const b = window.setTimeout(() => setPhase('final'), 1300)
    return () => {
      window.clearTimeout(a)
      window.clearTimeout(b)
    }
  }, [transform, reduce])

  let final: ReactNode
  const suitSrc = suitFace === 'photo' ? profile?.photo : (profile?.toon ?? profile?.photo)
  if (display === 'sentinel' && suitSrc) {
    final = <SentinelSuitAvatar src={suitSrc} visor={visor} />
  } else if (display === 'photo' && profile?.photo) {
    final = <img src={profile.photo} alt={`${name}'s photo`} className="h-full w-full object-cover" />
  } else if (profile?.toon) {
    final = <img src={profile.toon} alt={`${name}'s portrait`} className="h-full w-full object-cover" />
  } else if (profile?.photo) {
    final = (
      <div className="grid h-full w-full place-items-center">
        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-2xl">
          ✨
        </motion.span>
      </div>
    )
  } else {
    final = (
      <div className="grid h-full w-full place-items-center">
        <SentinelEmblem color="#f59e0b" className="size-1/2 opacity-80" />
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait">
        {phase !== 'final' && profile?.photo ? (
          <motion.img
            key="photo"
            src={profile.photo}
            alt=""
            className="absolute inset-0 h-full w-full rounded-full object-cover"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: phase === 'flash' ? 1.15 : 1, opacity: 1, filter: phase === 'flash' ? 'brightness(3) blur(4px)' : 'none' }}
            exit={{ scale: 0.4, opacity: 0 }}
          />
        ) : (
          <motion.div
            key={`final-${display}`}
            className="h-full w-full"
            initial={transform ? { scale: 0.3, opacity: 0 } : { opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          >
            <Frame aura={aura}>{final}</Frame>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {phase === 'flash' && (
          <motion.div key="burst" className="pointer-events-none absolute inset-[-20%] rounded-full bg-[radial-gradient(circle,#fde68a_0%,transparent_65%)]" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1.2 }} exit={{ opacity: 0, scale: 1.6 }} />
        )}
      </AnimatePresence>
    </div>
  )
}
