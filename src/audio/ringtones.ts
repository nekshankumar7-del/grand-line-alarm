/**
 * Original ringtones, synthesised with Web Audio (no audio files, no licensing issues, works offline).
 * Each ringtone schedules one loop of `length` seconds starting at time `t`.
 */
export type RingtoneId = 'clocktower' | 'scanner' | 'night-bass' | 'thunder' | 'classic'

export interface Ringtone {
  id: RingtoneId
  name: string
  icon: string
  vibe: string
  length: number
  play(ctx: AudioContext, out: AudioNode, t: number): void
}

export const DEFAULT_RINGTONE: RingtoneId = 'clocktower'

function tone(ctx: AudioContext, out: AudioNode, t: number, freq: number, dur: number, type: OscillatorType, peak = 0.5, attack = 0.01) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(peak, t + attack)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(env).connect(out)
  osc.start(t)
  osc.stop(t + dur + 0.02)
  return osc
}

/** Bell = fundamental + inharmonic partials with long decay. */
function bell(ctx: AudioContext, out: AudioNode, t: number, freq: number) {
  ;[
    [1, 0.5, 1.6],
    [2.76, 0.22, 1.0],
    [5.4, 0.12, 0.6],
    [8.93, 0.06, 0.35],
  ].forEach(([ratio, peak, dur]) => tone(ctx, out, t, freq * ratio, dur, 'sine', peak, 0.004))
}

let noiseBuffer: AudioBuffer | null = null
function noise(ctx: AudioContext, out: AudioNode, t: number, dur: number, peak: number, cutoff: number) {
  if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = cutoff
  const env = ctx.createGain()
  env.gain.setValueAtTime(peak, t)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filter).connect(env).connect(out)
  src.start(t)
  src.stop(t + dur)
}

function boom(ctx: AudioContext, out: AudioNode, t: number) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.frequency.setValueAtTime(140, t)
  osc.frequency.exponentialRampToValueAtTime(38, t + 0.35)
  env.gain.setValueAtTime(0.9, t)
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
  osc.connect(env).connect(out)
  osc.start(t)
  osc.stop(t + 0.55)
  noise(ctx, out, t, 0.25, 0.5, 1800)
}

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12)

export const RINGTONES: Ringtone[] = [
  {
    id: 'classic',
    name: 'Classic Beep',
    icon: '⏰',
    vibe: 'Old-school digital alarm',
    length: 1,
    play(ctx, out, t) {
      ;[0, 0.15, 0.3, 0.45].forEach((o) => tone(ctx, out, t + o, 2000, 0.09, 'square', 0.3, 0.003))
    },
  },
  {
    id: 'clocktower',
    name: 'Clocktower',
    icon: '🕰️',
    vibe: 'Deep tolling bells over a sleeping city',
    length: 3,
    play(ctx, out, t) {
      bell(ctx, out, t, 196)
      bell(ctx, out, t + 1.4, 196)
      tone(ctx, out, t, 98, 2.6, 'sine', 0.35, 0.01)
    },
  },
  {
    id: 'scanner',
    name: 'Police Scanner',
    icon: '📻',
    vibe: 'Static bursts and urgent radio chirps',
    length: 1.6,
    play(ctx, out, t) {
      noise(ctx, out, t, 0.18, 0.35, 3500)
      ;[0.25, 0.4, 0.55].forEach((o) => tone(ctx, out, t + o, 1760, 0.08, 'square', 0.25, 0.003))
      noise(ctx, out, t + 0.8, 0.12, 0.3, 2500)
      tone(ctx, out, t + 1.0, 1320, 0.12, 'square', 0.25, 0.003)
    },
  },
  {
    id: 'night-bass',
    name: 'Night Bass',
    icon: '🎷',
    vibe: 'Original walking bass + brushed hi-hat',
    length: 2.4,
    play(ctx, out, t) {
      ;[40, 43, 45, 47, 48, 47, 45, 43].forEach((n, i) => tone(ctx, out, t + i * 0.3, midi(n), 0.28, 'triangle', 0.55, 0.01))
      for (let i = 0; i < 8; i++) noise(ctx, out, t + i * 0.3 + 0.15, 0.05, 0.12, 9000)
    },
  },
  {
    id: 'thunder',
    name: 'Thunderstorm',
    icon: '⛈️',
    vibe: 'Rain, a rolling thunderclap and a warning beep',
    length: 3,
    play(ctx, out, t) {
      noise(ctx, out, t, 3, 0.18, 1800)
      noise(ctx, out, t + 0.6, 1.4, 0.7, 220)
      boom(ctx, out, t + 0.6)
      tone(ctx, out, t + 2.2, 880, 0.15, 'square', 0.25, 0.003)
      tone(ctx, out, t + 2.45, 880, 0.15, 'square', 0.25, 0.003)
    },
  },
]

export const RINGTONE_MAP = Object.fromEntries(RINGTONES.map((r) => [r.id, r])) as Record<RingtoneId, Ringtone>

export const ringtoneFor = (id: string | undefined) => RINGTONE_MAP[id as RingtoneId] ?? RINGTONE_MAP[DEFAULT_RINGTONE]

/** All ringtones offered in the picker. */
export const ringtonesFor = (_edition?: string) => RINGTONES
