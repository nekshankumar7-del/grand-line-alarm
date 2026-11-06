import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { useCamera } from './useCamera'
import { useIdentityWatch, type IdentityStatus } from './useIdentityWatch'
import { useVisionLoop, type FrameInfo } from './useVisionLoop'

export interface Verdict {
  hint: string
  good: boolean
  progress: number
  done: boolean
}

interface VisionShellProps<Model> {
  load: () => Promise<Model>
  onFrame(model: Model, video: HTMLVideoElement, info: FrameInfo, canvas: HTMLCanvasElement | null): Verdict
  badge?: string
  overlay?: ReactNode
  /** Continuously verify the registered face (default on). */
  checkIdentity?: boolean
  onProgress(p: number): void
  onComplete(): void
  onUnavailable?(reason: string): void
}

const IDENTITY_CHIP: Record<IdentityStatus, { text: string; cls: string } | null> = {
  off: null,
  loading: { text: '🪪 Loading ID…', cls: 'bg-ink/70' },
  checking: { text: '🪪 Checking ID…', cls: 'bg-ink/70' },
  match: { text: '✅ Identity verified', cls: 'bg-emerald-600' },
  stranger: { text: '🚨 Stranger!', cls: 'bg-accent' },
}

export function VisionShell<Model>({ load, onFrame, badge, overlay, checkIdentity = true, onProgress, onComplete, onUnavailable }: VisionShellProps<Model>) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const camera = useCamera(videoRef)
  const identity = useIdentityWatch(videoRef, camera === 'live' && checkIdentity)
  const [hint, setHint] = useState('Getting ready…')
  const [good, setGood] = useState(false)
  const s = useRef({ hint: '', good: false, lastProgress: -1, done: false })
  const identityRef = useRef(identity)
  identityRef.current = identity

  const status = useVisionLoop(videoRef, camera === 'live', load, (model, video, info) => {
    const st = s.current
    if (st.done) return
    if (identityRef.current === 'stranger') {
      const text = '🚨 Stranger detected — only the registered user may do this!'
      if (st.hint !== text) setHint((st.hint = text))
      if (st.good) setGood((st.good = false))
      return
    }
    const canvas = canvasRef.current
    if (canvas && video.videoWidth && canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }
    const v = onFrame(model, video, info, canvas)
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
        <p className="mt-1 text-sm text-white/70">Allow camera access in your browser settings and reopen the app, or swap this trial for a harder one. Skipping is not an option.</p>
        {onUnavailable && (
          <Button className="mt-4" variant="secondary" onClick={() => onUnavailable(failure)}>
            Swap for 5 hard ciphers
          </Button>
        )}
      </div>
    )
  }

  const chip = checkIdentity ? IDENTITY_CHIP[identity] : null
  const stranger = identity === 'stranger'

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <motion.div
        className={cn(
          'relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border-4 bg-ink shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] transition-colors duration-300',
          stranger ? 'border-accent' : good ? 'border-gold' : 'border-white/30',
        )}
        animate={stranger ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.4, repeat: stranger ? Infinity : 0, repeatDelay: 0.6 }}
      >
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
        {/* animated scan line */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-gold/25 to-transparent"
          animate={{ top: ['-10%', '100%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        />
        {/* corner brackets */}
        {['left-3 top-3 border-l-4 border-t-4', 'right-3 top-3 border-r-4 border-t-4', 'bottom-3 left-3 border-b-4 border-l-4', 'bottom-3 right-3 border-b-4 border-r-4'].map((c) => (
          <span key={c} aria-hidden className={cn('absolute size-8 rounded-sm transition-colors', c, good ? 'border-gold' : 'border-white/60')} />
        ))}
        {badge && <span className="absolute left-5 top-5 rounded-full border-2 border-ink bg-gold px-3 py-1 font-display tracking-wide text-ink shadow-lg">{badge}</span>}
        {chip && <span className={cn('absolute right-5 top-5 rounded-full px-3 py-1 text-xs font-extrabold text-white shadow-lg', chip.cls)}>{chip.text}</span>}
        {overlay}
        <AnimatePresence>
          {(camera === 'starting' || status === 'loading') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center bg-ink/85 text-center">
              <div>
                <motion.div className="mx-auto size-14 rounded-full border-4 border-gold border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
                <p className="mt-3 font-display text-2xl tracking-wide">Calibrating the scanner…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <span className="absolute bottom-5 right-5 rounded-full bg-ink/70 px-2 py-0.5 text-[11px] font-bold">🔒 On-device · nothing recorded</span>
      </motion.div>
      <AnimatePresence mode="popLayout">
        <motion.p
          key={hint}
          initial={{ y: 12, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -12, opacity: 0 }}
          aria-live="polite"
          className={cn('text-center font-display text-2xl tracking-wide', stranger ? 'text-accent' : good ? 'text-gold' : 'text-white')}
        >
          {hint}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
