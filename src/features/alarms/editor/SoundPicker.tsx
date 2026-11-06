import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { alarmSound, CUSTOM_PREFIX } from '@/audio/alarmSound'
import { ringtonesFor } from '@/audio/ringtones'
import { db } from '@/db/db'
import { cn } from '@/lib/cn'
import { spring } from '@/motion/tokens'

const MAX_BYTES = 15 * 1024 * 1024

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

interface SoundPickerProps {
  /** Built-in ringtone id or `custom:<id>` for a sound from the device. */
  value: string
  onChange(id: string): void
}

export function SoundPicker({ value, onChange }: SoundPickerProps) {
  const [playing, setPlaying] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const custom = useLiveQuery(() => db.sounds.orderBy('createdAt').reverse().toArray(), [])

  useEffect(() => {
    if (!playing) return
    const id = window.setTimeout(() => setPlaying(null), 4500)
    return () => window.clearTimeout(id)
  }, [playing])

  useEffect(() => () => alarmSound.stopPreview(), [])

  function pick(id: string) {
    onChange(id)
    alarmSound.preview(id)
    setPlaying(id)
  }

  async function addFromDevice(file: File | undefined) {
    setError(null)
    if (!file) return
    if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|webm)$/i.test(file.name)) {
      setError('That file isn’t an audio file.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('That file is too large (max 15 MB). Try a shorter clip.')
      return
    }
    setBusy(true)
    try {
      // Make sure it actually decodes before saving it as an alarm sound.
      const ctx = new AudioContext()
      await ctx.decodeAudioData(await file.arrayBuffer())
      void ctx.close()
      const id = crypto.randomUUID()
      await db.sounds.put({ id, name: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'My sound', blob: file, createdAt: Date.now() })
      pick(`${CUSTOM_PREFIX}${id}`)
    } catch {
      setError('This audio format can’t be played on this device. Try an MP3 or M4A file.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function remove(id: string) {
    await db.sounds.delete(id)
    alarmSound.forget(id)
    if (value === `${CUSTOM_PREFIX}${id}`) onChange(ringtonesFor()[1]?.id ?? 'clocktower')
  }

  const card = (selected: boolean) => cn('relative overflow-hidden rounded-2xl p-3 text-left', selected ? 'text-black' : 'glass text-white')

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Alarm sound" className="grid grid-cols-2 gap-2.5">
        {ringtonesFor().map((tone) => {
          const selected = tone.id === value
          return (
            <motion.button key={tone.id} type="button" role="radio" aria-checked={selected} onClick={() => pick(tone.id)} whileTap={{ scale: 0.94 }} className={card(selected)}>
              {selected && <motion.span layoutId="sound-pick" transition={spring.snappy} className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-200" />}
              <span className="relative flex items-center justify-between">
                <span className="text-2xl">{tone.icon}</span>
                <Equalizer playing={playing === tone.id} />
              </span>
              <span className="relative mt-1 block font-display text-xl leading-tight tracking-wide">{tone.name}</span>
              <span className={cn('relative block text-xs', selected ? 'text-black/70' : 'text-white/65')}>{tone.vibe}</span>
            </motion.button>
          )
        })}
      </div>

      {/* sounds from the device */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-400">Your sounds</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="rounded-full bg-amber-400 px-3 py-1.5 text-sm font-bold text-black disabled:opacity-60"
          >
            {busy ? 'Adding…' : '＋ Add from device'}
          </button>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => void addFromDevice(e.target.files?.[0])} />
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm font-bold text-red-300">
            {error}
          </p>
        )}
        {custom && custom.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {custom.map((s) => {
              const id = `${CUSTOM_PREFIX}${s.id}`
              const selected = id === value
              return (
                <li key={s.id} className="flex items-center gap-2">
                  <button type="button" role="radio" aria-checked={selected} onClick={() => pick(id)} className={cn(card(selected), 'flex min-w-0 flex-1 items-center gap-2 py-2')}>
                    {selected && <motion.span layoutId="sound-pick" transition={spring.snappy} className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-200" />}
                    <span className="relative text-xl">🎵</span>
                    <span className="relative min-w-0 flex-1 truncate font-bold">{s.name}</span>
                    <span className="relative">
                      <Equalizer playing={playing === id} />
                    </span>
                  </button>
                  <button type="button" onClick={() => void remove(s.id)} aria-label={`Delete ${s.name}`} className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-lg">
                    🗑
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-white/60">Pick any song or tone from your phone (MP3, M4A, WAV…). It stays on this device.</p>
        )}
      </div>
    </div>
  )
}
