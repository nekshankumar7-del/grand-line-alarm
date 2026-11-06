/**
 * On-device face recognition (who is this?) using face-api (TensorFlow.js).
 * Produces a 128-d descriptor per face; descriptors never leave the device.
 */
type FaceApi = typeof import('@vladmandic/face-api')

const MODEL_URL = '/models/face-api'
/** Euclidean distance below which two descriptors are the same person (face-api standard is 0.6). */
export const MATCH_THRESHOLD = 0.52

let pending: Promise<FaceApi> | null = null

export function loadFaceId() {
  pending ??= (async () => {
    const faceapi = await import('@vladmandic/face-api')
    // The bundled tfjs typings omit the backend API, so type the two calls we need.
    const tf = faceapi.tf as unknown as { setBackend(name: string): Promise<boolean>; ready(): Promise<void> }
    try {
      await tf.setBackend('webgl')
    } catch {
      await tf.setBackend('cpu')
    }
    await tf.ready()
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])
    return faceapi
  })().catch((error: unknown) => {
    pending = null
    throw error
  })
  return pending
}

export interface FaceSample {
  descriptor: number[]
  box: { x: number; y: number; width: number; height: number }
  score: number
  faces: number
}

/** Detects faces in the current video frame and returns the main face's descriptor. */
export async function describeFace(video: HTMLVideoElement): Promise<FaceSample | null> {
  const faceapi = await loadFaceId()
  if (video.readyState < 2) return null
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
  const results = await faceapi.detectAllFaces(video, options).withFaceLandmarks().withFaceDescriptors()
  if (!results.length) return null
  const main = results.reduce((a, b) => (a.detection.box.area > b.detection.box.area ? a : b))
  const { x, y, width, height } = main.detection.box
  return { descriptor: Array.from(main.descriptor), box: { x, y, width, height }, score: main.detection.score, faces: results.length }
}

export function distance(a: number[], b: number[]) {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2
  return Math.sqrt(sum)
}

export function meanDescriptor(samples: number[][]) {
  const mean = new Array<number>(samples[0].length).fill(0)
  for (const s of samples) for (let i = 0; i < s.length; i++) mean[i] += s[i] / samples.length
  return mean
}

/** Best distance against the mean and every enrolled sample (more robust to angle/lighting). */
export function matchDistance(descriptor: number[], profile: { descriptor: number[]; samples: number[][] }) {
  return Math.min(distance(descriptor, profile.descriptor), ...profile.samples.map((s) => distance(descriptor, s)))
}

function averageColor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const { data } = ctx.getImageData(Math.max(0, x), Math.max(0, y), Math.max(1, w), Math.max(1, h))
  let r = 0, g = 0, b = 0, n = 0
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
    n++
  }
  const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

/** Samples skin (cheeks) and hair (above the forehead) colours from the video frame. */
export function sampleFaceColors(video: HTMLVideoElement, box: FaceSample['box']) {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return {}
  ctx.drawImage(video, 0, 0)
  const skin = averageColor(ctx, box.x + box.width * 0.3, box.y + box.height * 0.55, box.width * 0.4, box.height * 0.15)
  const hairTop = Math.max(0, box.y - box.height * 0.18)
  const hair = averageColor(ctx, box.x + box.width * 0.3, hairTop, box.width * 0.4, Math.max(4, box.y - hairTop))
  return { skin, hair }
}

export function snapshotFace(video: HTMLVideoElement, box: FaceSample["box"], size = 768) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  // Square crop around the face that always stays inside the camera frame (no black bars).
  const vw = video.videoWidth
  const vh = video.videoHeight
  const pad = box.width * 0.55
  const side = Math.min(Math.max(box.width, box.height) + pad * 2, vw, vh)
  const sx = Math.min(Math.max(0, box.x + box.width / 2 - side / 2), vw - side)
  // Bias the crop slightly downward so hair + shoulders fit like a portrait.
  const sy = Math.min(Math.max(0, box.y + box.height * 0.6 - side / 2), vh - side)
  ctx.translate(size, 0)
  ctx.scale(-1, 1)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size)
  return canvas.toDataURL('image/jpeg', 0.93)
}
