import { AnimatePresence, motion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { spring } from '@/motion/tokens'

interface SheetProps {
  open: boolean
  title: string
  onClose(): void
  children: ReactNode
}

export function Sheet({ open, title, onClose, children }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}
      {open && (
        <motion.div
          key="sheet"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="paper-grain fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85dvh] max-w-lg overflow-y-auto rounded-t-3xl border-4 border-b-0 border-ink p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-ink"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={spring.snappy}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 120) onClose()
          }}
        >
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink/30" />
          <h2 className="font-display text-3xl tracking-wide">{title}</h2>
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
