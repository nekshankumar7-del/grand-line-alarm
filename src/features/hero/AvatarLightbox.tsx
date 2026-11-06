import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { useProfile } from '@/features/faceid/useProfile'
import { cn } from '@/lib/cn'
import { spring } from '@/motion/tokens'
import { usePlayerStore, type AvatarMode } from '@/store/playerStore'
import { exportRoundImage, exportSvg, safeFileName } from './avatarExport'
import { PlayerAvatar } from './PlayerAvatar'

const MODES: Array<{ v: AvatarMode; label: string }> = [
  { v: 'toon', label: '🎨 Toon' },
  { v: 'photo', label: '📷 Photo' },
  { v: 'sentinel', label: '🦸 Sentinel form' },
]

/** Full-screen zoomed view of the player's avatar, with mode switch and PNG download. */
export function AvatarLightbox({ open, onClose }: { open: boolean; onClose(): void }) {
  const profile = useProfile()
  const { name, title, avatarMode, setProfile } = usePlayerStore()
  const [saved, setSaved] = useState(false)
  const [mode, setMode] = useState<AvatarMode>(avatarMode)
  const [busy, setBusy] = useState(false)
  const stage = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setMode(avatarMode)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, avatarMode, onClose])

  const available = (m: AvatarMode) => (m === 'toon' ? Boolean(profile?.toon) : Boolean(profile?.photo))

  function useThis() {
    setProfile({ avatarMode: mode })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }

  async function download() {
    setBusy(true)
    try {
      const file = `${safeFileName(name)}-${mode}.png`
      const aura = '#1e293b'
      if (mode === 'toon' && profile?.toon) await exportRoundImage(profile.toon, aura, file)
      else if (mode === 'photo' && profile?.photo) await exportRoundImage(profile.photo, aura, file)
      else if (mode === 'sentinel') {
        const svg = stage.current?.querySelector('svg[data-suit]') as SVGSVGElement | null
        if (svg) await exportSvg(svg, file)
      }

    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Your avatar"
          className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-ink/80 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="flex w-full max-w-lg flex-col items-center gap-4 text-center"
            initial={{ scale: 0.3, y: 80, rotate: -8 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.3, y: 80, opacity: 0 }}
            transition={spring.bouncy}
            onClick={(e) => e.stopPropagation()}
          >
            <div ref={stage} className="relative aspect-square w-[min(80vmin,28rem)]">
              <AnimatePresence mode="wait">
                <motion.div key={mode} className="h-full w-full" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }} transition={{ duration: 0.3 }}>
                  <PlayerAvatar mode={mode} className="h-full w-full" />
                </motion.div>
              </AnimatePresence>
            </div>

            <div>
              <p className="font-display text-4xl tracking-wide text-outline manga-shadow">{name || 'Sentinel'}</p>
              <p className="font-bold uppercase tracking-widest text-gold">{title}</p>
            </div>

            <div className="glass flex gap-1 rounded-full p-1" role="radiogroup" aria-label="Avatar style">
              {MODES.map((m) => (
                <button
                  key={m.v}
                  type="button"
                  role="radio"
                  aria-checked={mode === m.v}
                  disabled={!available(m.v)}
                  onClick={() => setMode(m.v)}
                  className={cn('relative rounded-full px-4 py-1.5 text-sm font-bold disabled:opacity-40', mode === m.v ? 'text-ink' : 'text-white')}
                >
                  {mode === m.v && <motion.span layoutId="lightbox-mode" transition={spring.snappy} className="absolute inset-0 rounded-full bg-gold" />}
                  <span className="relative">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="flex w-full max-w-sm gap-3">
              <Button variant="secondary" className="flex-1" onClick={useThis} disabled={!available(mode)}>
                {saved ? '✔ Saved' : mode === avatarMode ? '✔ In use' : 'Use this picture'}
              </Button>
              <Button className="flex-1" disabled={busy || !available(mode)} onClick={() => void download()}>
                {busy ? 'Saving…' : '⬇ Download PNG'}
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
            <p className="text-xs text-white/60">“Use this picture” sets your case-file picture · downloads are saved straight to your device — nothing is uploaded.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
