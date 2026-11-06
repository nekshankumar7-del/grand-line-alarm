import { useMissionLabel } from '@/editions/useEdition'
import { AnimatePresence, motion, Reorder, useDragControls } from 'motion/react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { warmVisionAssets } from '@/features/vision/visionTasks'
import { MAX_MISSIONS, MISSION_LIST, MISSIONS } from '@/features/missions/registry'
import type { MissionType } from '@/features/missions/types'
import { cn } from '@/lib/cn'
import { spring } from '@/motion/tokens'
import { createMission } from '../actions'
import type { MissionEntry } from '../types'

function MissionRow({ entry, index, onChange, onRemove }: { entry: MissionEntry; index: number; onChange(e: MissionEntry): void; onRemove(): void }) {
  const lbl = useMissionLabel()
  const def = MISSIONS[entry.type]
  const [open, setOpen] = useState(false)
  const controls = useDragControls()
  const { ConfigEditor } = def

  return (
    <Reorder.Item
      value={entry}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
      whileDrag={{ scale: 1.04, rotate: -1.5, boxShadow: '0 12px 0 var(--c-ink)' }}
      className="paper-grain list-none rounded-2xl border-[3px] border-ink text-ink hard-shadow"
    >
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          aria-label="Drag to reorder"
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab touch-none px-1 text-2xl text-ink/50 active:cursor-grabbing"
        >
          ⠿
        </button>
        <span className="grid size-10 place-items-center rounded-xl border-2 border-ink bg-white text-2xl">{lbl(def).icon}</span>
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left" aria-expanded={open}>
          <span className="block font-display text-xl leading-tight tracking-wide">
            {index + 1}. {lbl(def).name}
            {def.needsCamera && <span className="ml-2 align-middle text-xs font-extrabold text-accent">📷 CAMERA</span>}
          </span>
          <span className="block text-sm opacity-70">{def.summary(entry.config)} · tap to tweak</span>
        </button>
        <button type="button" aria-label={`Remove ${lbl(def).name}`} onClick={onRemove} className="px-2 text-2xl text-accent">
          ✕
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t-2 border-dashed border-ink/30 p-3">
              <ConfigEditor value={entry.config} onChange={(config) => onChange({ ...entry, config })} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  )
}

export function MissionBuilder({ missions, onChange }: { missions: MissionEntry[]; onChange(m: MissionEntry[]): void }) {
  const lbl = useMissionLabel()
  const [picking, setPicking] = useState(false)
  const full = missions.length >= MAX_MISSIONS

  function add(type: MissionType) {
    const model = MISSIONS[type].visionModel
    if (model) warmVisionAssets(model)
    onChange([...missions, createMission(type)])
    setPicking(false)
  }

  return (
    <div className="space-y-3">
      <Reorder.Group axis="y" values={missions} onReorder={onChange} className="space-y-3">
        <AnimatePresence initial={false}>
          {missions.map((entry, i) => (
            <MissionRow
              key={entry.uid}
              entry={entry}
              index={i}
              onChange={(next) => onChange(missions.map((m) => (m.uid === next.uid ? next : m)))}
              onRemove={() => onChange(missions.filter((m) => m.uid !== entry.uid))}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>
      {missions.length === 0 && <p className="text-center font-bold text-gold">Add at least one trial — otherwise anyone could stop the alarm!</p>}
      <Button variant="secondary" className="w-full" disabled={full} onClick={() => setPicking(true)}>
        {full ? `Max ${MAX_MISSIONS} trials` : '＋ Add a trial'}
      </Button>

      <Sheet open={picking} title="Choose a trial" onClose={() => setPicking(false)}>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {MISSION_LIST.map((def, i) => (
            <motion.button
              key={def.id}
              type="button"
              onClick={() => add(def.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { ...spring.bouncy, delay: i * 0.05 } }}
              whileHover={{ y: -4, rotate: -1 }}
              whileTap={{ scale: 0.95 }}
              className={cn('rounded-2xl border-[3px] border-ink bg-white p-4 text-left hard-shadow')}
            >
              <span className="text-4xl">{lbl(def).icon}</span>
              <span className="mt-1 block font-display text-2xl tracking-wide">{lbl(def).name}</span>
              <span className="block text-sm opacity-75">{def.description}</span>
              <span className={cn('mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-extrabold', def.needsCamera ? 'bg-accent text-white' : 'bg-sea text-white')}>
                {def.needsCamera ? '📷 Camera · on-device' : 'No camera'}
              </span>
            </motion.button>
          ))}
        </div>
        <p className="mt-4 text-sm opacity-70">More trials (jumping jacks, rock-paper-scissors, QR scan…) are on the way.</p>
      </Sheet>
    </div>
  )
}
