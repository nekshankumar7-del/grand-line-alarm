import { motion } from 'motion/react'
import { createPortal } from 'react-dom'
import { formatCountdown, formatTime } from '@/features/alarms/format'
import { useTicker } from '@/hooks/useTicker'
import { useWakeLock } from '@/hooks/useWakeLock'

/** Dim bedside clock that keeps the screen awake so the alarm can ring in the browser. */
export function BedsideOverlay({ next, onClose }: { next: { at: Date; label: string } | null; onClose(): void }) {
  useTicker(1000)
  useWakeLock(true)
  const now = new Date()

  return createPortal(
    <motion.div
      role="dialog"
      aria-label="Bedside mode"
      className="fixed inset-0 z-50 grid cursor-pointer place-items-center bg-black text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onDoubleClick={onClose}
    >
      <div className="opacity-60">
        <p className="font-display text-[22vw] leading-none tabular-nums text-sea md:text-[12rem]">{formatTime(now.getHours(), now.getMinutes())}</p>
        {next ? (
          <p className="mt-4 text-lg text-white/60">
            ⏰ {next.label} at {formatTime(next.at.getHours(), next.at.getMinutes())} — in {formatCountdown(next.at.getTime() - now.getTime())}
          </p>
        ) : (
          <p className="mt-4 text-lg text-white/60">No alarms set</p>
        )}
        <p className="mt-8 text-sm text-white/40">Leave this screen open and plugged in. Double-tap to exit.</p>
        <button type="button" onClick={onClose} className="mt-3 text-sm text-white/40 underline">
          Exit bedside mode
        </button>
      </div>
    </motion.div>,
    document.body,
  )
}
