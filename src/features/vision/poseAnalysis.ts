import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export const P = {
  nose: 0, lShoulder: 11, rShoulder: 12, lElbow: 13, rElbow: 14, lWrist: 15, rWrist: 16,
  lHip: 23, rHip: 24, lKnee: 25, rKnee: 26, lAnkle: 27, rAnkle: 28,
} as const

const FULL_BODY = [P.nose, P.lShoulder, P.rShoulder, P.lWrist, P.rWrist, P.lHip, P.rHip, P.lKnee, P.rKnee, P.lAnkle, P.rAnkle]
const LEGS = [P.lHip, P.rHip, P.lKnee, P.rKnee, P.lAnkle, P.rAnkle, P.lShoulder, P.rShoulder]

export const SKELETON: Array<[number, number]> = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28], [0, 11], [0, 12],
]

function visible(lm: NormalizedLandmark[], ids: readonly number[]) {
  return ids.every((i) => {
    const p = lm[i]
    return (p.visibility ?? 1) > 0.5 && p.x > -0.02 && p.x < 1.02 && p.y > -0.02 && p.y < 1.02
  })
}

const dist = (a: NormalizedLandmark, b: NormalizedLandmark) => Math.hypot(a.x - b.x, a.y - b.y)

/** Angle ABC in degrees. */
function angle(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark) {
  const ab = Math.atan2(a.y - b.y, a.x - b.x)
  const cb = Math.atan2(c.y - b.y, c.x - b.x)
  let deg = Math.abs(((ab - cb) * 180) / Math.PI)
  if (deg > 180) deg = 360 - deg
  return deg
}

export type PosePhase = 'open' | 'closed' | 'between'

export interface PoseRead {
  inFrame: boolean
  phase: PosePhase
  detail: string
}

export function readJumpingJack(lm: NormalizedLandmark[]): PoseRead {
  if (!visible(lm, FULL_BODY)) return { inFrame: false, phase: 'between', detail: 'Step back — whole body in frame!' }
  const shoulderW = Math.max(0.05, dist(lm[P.lShoulder], lm[P.rShoulder]))
  const armsUp = lm[P.lWrist].y < lm[P.nose].y && lm[P.rWrist].y < lm[P.nose].y
  const armsDown = lm[P.lWrist].y > lm[P.lShoulder].y && lm[P.rWrist].y > lm[P.rShoulder].y
  const spread = Math.abs(lm[P.lAnkle].x - lm[P.rAnkle].x) / shoulderW
  if (armsUp && spread > 1.25) return { inFrame: true, phase: 'open', detail: 'Now back together!' }
  if (armsDown && spread < 1.05) return { inFrame: true, phase: 'closed', detail: 'Jump! Arms up, feet apart!' }
  return { inFrame: true, phase: 'between', detail: armsUp ? 'Feet wider!' : 'Arms all the way up!' }
}

export function readSquat(lm: NormalizedLandmark[]): PoseRead {
  if (!visible(lm, LEGS)) return { inFrame: false, phase: 'between', detail: 'Step back — hips to feet in frame!' }
  const knee = (angle(lm[P.lHip], lm[P.lKnee], lm[P.lAnkle]) + angle(lm[P.rHip], lm[P.rKnee], lm[P.rAnkle])) / 2
  if (knee < 105) return { inFrame: true, phase: 'open', detail: 'Now stand up tall!' }
  if (knee > 158) return { inFrame: true, phase: 'closed', detail: 'Squat down low!' }
  return { inFrame: true, phase: 'between', detail: knee < 135 ? 'Lower…' : 'Keep going…' }
}

/**
 * Debounced rep counter: a phase must hold for `holdMs` to register,
 * and a rep is closed→open→closed. Half-reps never count.
 */
export class RepCounter {
  reps = 0
  private stable: PosePhase = 'closed'
  private candidate: PosePhase = 'closed'
  private since = 0
  private sawOpen = false
  private lastRepAt = 0

  constructor(private holdMs = 110, private minRepMs = 380) {}

  update(phase: PosePhase, now: number): boolean {
    if (phase === 'between') return false
    if (phase !== this.candidate) {
      this.candidate = phase
      this.since = now
      return false
    }
    if (phase === this.stable || now - this.since < this.holdMs) return false
    this.stable = phase
    if (phase === 'open') this.sawOpen = true
    else if (this.sawOpen && now - this.lastRepAt > this.minRepMs) {
      this.sawOpen = false
      this.lastRepAt = now
      this.reps += 1
      return true
    }
    return false
  }
}

export function drawSkeleton(canvas: HTMLCanvasElement | null, lm: NormalizedLandmark[] | null, good: boolean) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (!lm) return
  const w = canvas.width
  const h = canvas.height
  ctx.lineCap = 'round'
  ctx.lineWidth = 8
  ctx.strokeStyle = good ? 'rgba(255,197,61,0.95)' : 'rgba(230,57,70,0.9)'
  ctx.shadowColor = ctx.strokeStyle
  ctx.shadowBlur = 12
  for (const [a, b] of SKELETON) {
    ctx.beginPath()
    ctx.moveTo(lm[a].x * w, lm[a].y * h)
    ctx.lineTo(lm[b].x * w, lm[b].y * h)
    ctx.stroke()
  }
  ctx.shadowBlur = 0
  ctx.fillStyle = 'white'
  for (const i of Object.values(P)) {
    ctx.beginPath()
    ctx.arc(lm[i].x * w, lm[i].y * h, 6, 0, Math.PI * 2)
    ctx.fill()
  }
}
