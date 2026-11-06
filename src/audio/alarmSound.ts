import { DEFAULT_RINGTONE, ringtoneFor, RINGTONE_MAP, type RingtoneId } from './ringtones'

/**
 * Alarm audio engine (Web Audio).
 * Gentle 30s fade-in → full volume after 2 min → harsh "classic" layer added after 5 min.
 */
class AlarmSound {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private previewGain: GainNode | null = null
  private timer: number | null = null
  private previewTimer: number | null = null
  private startedAt = 0
  private nextLoop = 0
  private nextHarsh = 0
  private ducked = false
  private ringtone: RingtoneId = DEFAULT_RINGTONE

  /** Must run inside a user gesture at least once so later alarms may play. */
  unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0
      this.master.connect(this.ctx.destination)
      this.previewGain = this.ctx.createGain()
      this.previewGain.gain.value = 0.6
      this.previewGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  get blocked() {
    return !this.ctx || this.ctx.state !== 'running'
  }

  start(firedAt: number, ringtone: string | undefined) {
    this.startedAt = firedAt
    this.ringtone = ringtoneFor(ringtone).id
    if (this.timer !== null) return
    this.stopPreview()
    try {
      this.unlock()
    } catch {
      /* AudioContext unavailable */
    }
    this.nextLoop = 0
    this.nextHarsh = 0
    this.schedule()
    this.timer = window.setInterval(() => this.schedule(), 200)
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05)
  }

  setDucked(ducked: boolean) {
    this.ducked = ducked
  }

  /** Plays ~2 loops of a ringtone at a comfortable volume (editor preview). */
  preview(id: RingtoneId) {
    this.unlock()
    const { ctx, previewGain } = this
    if (!ctx || !previewGain || this.timer !== null) return
    this.stopPreview()
    const tone = RINGTONE_MAP[id]
    const out = ctx.createGain()
    out.connect(previewGain)
    const t = ctx.currentTime + 0.05
    const loops = Math.max(1, Math.ceil(3 / tone.length))
    for (let i = 0; i < loops; i++) tone.play(ctx, out, t + i * tone.length)
    this.previewTimer = window.setTimeout(() => out.disconnect(), (loops * tone.length + 1.5) * 1000)
    this.previewOut = out
  }

  private previewOut: GainNode | null = null

  stopPreview() {
    if (this.previewTimer !== null) window.clearTimeout(this.previewTimer)
    this.previewTimer = null
    this.previewOut?.disconnect()
    this.previewOut = null
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
    const tone = ringtoneFor(this.ringtone)
    if (this.nextLoop < ctx.currentTime) this.nextLoop = ctx.currentTime + 0.05
    while (this.nextLoop < horizon) {
      tone.play(ctx, master, this.nextLoop)
      this.nextLoop += tone.length
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
