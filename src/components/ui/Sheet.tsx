import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { spring } from '@/motion/tokens'

interface SheetProps {
  open: boolean
  title: string
  onClose(): void
  children: ReactNode
}

/**
 * Mobile-first bottom sheet.
 * Only the handle/title bar drags the sheet (swipe down to close); the body scrolls normally,
 * so long lists (e.g. the mission picker) scroll with a finger on phones.
 */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  const controls = useDragControls()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // Lock the page behind the sheet so scrolling stays inside it.
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
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
          className="paper-grain fixed inset-x-0 bottom-0 z-[80] mx-auto flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-3xl border-x-0 border-t-4 border-black text-[#0b0f19] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] sm:border-x-4"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={spring.snappy}
          drag="y"
          dragListener={false}
          dragControls={controls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100 || info.velocity.y > 600) onClose()
          }}
        >
          {/* drag handle + title (the only part that drags the sheet) */}
          <div className="shrink-0 cursor-grab touch-none px-5 pt-3 active:cursor-grabbing" onPointerDown={(e) => controls.start(e)}>
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-black/30" />
            <div className="flex items-center justify-between gap-3 pb-2">
              <h2 className="font-display text-3xl tracking-wide">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-black/10 text-xl">
                ×
              </button>
            </div>
          </div>
          {/* scrollable body */}
          <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch]">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
