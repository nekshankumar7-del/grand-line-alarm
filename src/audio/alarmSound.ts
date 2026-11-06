import { db } from '@/db/db'
import { DEFAULT_RINGTONE, ringtoneFor, RINGTONE_MAP, type RingtoneId } from './ringtones'

export const CUSTOM_PREFIX = 'custom:'
export const isCustomSound = (id: string | undefined): id is `custom:${string}` => Boolean(id?.startsWith(CUSTOM_PREFIX))

/**
 * Alarm audio engine (Web Audio).
 * Built-in ringtones are synthesised; a sound picked from the device is decoded and looped.
 * Gentle 30s fade-in → full volume after 2 min → harsh "classic" layer added after 5 min.
 */
class AlarmSound {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private previewGain: GainNode | null = null
  private timer: number | null = null
  private previewTimer: number | null = null
  private previewOut: GainNode | null = null
  private previewSource: AudioBufferSourceNode | null = null
  private startedAt = 0
  private nextLoop = 0
  private nextHarsh = 0
  private ducked = false
  private ringtone: RingtoneId = DEFAULT_RINGTONE
  /** Device sound currently playing as the alarm (looped). */
  private customId: string | null = null
  private customSource: AudioBufferSourceNode | null = null
  private bufferCache = new Map<string, AudioBuffer>()

  /** Must run inside a user gesture at least once so later alarms may play. */
  unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0
      this.master.connect(this.ctx.destination)
      this.previewGain = this.ctx.createGain()
      this.previewGain.gain.value = 0.7
      this.previewGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  get blocked() {
    return !this.ctx || this.ctx.state !== 'running'
  }

  start(firedAt: number, sound: string | undefined) {
    this.startedAt = firedAt
    if (isCustomSound(sound)) {
      this.customId = sound.slice(CUSTOM_PREFIX.length)
    } else {
      this.customId = null
      this.ringtone = ringtoneFor(sound).id
    }
    if (this.timer !== null) return
    this.stopPreview()
    try {
      this.unlock()
    } catch {
      /* AudioContext unavailable */
    }
    this.nextLoop = 0
    this.nextHarsh = 0
    if (this.customId) void this.startCustom(this.customId)
    this.schedule()
    this.timer = window.setInterval(() => this.schedule(), 200)
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
    try {
      this.customSource?.stop()
    } catch {
      /* already stopped */
    }
    this.customSource = null
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05)
  }

  setDucked(ducked: boolean) {
    this.ducked = ducked
  }

  /** Decode (and cache) a device sound. */
  private async loadBuffer(id: string) {
    const cached = this.bufferCache.get(id)
    if (cached) return cached
    this.unlock()
    const rec = await db.sounds.get(id)
    if (!rec || !this.ctx) return null
    const buffer = await this.ctx.decodeAudioData(await rec.blob.arrayBuffer())
    this.bufferCache.set(id, buffer)
    return buffer
  }

  private async startCustom(id: string) {
    try {
      const buffer = await this.loadBuffer(id)
      // still ringing with this sound?
      if (!buffer || this.timer === null || this.customId !== id || !this.ctx || !this.master) return
      const src = this.ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      src.connect(this.master)
      src.start()
      this.customSource = src
    } catch {
      // unreadable file → fall back to the built-in ringtone so the alarm never goes silent
      this.customId = null
    }
  }

  /** Preview a ringtone (built-in or from the device) at a comfortable volume. */
  preview(id: string) {
    this.unlock()
    const { ctx, previewGain } = this
    if (!ctx || !previewGain || this.timer !== null) return
    this.stopPreview()
    const out = ctx.createGain()
    out.connect(previewGain)
    this.previewOut = out

    if (isCustomSound(id)) {
      void this.loadBuffer(id.slice(CUSTOM_PREFIX.length))
        .then((buffer) => {
          if (!buffer || this.previewOut !== out) return
          const src = ctx.createBufferSource()
          src.buffer = buffer
          src.connect(out)
          src.start(ctx.currentTime + 0.05, 0, Math.min(5, buffer.duration))
          this.previewSource = src
        })
        .catch(() => undefined)
      this.previewTimer = window.setTimeout(() => this.stopPreview(), 5500)
      return
    }

    const tone = RINGTONE_MAP[id as RingtoneId] ?? RINGTONE_MAP[DEFAULT_RINGTONE]
    const t = ctx.currentTime + 0.05
    const loops = Math.max(1, Math.ceil(3 / tone.length))
    for (let i = 0; i < loops; i++) tone.play(ctx, out, t + i * tone.length)
    this.previewTimer = window.setTimeout(() => this.stopPreview(), (loops * tone.length + 1.5) * 1000)
  }

  stopPreview() {
    if (this.previewTimer !== null) window.clearTimeout(this.previewTimer)
    this.previewTimer = null
    try {
      this.previewSource?.stop()
    } catch {
      /* already stopped */
    }
    this.previewSource = null
    this.previewOut?.disconnect()
    this.previewOut = null
  }

  /** Forget a decoded device sound (after it's deleted). */
  forget(id: string) {
    this.bufferCache.delete(id)
  }

  private volumeAt(elapsed: number) {
    if (elapsed >= 120) return 1
    return Math.min(0.75, 0.12 + (elapsed / 30) * 0.63)
  }

  private schedule() {
    const { ctx, master } = this
    if (!ctx || !master || ctx.state !== 'running') return
    const elapsed = (Date.now() - this.startedAt) / 1000
    master.gain.setTargetAtTime(this.volumeAt(elapsed) * (this.ducked ? 0.2 : 1), ctx.currentTime, 0.25)

    const horizon = ctx.currentTime + 0.6
    // Device sound loops on its own; until it's decoded (or if it fails), the classic beep covers.
    const customPlaying = Boolean(this.customId && this.customSource)
    if (!customPlaying) {
      const tone = this.customId ? RINGTONE_MAP.classic : ringtoneFor(this.ringtone)
      if (this.nextLoop < ctx.currentTime) this.nextLoop = ctx.currentTime + 0.05
      while (this.nextLoop < horizon) {
        tone.play(ctx, master, this.nextLoop)
        this.nextLoop += tone.length
      }
    }
    if (elapsed > 300) {
      const harsh = RINGTONE_MAP.classic
      if (this.nextHarsh < ctx.currentTime) this.nextHarsh = ctx.currentTime + 0.05
      while (this.nextHarsh < horizon) {
        harsh.play(ctx, master, this.nextHarsh)
        this.nextHarsh += harsh.length * 1.5
      }
    }
  }
}

export const alarmSound = new AlarmSound()

export function installAudioUnlock() {
  const unlock = () => {
    try {
      alarmSound.unlock()
    } catch {
      /* ignore */
    }
  }
  for (const type of ['pointerdown', 'keydown', 'touchend'] as const) {
    window.addEventListener(type, unlock, { passive: true })
  }
}
