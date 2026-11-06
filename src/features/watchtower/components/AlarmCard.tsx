import { useMissionLabel } from '@/editions/useEdition'
import { motion, useMotionValue, useTransform } from 'motion/react'
import { useNavigate } from 'react-router'
import { Toggle } from '@/components/ui/Toggle'
import { db } from '@/db/db'
import { describeDays, formatTime } from '@/features/alarms/format'
import type { Alarm } from '@/features/alarms/types'
import { SentinelHero } from '@/editions/sentinel/SentinelHero'
import { MISSIONS } from '@/features/missions/registry'
import { cn } from '@/lib/cn'

const DELETE_AT = -110

export function AlarmCard({ alarm, onDelete }: { alarm: Alarm; onDelete(alarm: Alarm): void }) {
  const lbl = useMissionLabel()
  const navigate = useNavigate()
  const x = useMotionValue(0)
  const revealOpacity = useTransform(x, [0, DELETE_AT], [0, 1])

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 20, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0, x: -300, transition: { duration: 0.25 } }}
      className="relative list-none"
    >
      <motion.div
        style={{ opacity: revealOpacity }}
        aria-hidden
        className="absolute inset-0 flex items-center justify-end rounded-3xl bg-accent pr-6 font-display text-2xl tracking-wide"
      >
        🗑 Scuttle
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.7, right: 0.05 }}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x < DELETE_AT) onDelete(alarm)
        }}
        onTap={() => navigate(`/app/alarms/${alarm.id}`)}
        whileHover={{ rotate: -0.6, y: -2 }}
        className={cn(
          'paper-grain relative flex cursor-pointer items-center gap-3 rounded-3xl border-[3px] border-ink p-3 text-ink hard-shadow transition-[filter]',
          !alarm.enabled && 'grayscale-[0.8]',
        )}
      >
        <div className="size-16 shrink-0 rounded-2xl border-2 border-ink bg-sand/70 p-1">
          <SentinelHero className="h-full w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('font-display text-5xl leading-none tabular-nums tracking-wide', !alarm.enabled && 'opacity-50')}>
            {formatTime(alarm.hour, alarm.minute)}
          </p>
          <p className="truncate text-sm font-bold">
            {alarm.label} · <span className="opacity-70">{describeDays(alarm.days)}</span>
          </p>
          <p className="mt-0.5 text-lg" aria-label={`${alarm.missions.length} trials`}>
            {alarm.missions.map((m) => (
              <span key={m.uid} title={lbl(MISSIONS[m.type]).name}>
                {lbl(MISSIONS[m.type]).icon}
              </span>
            ))}
          </p>
        </div>
        <Toggle
          label={`${alarm.enabled ? 'Disable' : 'Enable'} ${formatTime(alarm.hour, alarm.minute)} alarm`}
          checked={alarm.enabled}
          onChange={(enabled) => void db.alarms.update(alarm.id, { enabled, armedAt: Date.now() })}
        />
      </motion.div>
    </motion.li>
  )
}
