import { AnimatePresence, motion } from 'motion/react'
import { spring } from '@/motion/tokens'
import { useInstallStore } from '@/store/installStore'
import { DownloadButton } from './DownloadButton'

export function InstallBanner() {
  const standalone = useInstallStore((s) => s.standalone)
  const dismissed = useInstallStore((s) => s.bannerDismissed)
  const dismiss = useInstallStore((s) => s.dismissBanner)
  const visible = !standalone && !dismissed

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          aria-label="Install app"
          className="paper-grain fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border-[3px] border-ink p-3 text-ink hard-shadow lg:inset-x-auto lg:bottom-6 lg:left-6 lg:mx-0"
          initial={{ y: 160, rotate: -2 }}
          animate={{ y: 0, rotate: 0 }}
          exit={{ y: 160, opacity: 0 }}
          transition={{ ...spring.bouncy, delay: 0.8 }}
        >
          <span className="text-3xl" aria-hidden>
            🔔
          </span>
          <p className="flex-1 text-sm font-semibold leading-snug">
            Install the app so your alarms ring more reliably.
          </p>
          <DownloadButton size="sm" />
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install banner"
            className="grid size-8 place-items-center rounded-full text-xl hover:bg-ink/10"
          >
            ×
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
