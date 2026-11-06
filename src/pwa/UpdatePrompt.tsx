import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { Sheet } from '@/components/ui/Sheet'
import { APP_VERSION, CHANGELOG, compareVersions } from '@/config/version'
import { SentinelEmblem } from '@/editions/sentinel/SentinelEmblem'
import { spring } from '@/motion/tokens'
import { useUpdateStore } from '@/store/updateStore'

const SNOOZE_MS = 6 * 60 * 60_000
const SEEN_KEY = 'ns-last-version'
const SITE = 'https://grand-line-alarm.vercel.app'

/** "New version available" card + one-time "What's new" sheet after an update. */
export function UpdatePrompt() {
  const { pathname } = useLocation()
  const { ready, apply, nativeLatest, dismissedAt, dismiss } = useUpdateStore()
  const [updating, setUpdating] = useState(false)
  const [whatsNew, setWhatsNew] = useState<typeof CHANGELOG>([])

  // Just updated? Show what changed since the last version this device saw.
  useEffect(() => {
    try {
      const last = localStorage.getItem(SEEN_KEY)
      if (last && compareVersions(APP_VERSION, last) > 0) setWhatsNew(CHANGELOG.filter((c) => compareVersions(c.version, last) > 0))
      localStorage.setItem(SEEN_KEY, APP_VERSION)
    } catch {
      /* ignore */
    }
  }, [])

  const alarmActive = pathname === '/app/ring' || pathname === '/app/trial'
  const snoozed = Date.now() - dismissedAt < SNOOZE_MS
  const show = !alarmActive && !snoozed && (ready || Boolean(nativeLatest))

  async function update() {
    if (nativeLatest) {
      window.open(`${SITE}/#download`, '_blank')
      return
    }
    setUpdating(true)
    try {
      await apply?.()
    } finally {
      window.setTimeout(() => location.reload(), 1500) // fallback if the new worker didn't reload us
    }
  }

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.aside
            role="status"
            aria-live="polite"
            initial={{ y: 140, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 140, opacity: 0 }}
            transition={spring.snappy}
            className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[75] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-amber-400/50 bg-[#0b0f19]/95 p-3 text-white shadow-2xl lg:bottom-6"
          >
            <motion.span animate={{ rotate: updating ? 360 : 0 }} transition={{ duration: 1, repeat: updating ? Infinity : 0, ease: 'linear' }} className="shrink-0">
              <SentinelEmblem color="#f59e0b" className="size-9" />
            </motion.span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl leading-tight tracking-wide text-amber-300">{nativeLatest ? `Version ${nativeLatest} is out` : 'New version available'}</p>
              <p className="text-xs text-white/70">{nativeLatest ? 'Download the new Android app to update.' : 'Update now to get the latest fixes and features.'}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <button type="button" disabled={updating} onClick={() => void update()} className="rounded-full bg-amber-400 px-3 py-1.5 text-sm font-bold text-black disabled:opacity-70">
                {updating ? 'Updating…' : nativeLatest ? 'Download' : 'Update now'}
              </button>
              {!updating && (
                <button type="button" onClick={dismiss} className="text-[11px] font-bold text-white/60">
                  Later
                </button>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <Sheet open={whatsNew.length > 0 && !alarmActive} title={`What’s new in v${APP_VERSION}`} onClose={() => setWhatsNew([])}>
        <div className="space-y-4 pb-2">
          {whatsNew.map((c) => (
            <section key={c.version}>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] opacity-60">
                v{c.version} · {c.date}
              </p>
              <ul className="mt-1 space-y-1">
                {c.notes.map((n) => (
                  <li key={n} className="flex gap-2 text-sm">
                    <span className="text-amber-600">✦</span>
                    {n}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <button type="button" onClick={() => setWhatsNew([])} className="w-full rounded-2xl border-2 border-black bg-amber-400 py-3 font-display text-2xl tracking-wide">
            Got it
          </button>
        </div>
      </Sheet>
    </>
  )
}
