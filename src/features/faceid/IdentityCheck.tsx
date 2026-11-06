import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { FaceProfile } from '@/features/alarms/types'
import { describeFace, loadFaceId, matchDistance, MATCH_THRESHOLD } from '@/features/vision/faceId'
import { useCamera } from '@/features/vision/useCamera'
import { FaceCircle, type CircleTone } from './FaceCircle'

const NEEDED = 3

/** Trial gate: confirms the registered person is the one awake before any trial counts. */
export function IdentityCheck({ profile, onVerified }: { profile: FaceProfile; onVerified(): void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const camera = useCamera(videoRef)
  const [matches, setMatches] = useState(0)
  const [tone, setTone] = useState<CircleTone>('idle')
  const [message, setMessage] = useState('Loading face ID…')
  const [broken, setBroken] = useState(false)
  const done = useRef(onVerified)
  done.current = onVerified

  useEffect(() => {
    if (camera !== 'live') return
    let stopped = false
    let hits = 0
    const tick = async () => {
      if (stopped) return
      try {
        const sample = videoRef.current ? await describeFace(videoRef.current) : null
        if (stopped) return
        if (!sample) {
          setTone('idle')
          setMessage('Look into the circle')
        } else if (sample.faces > 1) {
          setTone('bad')
          setMessage('One person only!')
        } else if (matchDistance(sample.descriptor, profile) < MATCH_THRESHOLD) {
          hits += 1
          setMatches(hits)
          setTone('good')
          setMessage('Recognising you…')
          if (hits >= NEEDED) {
            setMessage('Identity confirmed!')
            window.setTimeout(() => done.current(), 700)
            return
          }
        } else {
          hits = 0
          setMatches(0)
          setTone('bad')
          setMessage('🚨 Face does not match the registered user!')
          navigator.vibrate?.(300)
        }
      } catch {
        setBroken(true)
        return
      }
      window.setTimeout(tick, 250)
    }
    void loadFaceId()
      .then(() => tick())
      .catch(() => setBroken(true))
    return () => {
      stopped = true
    }
  }, [camera, profile])

  if (camera === 'denied' || camera === 'unavailable' || broken) {
    return (
      <div className="glass rounded-3xl p-5 text-center" role="alert">
        <p className="font-display text-3xl text-gold">Face ID unavailable</p>
        <p className="mt-2 text-sm text-white/80">The camera or face model isn’t working, so camera missions will be swapped for harder ciphers.</p>
        <Button className="mt-4" variant="secondary" onClick={onVerified}>
          Continue to missions
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <FaceCircle videoRef={videoRef} progress={matches / NEEDED} tone={tone}>
          {profile.photo && (
            <img src={profile.photo} alt="" aria-hidden className="absolute bottom-3 right-3 size-14 rounded-xl border-2 border-gold object-cover opacity-90" />
          )}
        </FaceCircle>
      </div>
      <AnimatePresence mode="popLayout">
        <motion.p
          key={message}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          aria-live="polite"
          className={tone === 'bad' ? 'text-center font-display text-3xl text-accent' : 'text-center font-display text-3xl'}
        >
          {message}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
