import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { alarmSound } from '@/audio/alarmSound'
import { Sheet } from '@/components/ui/Sheet'
import { cn } from '@/lib/cn'

const BARS = 90
const MIN_LEN = 2
const MAX_LEN = 120

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

function peaks(buffer: AudioBuffer) {
  const data = buffer.getChannelData(0)
  const step = Math.max(1, Math.floor(data.length / BARS))
  const out: number[] = []
  for (let b = 0; b < BARS; b++) {
    let max = 0
    const from = b * step
    const to = Math.min(data.length, from + step)
    for (let i = from; i < to; i += 16) max = Math.max(max, Math.abs(data[i]))
    out.push(max)
  }
  const top = Math.max(0.01, ...out)
  return out.map((v) => v / top)
}

interface SoundTrimmerProps {
  open: boolean
  name: string
  buffer: AudioBuffer | null
  initial?: { start: number; end: number }
  onSave(sel: { start: number; end: number; name: string }): void
  onClose(): void
}

/** Pick the part of a song to use as the alarm: waveform + two drag handles + play selection. */
export function SoundTrimmer({ open, name, buffer, initial, onSave, onClose }: SoundTrimmerProps) {
  const duration = buffer?.duration ?? 0
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [label, setLabel] = useState(name)
  const [playingFrom, setPlayingFrom] = useState<number | null>(null)
  const [playhead, setPlayhead] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const dragging = useRef<'start' | 'end' | null>(null)
  const bars = useMemo(() => (buffer ? peaks(buffer) : []), [buffer])

  useEffect(() => {
    if (!open || !buffer) return
    setLabel(name)
    const s = initial?.start ?? 0
    const e = initial?.end ?? Math.min(buffer.duration, 30)
    setStart(Math.max(0, Math.min(s, buffer.duration - MIN_LEN)))
    setEnd(Math.min(buffer.duration, Math.max(e, s + MIN_LEN)))
  }, [open, buffer, initial, name])

  // moving playhead while previewing
  useEffect(() => {
    if (playingFrom === null) return
    let raf = 0
    const t0 = performance.now()
    const tick = () => {
      const pos = start + (performance.now() - t0) / 1000
      if (pos >= end) {
        setPlayingFrom(null)
        return
      }
      setPlayhead(pos)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playingFrom, start, end])

  useEffect(() => {
    if (!open) {
      alarmSound.stopPreview()
      setPlayingFrom(null)
    }
  }, [open])

  const timeAt = (clientX: number) => {
    const r = track.current?.getBoundingClientRect()
    if (!r || !duration) return 0
    return Math.min(duration, Math.max(0, ((clientX - r.left) / r.width) * duration))
  }

  function move(which: 'start' | 'end', t: number) {
    if (which === 'start') setStart(Math.max(0, Math.min(t, end - MIN_LEN, end)))
    else setEnd(Math.min(duration, Math.max(t, start + MIN_LEN)))
  }

  function onDown(e: PointerEvent<HTMLDivElement>) {
    const t = timeAt(e.clientX)
    dragging.current = Math.abs(t - start) <= Math.abs(t - end) ? 'start' : 'end'
    e.currentTarget.setPointerCapture(e.pointerId)
    move(dragging.current, t)
    stop()
  }
  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (dragging.current) move(dragging.current, timeAt(e.clientX))
  }
  function onUp() {
    dragging.current = null
  }

  function play() {
    if (!buffer) return
    alarmSound.previewBuffer(buffer, start, Math.min(end, start + MAX_LEN))
    setPlayhead(start)
    setPlayingFrom(start)
  }
  function stop() {
    alarmSound.stopPreview()
    setPlayingFrom(null)
  }

  const len = end - start
  const tooLong = len > MAX_LEN
  const pct = (t: number) => (duration ? (t / duration) * 100 : 0)

  return (
    <Sheet open={open} title="Choose the alarm part" onClose={onClose}>
      {!buffer ? (
        <p className="py-6 text-center">Loading sound…</p>
      ) : (
        <div className="space-y-4 pb-2">
          <label className="block">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] opacity-70">Name</span>
            <input value={label} maxLength={40} onChange={(e) => setLabel(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-black bg-white px-3 py-2 font-bold" />
          </label>

          {/* waveform + handles */}
          <div
            ref={track}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="relative h-28 cursor-ew-resize touch-none select-none rounded-xl bg-[#0b0f19] px-1"
            role="group"
            aria-label="Drag the handles to choose the start and end"
          >
            <div className="absolute inset-x-1 inset-y-3 flex items-center gap-[2px]">
              {bars.map((h, i) => {
                const t = ((i + 0.5) / BARS) * duration
                const inside = t >= start && t <= end
                return <span key={i} className={cn('flex-1 rounded-full', inside ? 'bg-amber-400' : 'bg-white/20')} style={{ height: `${Math.max(6, h * 100)}%` }} />
              })}
            </div>
            {/* dim outside selection */}
            <div className="pointer-events-none absolute inset-y-0 left-0 rounded-l-xl bg-black/50" style={{ width: `${pct(start)}%` }} />
            <div className="pointer-events-none absolute inset-y-0 right-0 rounded-r-xl bg-black/50" style={{ width: `${100 - pct(end)}%` }} />
            {/* handles */}
            {(['start', 'end'] as const).map((h) => (
              <div key={h} className="pointer-events-none absolute inset-y-0 w-1 -translate-x-1/2 bg-amber-300" style={{ left: `${pct(h === 'start' ? start : end)}%` }}>
                <span className="absolute -bottom-1 left-1/2 grid h-7 w-5 -translate-x-1/2 place-items-center rounded-md border-2 border-black bg-amber-400 text-[10px] font-black text-black">
                  {h === 'start' ? '[' : ']'}
                </span>
              </div>
            ))}
            {playingFrom !== null && <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_white]" style={{ left: `${pct(playhead)}%` }} />}
          </div>

          <div className="flex items-center justify-between text-sm font-bold">
            <span>Start {fmt(start)}</span>
            <span className={cn(tooLong && 'text-red-700')}>Length {fmt(len)}</span>
            <span>End {fmt(end)}</span>
          </div>
          {tooLong && <p className="text-sm font-bold text-red-700">Keep the part under 2 minutes.</p>}

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setStart(0); setEnd(Math.min(duration, 30)) }} className="rounded-xl border-2 border-black bg-white py-2 text-sm font-bold">
              First 30 s
            </button>
            <button type="button" onClick={() => { setStart(0); setEnd(Math.min(duration, MAX_LEN)) }} className="rounded-xl border-2 border-black bg-white py-2 text-sm font-bold">
              Whole sound{duration > MAX_LEN ? ' (2 min)' : ''}
            </button>
          </div>

          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.96 }} type="button" onClick={playingFrom === null ? play : stop} className="flex-1 rounded-2xl border-2 border-black bg-white py-3 font-display text-2xl tracking-wide">
              {playingFrom === null ? '▶ Play selection' : '■ Stop'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              disabled={tooLong}
              onClick={() => {
                stop()
                onSave({ start, end, name: label.trim() || name })
              }}
              className="flex-1 rounded-2xl border-2 border-black bg-amber-400 py-3 font-display text-2xl tracking-wide disabled:opacity-50"
            >
              ✔ Save
            </motion.button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
