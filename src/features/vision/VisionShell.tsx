import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { useCamera } from './useCamera'
import { useIdentityWatch, type IdentityStatus } from './useIdentityWatch'
import { useVisionLoop, type FrameInfo } from './useVisionLoop'

export interface Verdict {
  hint: string
  /** The reading counts right now (correct position/pose). */
  good: boolean
  /** Something was found at all (face / body / hand) — drives the "being read" indicator. */
  detected?: boolean
  progress: number
  done: boolean
}

interface VisionShellProps<Model> {
  load: () => Promise<Model>
  onFrame(model: Model, video: HTMLVideoElement, info: FrameInfo, canvas: HTMLCanvasElement | null): Verdict
  badge?: string
  overlay?: ReactNode
  /** What is being tracked, for the status panel ("face", "body", "hand"). */
  subject?: string
  /** Re-verify the registered face during the mission (default on). */
  checkIdentity?: boolean
  onProgress(p: number): void
  onComplete(): void
  onUnavailable?(reason: string): void
}

const ID_TEXT: Record<IdentityStatus, { text: string; tone: 'ok' | 'wait' | 'bad' | 'off' }> = {
  off: { text: 'ID off', tone: 'off' },
  loading: { text: 'ID loading…', tone: 'wait' },
  checking: { text: 'ID checking…', tone: 'wait' },
  match: { text: 'ID verified', tone: 'ok' },
  stranger: { text: 'Not you!', tone: 'bad' },
}

const TONE = {
  ok: 'border-emerald-400/70 bg-emerald-500/25 text-emerald-200',
  wait: 'border-amber-400/60 bg-amber-500/20 text-amber-100',
  bad: 'border-red-400/70 bg-red-600/40 text-red-100',
  off: 'border-white/20 bg-black/40 text-white/60',
}

function Chip({ tone, icon, text }: { tone: keyof typeof TONE; icon: string; text: string }) {
  return (
    <span className={cn('flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold backdrop-blur', TONE[tone])}>
      <span aria-hidden>{icon}</span>
      {text}
    </span>
  )
}

