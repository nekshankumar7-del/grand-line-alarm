import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { ConfettiBurst } from '@/components/effects/ConfettiBurst'
import { ImpactText } from '@/components/fx/ImpactText'
import { SentinelHero } from '@/editions/sentinel/SentinelHero'
import { useInstallStore } from '@/store/installStore'

const VISIBLE_MS = 3200

export function InstallCelebration() {
  const active = useInstallStore((s) => s.justInstalled)
  const clear = useInstallStore((s) => s.clearCelebration)

  useEffect(() => {
    if (!active) return
    const id = window.setTimeout(clear, VISIBLE_MS)
    return () => window.clearTimeout(id)
  }, [active, clear])

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          role="status"
          className="fixed inset-0 z-50 grid place-items-center bg-ink/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={clear}
        >
          <ConfettiBurst />
          <div className="relative flex flex-col items-center gap-4 text-center">
            <SentinelHero mood="cheer" className="h-56 w-36" />
            <ImpactText text="ALL ABOARD!" className="text-6xl" />
            <p className="text-lg font-semibold">Night Sentinel is installed.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
