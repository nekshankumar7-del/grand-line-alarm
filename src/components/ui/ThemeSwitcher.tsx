import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { spring } from '@/motion/tokens'
import { THEMES, useThemeStore } from '@/store/themeStore'

/** City mood menu with live gradient previews. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme)
  const list = THEMES
  const setTheme = useThemeStore((s) => s.setTheme)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = list.find((t) => t.id === theme) ?? list[0]

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <motion.button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.92 }}
        className="glass flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 sm:pr-4"
      >
        <span className="grid size-9 place-items-center rounded-full border-2 border-white/60 text-lg" style={{ background: current.preview }}>
          {current.icon}
        </span>
        <span className="hidden font-display text-lg tracking-wide sm:inline">{current.label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-xs">
          ▼
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="radiogroup"
            aria-label="Theme"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={spring.snappy}
            className="glass absolute right-0 top-full z-50 mt-2 grid w-[min(19rem,calc(100vw-2rem))] grid-cols-2 gap-2 rounded-3xl bg-sea-deep/70 p-3"
          >
            {list.map((t, i) => {
              const selected = t.id === theme
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTheme(t.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn('relative overflow-hidden rounded-2xl border-2 p-2 text-left', selected ? 'border-gold' : 'border-white/20')}
                >
                  <span className="block h-14 rounded-xl" style={{ background: t.preview }}>
                    <span className="grid h-full place-items-center text-2xl drop-shadow">{t.icon}</span>
                  </span>
                  <span className="mt-1 block font-display text-lg leading-tight tracking-wide">{t.label}</span>
                  <span className="block text-[11px] leading-tight text-white/70">{t.blurb}</span>
                  {selected && (
                    <motion.span layoutId="theme-check" className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-gold text-xs font-bold text-ink">
                      ✓
                    </motion.span>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