export function VisionShell<Model>({ load, onFrame, badge, overlay, subject = 'you', checkIdentity = true, onProgress, onComplete, onUnavailable }: VisionShellProps<Model>) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const camera = useCamera(videoRef)
  const identity = useIdentityWatch(videoRef, camera === 'live' && checkIdentity)
  const [hint, setHint] = useState('Getting ready…')
  const [good, setGood] = useState(false)
  const [detected, setDetected] = useState(false)
  const [fps, setFps] = useState(0)
  const s = useRef({ hint: '', good: false, detected: false, lastProgress: -1, done: false, frames: 0, since: performance.now() })
  const identityRef = useRef(identity)
  identityRef.current = identity

  const { status, retry } = useVisionLoop(videoRef, camera === 'live', load, (model, video, info) => {
    const st = s.current
    if (st.done) return
    const canvas = canvasRef.current
    if (canvas && video.videoWidth && canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }
    // Always run the model so the overlay + "being read" status stay live…
    const v = onFrame(model, video, info, canvas)
    const seen = v.detected ?? v.good
    if (seen !== st.detected) setDetected((st.detected = seen))

    // frames-per-second readout (proves the camera is being processed)
    st.frames++
    if (info.now - st.since > 1000) {
      setFps(Math.round((st.frames * 1000) / (info.now - st.since)))
      st.frames = 0
      st.since = info.now
    }

    // …but a clearly different person can't earn progress.
    if (identityRef.current === 'stranger') {
      const text = '🚨 That is not the registered face — progress paused'
      if (st.hint !== text) setHint((st.hint = text))
      if (st.good) setGood((st.good = false))
      return
    }
    if (v.hint !== st.hint) setHint((st.hint = v.hint))
    if (v.good !== st.good) setGood((st.good = v.good))
    const p = Math.min(1, Math.max(0, v.progress))
    if (Math.abs(p - st.lastProgress) >= 0.01 || (p === 1 && st.lastProgress !== 1)) {
      st.lastProgress = p
      onProgress(p)
    }
    if (v.done) {
      st.done = true
      onComplete()
    }
  })

  const failure =
    camera === 'denied'
      ? 'Camera permission was denied.'
      : camera === 'unavailable'
        ? 'No camera found on this device.'
        : status === 'error'
          ? 'The vision model could not load on this device.'
          : null

  if (failure) {
    return (
      <div className="glass rounded-3xl p-5 text-center" role="alert">
        <p className="font-display text-3xl tracking-wide text-gold">Camera offline!</p>
        <p className="mt-2">{failure}</p>
        <p className="mt-1 text-sm text-white/70">Allow camera access in your browser settings and reopen the app, or swap this mission for a harder one. Skipping is not an option.</p>
        {onUnavailable && (
          <Button className="mt-4" variant="secondary" onClick={() => onUnavailable(failure)}>
            Swap for 5 hard ciphers
          </Button>
        )}
      </div>
    )
  }

  const loading = camera === 'starting' || status === 'loading' || status === 'slow'
  const stranger = identity === 'stranger'
  const reading = !loading && detected && !stranger
  const idInfo = checkIdentity ? ID_TEXT[identity] : null

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {/* live "am I being read?" panel */}
      <div className="flex w-full flex-wrap items-center justify-center gap-1.5" aria-live="polite">
        <Chip tone={camera === 'live' ? 'ok' : 'wait'} icon="📷" text={camera === 'live' ? `Camera on${fps ? ` · ${fps} fps` : ''}` : 'Camera starting…'} />
        <Chip tone={loading ? 'wait' : detected ? 'ok' : 'bad'} icon={detected ? '🟢' : '🔴'} text={loading ? 'Loading tracker…' : detected ? `Reading your ${subject}` : `No ${subject} detected`} />
        {idInfo && <Chip tone={idInfo.tone} icon="🪪" text={idInfo.text} />}
      </div>

      <motion.div
        className={cn(
          'relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] border-4 bg-black transition-colors duration-300 sm:aspect-[4/3]',
          stranger ? 'border-red-500' : good ? 'border-emerald-400' : reading ? 'border-amber-400' : 'border-red-500/70',
        )}
        animate={{
          boxShadow: stranger || (!loading && !detected)
            ? '0 0 34px rgba(239,68,68,0.55)'
            : good
              ? '0 0 34px rgba(52,211,153,0.6)'
              : '0 0 24px rgba(245,158,11,0.45)',
          x: stranger ? [0, -8, 8, -6, 6, 0] : 0,
        }}
        transition={{ boxShadow: { duration: 0.3 }, x: { duration: 0.4, repeat: stranger ? Infinity : 0, repeatDelay: 0.6 } }}
      >
        <video ref={videoRef} playsInline muted autoPlay className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-amber-300/20 to-transparent"
          animate={{ top: ['-10%', '100%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        />
        {badge && <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 font-display tracking-wide text-black shadow-lg">{badge}</span>}

        {/* big status pill */}
        {!loading && (
          <motion.span
            key={stranger ? 's' : good ? 'g' : detected ? 'd' : 'n'}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              'absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold shadow-lg',
              stranger ? 'bg-red-600 text-white' : good ? 'bg-emerald-500 text-black' : detected ? 'bg-amber-400 text-black' : 'bg-red-600 text-white',
            )}
          >
            {stranger ? '✖ NOT YOU' : good ? '✔ COUNTING' : detected ? '● READING' : '✖ NOT SEEN'}
          </motion.span>
        )}

        {overlay}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center bg-black/85 text-center">
              <div>
                <motion.div className="mx-auto size-14 rounded-full border-4 border-amber-400 border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
                <p className="mt-3 font-display text-2xl tracking-wide">{camera === 'starting' ? 'Opening the camera…' : 'Calibrating the scanner…'}</p>
                <p className="px-6 text-xs text-white/60">{status === 'slow' ? 'Still downloading the on-device scanner (~18 MB, first time only). Keep the app open on Wi-Fi.' : 'First time can take a few seconds on phones'}</p>
                {status === 'slow' && (
                  <div className="pointer-events-auto mt-3 flex justify-center gap-2">
                    <button type="button" onClick={retry} className="rounded-full bg-amber-400 px-4 py-1.5 text-sm font-bold text-black">
                      ↻ Retry
                    </button>
                    {onUnavailable && (
                      <button type="button" onClick={() => onUnavailable('Scanner took too long to load')} className="rounded-full border border-white/40 px-4 py-1.5 text-sm font-bold">
                        Swap for ciphers
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold">🔒 On-device · nothing recorded</span>
      </motion.div>
      <AnimatePresence mode="popLayout">
        <motion.p
          key={hint}
          initial={{ y: 12, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -12, opacity: 0 }}
          aria-live="polite"
          className={cn('text-center font-display text-2xl tracking-wide', stranger ? 'text-red-400' : good ? 'text-emerald-300' : 'text-white')}
        >
          {hint}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
