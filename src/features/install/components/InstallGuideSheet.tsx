import { motion } from 'motion/react'
import { Sheet } from '@/components/ui/Sheet'
import { fadeUp, staggerContainer } from '@/motion/variants'
import { GUIDES, type GuideKind } from '../data/guideSteps'

interface InstallGuideSheetProps {
  kind: GuideKind | null
  onClose(): void
}

export function InstallGuideSheet({ kind, onClose }: InstallGuideSheetProps) {
  const guide = GUIDES[kind ?? 'manual']

  return (
    <Sheet open={kind !== null} title={guide.title} onClose={onClose}>
      <p className="mt-1 text-ink/80">{guide.intro}</p>
      <motion.ol
        className="mt-5 space-y-3"
        variants={staggerContainer(0.15, 0.2)}
        initial="hidden"
        animate="show"
      >
        {guide.steps.map((step, i) => (
          <motion.li
            key={step.text}
            variants={fadeUp}
            className="flex items-center gap-4 rounded-2xl border-[3px] border-ink bg-white/70 p-3"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent font-display text-xl text-white">
              {i + 1}
            </span>
            <span className="text-2xl" aria-hidden>
              {step.icon}
            </span>
            <span className="font-semibold">{step.text}</span>
          </motion.li>
        ))}
      </motion.ol>
      {kind === 'ios' && (
        <motion.p
          aria-hidden
          className="mt-6 text-center text-4xl"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          👇
        </motion.p>
      )}
    </Sheet>
  )
}
