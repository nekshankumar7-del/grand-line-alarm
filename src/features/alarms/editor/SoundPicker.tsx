import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { alarmSound } from '@/audio/alarmSound'
import { ringtonesFor, type RingtoneId } from '@/audio/ringtones'
import { useEdition } from '@/editions/useEdition'
import { cn } from '@/lib/cn'
import { spring } from '@/motion/tokens'

function Equalizer({ playing }: { playing: boolean }) {
  return (
    <span className="flex h-5 items-end gap-0.5" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full bg-current"
          animate={playing ? { height: ['20%', '100%', '40%', '80%', '20%'] } : { height: '25%' }}
          transition={playing ? { duration: 0.8, repeat: Infinity, delay: i * 0.12 } : spring.snappy}
        />
      ))}
    </span>
  )
}

export function SoundPicker({ value, onChange }: { value: RingtoneId; onChange(id: RingtoneId): void }) {
  const edition = useEdition().id
  const [playing, setPlaying] = useState<RingtoneId | null>(null)

  useEffect(() => {
    if (!playing) return
    const id = window.setTimeout(() => setPlaying(null), 3200)
    return () => window.clearTimeout(id)
  }, [playing])

  useEffect(() => () => alarmSound.stopPreview(), [])

  function pick(id: RingtoneId) {
    onChange(id)
    alarmSound.preview(id)
    setPlaying(id)
  }

  return (
    <div role="radiogroup" aria-label="Alarm sound" className="grid grid-cols-2 gap-2.5">
      {ringtonesFor(edition).map((tone) => {
        const selected = tone.id === value
        return (
          <motion.button
            key={tone.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => pick(tone.id)}
            whileTap={{ scale: 0.94 }}
            whileHover={{ y: -3 }}
            className={cn('relative overflow-hidden rounded-2xl p-3 text-left', selected ? 'text-ink' : 'glass text-white')}
          >
            {selected && <motion.span layoutId="sound-pick" transition={spring.snappy} className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold to-sand" />}
            <span className="relative flex items-center justify-between">
              <span className="text-2xl">{tone.icon}</span>
              <Equalizer playing={playing === tone.id} />
            </span>
            <span className="relative mt-1 block font-display text-xl leading-tight tracking-wide">{tone.name}</span>
            <span className={cn('relative block text-xs', selected ? 'text-ink/70' : 'text-white/65')}>{tone.vibe}</span>
            {selected && <span className="relative mt-1 inline-block rounded-full bg-ink px-2 py-0.5 text-[10px] font-extrabold text-gold">SELECTED</span>}
          </motion.button>
        )
      })}
    </div>
  )
}
