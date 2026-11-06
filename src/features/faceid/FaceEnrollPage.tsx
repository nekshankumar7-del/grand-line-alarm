import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AuroraBackdrop } from '@/components/effects/AuroraBackdrop'
import { ConfettiBurst } from '@/components/effects/ConfettiBurst'
import { Button } from '@/components/ui/Button'
import { db } from '@/db/db'
import { SentinelHero } from '@/editions/sentinel/SentinelHero'
import { SpeechBubble } from '@/features/hero/SpeechBubble'
import { PlayerAvatar } from '@/features/hero/PlayerAvatar'
import { describeFace, distance, loadFaceId, meanDescriptor, sampleFaceColors, snapshotFace, type FaceSample } from '@/features/vision/faceId'
import { useCamera } from '@/features/vision/useCamera'
import { fadeUp, popIn, staggerContainer } from '@/motion/variants'
import { FaceCircle, type CircleTone } from './FaceCircle'
import { toonify, TOON_VERSION } from './toonify'
import { useProfile } from './useProfile'

const PROMPTS = ['Look straight at the camera', 'Turn your head slightly left', 'Now slightly right', 'Chin up a little', 'Give me a big smile!']
const DWELL_MS = 700

function Scanner({ onDone }: { onDone(): void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const camera = useCamera(videoRef, true)
  const [step, setStep] = useState(0)
  const [tone, setTone] = useState<CircleTone>('idle')
  const [message, setMessage] = useState('Loading face scanner…')
  const [failed, setFailed] = useState<string | null>(null)

  useEffect(() => {
    if (camera !== 'live') return
    let stopped = false
    const samples: FaceSample[] = []
    let seenSince = 0

    const tick = async () => {
      if (stopped) return
      const video = videoRef.current
      try {
        const sample = video ? await describeFace(video) : null
        if (stopped) return
        const now = performance.now()
        if (!sample) {
          seenSince = 0
          setTone('idle')
          setMessage('No face found — move into the circle')
        } else if (sample.faces > 1) {
          seenSince = 0
          setTone('bad')
          setMessage('Only one face, please!')
        } else if (samples.length && distance(sample.descriptor, samples[0].descriptor) > 0.6) {
          seenSince = 0
          setTone('bad')
          setMessage('That looks like a different person!')
        } else {
          setTone('good')
          seenSince ||= now
          setMessage(PROMPTS[samples.length])
          if (now - seenSince > DWELL_MS) {
            samples.push(sample)
            seenSince = 0
            navigator.vibrate?.(30)
            setStep(samples.length)
            if (samples.length >= PROMPTS.length) {
              const photo = video ? snapshotFace(video, samples[0].box) : ''
              const colors = video ? sampleFaceColors(video, sample.box) : {}
              const vectors = samples.map((s) => s.descriptor)
              setMessage('Drawing your anime portrait…')
              const toon = photo ? await toonify(photo).catch(() => undefined) : undefined
              const toonVersion = toon ? TOON_VERSION : undefined
              await db.profile.put({ id: 'me', descriptor: meanDescriptor(vectors), samples: vectors, photo, toon, toonVersion, ...colors, enrolledAt: Date.now() })
              onDone()
              return
            }
          }
        }
      } catch {
        setFailed('The face scanner could not load on this device.')
        return
      }
      window.setTimeout(tick, 120)
    }
    void loadFaceId()
      .then(() => tick())
      .catch(() => setFailed('The face scanner could not load on this device.'))
    return () => {
      stopped = true
    }
  }, [camera, onDone])

  if (camera === 'denied' || camera === 'unavailable' || failed) {
    return (
      <div className="glass rounded-3xl p-5 text-center" role="alert">
        <p className="font-display text-3xl text-gold">Can’t see you!</p>
        <p className="mt-2">{failed ?? (camera === 'denied' ? 'Camera permission was denied — allow it in your browser settings.' : 'No camera found on this device.')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <FaceCircle videoRef={videoRef} progress={step / PROMPTS.length} tone={tone} />
      <div className="flex gap-2" aria-hidden>
        {PROMPTS.map((_, i) => (
          <motion.span key={i} className="h-2 rounded-full" animate={{ width: i < step ? 28 : 10, backgroundColor: i < step ? 'var(--c-gold)' : 'rgb(255 255 255 / 0.3)' }} />
        ))}
      </div>
      <AnimatePresence mode="popLayout">
        <motion.p
          key={message}
          initial={{ y: 14, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -14, opacity: 0 }}
          aria-live="polite"
          className="text-center font-display text-3xl tracking-wide"
        >
          {message}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

export function FaceEnrollPage() {
  const profile = useProfile()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = params.get('return') || '/app'
  const [mode, setMode] = useState<'intro' | 'scan' | 'done'>('intro')

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <AuroraBackdrop />
      <motion.main className="relative z-10 mx-auto flex max-w-md flex-col items-center gap-6 px-4 pb-16 pt-6 text-center" variants={staggerContainer(0.1)} initial="hidden" animate="show">
        <motion.header variants={fadeUp} className="flex w-full items-center gap-3">
          <Link to="/app" aria-label="Back to the Watchtower" className="glass grid size-11 place-items-center rounded-full text-2xl">
            ←
          </Link>
          <h1 className="font-display text-4xl tracking-wide text-outline manga-shadow">Sentinel Face ID</h1>
        </motion.header>

        <AnimatePresence mode="wait">
          {mode === 'intro' && (
            <motion.section key="intro" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} className="flex w-full flex-col items-center gap-5">
              <div className="flex items-end gap-2">
                <SentinelHero mood="idle" className="h-44 w-28" />
                <SpeechBubble text="I will memorise your face, so nobody else can complete your missions." className="mb-10 max-w-[12rem]" />
              </div>
              {profile && (
                <motion.div variants={popIn} className="glass flex w-full items-center gap-4 rounded-3xl p-4 text-left">
                  {profile.photo && <img src={profile.photo} alt="Your registered face" className="size-20 rounded-2xl border-[3px] border-gold object-cover" />}
                  <div>
                    <p className="font-display text-2xl text-gold">Face registered ✓</p>
                    <p className="text-sm text-white/75">Since {new Date(profile.enrolledAt).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              )}
              <ul className="glass w-full space-y-2 rounded-3xl p-5 text-left text-sm">
                <li>🔒 Your face is turned into numbers <b>on this device</b> — no photo or data is ever uploaded.</li>
                <li>🎯 When an alarm rings, the trials only count if <b>you</b> are the one doing them.</li>
                <li>🌀 Takes ~5 seconds: follow the prompts and slowly move your head.</li>
              </ul>
              <Button size="lg" className="glow-ring w-full" onClick={() => setMode('scan')}>
                {profile ? '🔄 Re-scan my face' : '📸 Scan my face'}
              </Button>
              {profile && (
                <button type="button" className="text-sm text-white/60 underline" onClick={() => void db.profile.delete('me')}>
                  Delete my face data
                </button>
              )}
            </motion.section>
          )}
          {mode === 'scan' && (
            <motion.section key="scan" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full">
              <Scanner onDone={() => setMode('done')} />
            </motion.section>
          )}
          {mode === 'done' && (
            <motion.section key="done" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} className="relative flex w-full flex-col items-center gap-5">
              <ConfettiBurst />
              <PlayerAvatar className="size-48" transform mode="toon" />
              <p className="font-display text-5xl tracking-wide text-shine">Identity confirmed</p>
              <p className="text-white/80">Face locked in — only you can silence your alarms. Your case-file portrait is ready.</p>
              <Button size="lg" className="w-full" onClick={() => navigate(returnTo, { replace: true })}>
                Continue ⚓
              </Button>
            </motion.section>
          )}
        </AnimatePresence>
      </motion.main>
    </div>
  )
}
