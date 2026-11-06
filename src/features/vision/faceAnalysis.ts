import type { FaceLandmarkerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'

export interface FaceReading {
  at: number
  faces: number
  /** Face centred and close enough to the camera. */
  centered: boolean
  eyesOpen: boolean
  /** 0..1, max of both eyes. */
  blink: number
  /** 0..1, average of both mouth corners. */
  smile: number
  landmarks: NormalizedLandmark[] | null
  /** Landmark movement since the previous frame (used for frozen/static feed detection). */
  motion: number
  /** Face present but has not moved at all for ~2s → photo/frozen feed. */
  static: boolean
  /** Camera has delivered no new frames for ~2s. */
  frozen: boolean
}

const TRACK_POINTS = [1, 33, 263, 61, 291, 152]

function blend(result: FaceLandmarkerResult, name: string) {
  return result.faceBlendshapes?.[0]?.categories.find((c) => c.categoryName === name)?.score ?? 0
}

export function readFace(result: FaceLandmarkerResult, prev: FaceReading | null, at: number): FaceReading {
  const faces = result.faceLandmarks.length
  const lm = result.faceLandmarks[0] ?? null
  if (!lm) {
    return { at, faces, centered: false, eyesOpen: false, blink: 0, smile: 0, landmarks: null, motion: 0, static: false, frozen: false }
  }
  const nose = lm[1]
  const faceWidth = Math.abs(lm[454].x - lm[234].x)
  const centered = nose.x > 0.28 && nose.x < 0.72 && nose.y > 0.22 && nose.y < 0.78 && faceWidth > 0.16
  const blink = Math.max(blend(result, 'eyeBlinkLeft'), blend(result, 'eyeBlinkRight'))
  const smile = (blend(result, 'mouthSmileLeft') + blend(result, 'mouthSmileRight')) / 2
  let motion = 0
  if (prev?.landmarks) {
    for (const i of TRACK_POINTS) {
      motion += Math.abs(lm[i].x - prev.landmarks[i].x) + Math.abs(lm[i].y - prev.landmarks[i].y)
    }
  }
  return { at, faces, centered, eyesOpen: blink < 0.45, blink, smile, landmarks: lm, motion, static: false, frozen: false }
}

export function drawFace(canvas: HTMLCanvasElement | null, video: HTMLVideoElement | null, reading: FaceReading, good: boolean) {
  if (!canvas || !video || !video.videoWidth) return
  if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth
  if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const lm = reading.landmarks
  if (!lm) return
  ctx.fillStyle = good ? '#ffc53d' : '#e63946'
  for (let i = 0; i < lm.length; i += 3) {
    ctx.fillRect(lm[i].x * canvas.width - 1.5, lm[i].y * canvas.height - 1.5, 3, 3)
  }
  let minX = 1, minY = 1, maxX = 0, maxY = 0
  for (const p of lm) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
  }
  ctx.strokeStyle = ctx.fillStyle
  ctx.lineWidth = 4
  ctx.setLineDash([14, 8])
  ctx.strokeRect(minX * canvas.width - 12, minY * canvas.height - 12, (maxX - minX) * canvas.width + 24, (maxY - minY) * canvas.height + 24)
}
