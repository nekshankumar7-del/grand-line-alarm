import type { FaceLandmarker, GestureRecognizer, ImageSegmenter, PoseLandmarker } from '@mediapipe/tasks-vision'

// Everything is served from our own origin (see scripts/copy-vision-assets.mjs) so it works offline.
export const VISION_WASM_PATH = '/mediapipe/wasm'
export const MODEL_PATHS = {
  face: '/models/face_landmarker.task',
  pose: '/models/pose_landmarker_lite.task',
  gesture: '/models/gesture_recognizer.task',
} as const

type Delegate = 'GPU' | 'CPU'

async function fileset() {
  const { FilesetResolver } = await import('@mediapipe/tasks-vision')
  return FilesetResolver.forVisionTasks(VISION_WASM_PATH)
}

/** Memoised loader with GPU → CPU fallback; resets on failure so it can be retried. */
/**
 * Phones: run tracking on the CPU. The face-ID check (TensorFlow.js) also uses the GPU, and on many
 * phones two GPU users in one page stall each other — which looked like "the mission doesn't see me".
 * Desktop keeps GPU first.
 */
const PREFER: Delegate =
  typeof navigator !== 'undefined' && (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent)))
    ? 'CPU'
    : 'GPU'
const FALLBACK: Delegate = PREFER === 'CPU' ? 'GPU' : 'CPU'

function lazy<T>(create: (delegate: Delegate) => Promise<T>) {
  let pending: Promise<T> | null = null
  return () => {
    pending ??= create(PREFER)
      .catch(() => create(FALLBACK))
      .catch((error: unknown) => {
        pending = null
        throw error
      })
    return pending
  }
}

export const loadFaceLandmarker = lazy<FaceLandmarker>(async (delegate) => {
  const { FaceLandmarker } = await import('@mediapipe/tasks-vision')
  return FaceLandmarker.createFromOptions(await fileset(), {
    baseOptions: { modelAssetPath: MODEL_PATHS.face, delegate },
    runningMode: 'VIDEO',
    numFaces: 2,
    outputFaceBlendshapes: true,
  })
})

export const loadPoseLandmarker = lazy<PoseLandmarker>(async (delegate) => {
  const { PoseLandmarker } = await import('@mediapipe/tasks-vision')
  return PoseLandmarker.createFromOptions(await fileset(), {
    baseOptions: { modelAssetPath: MODEL_PATHS.pose, delegate },
    runningMode: 'VIDEO',
    numPoses: 2,
  })
})

export const loadGestureRecognizer = lazy<GestureRecognizer>(async (delegate) => {
  const { GestureRecognizer } = await import('@mediapipe/tasks-vision')
  return GestureRecognizer.createFromOptions(await fileset(), {
    baseOptions: { modelAssetPath: MODEL_PATHS.gesture, delegate },
    runningMode: 'VIDEO',
    numHands: 1,
  })
})

/* ---------- still-image loaders (used to turn the captured photo into an anime portrait) ---------- */

export const loadFaceLandmarkerImage = lazy<FaceLandmarker>(async (delegate) => {
  const { FaceLandmarker } = await import('@mediapipe/tasks-vision')
  return FaceLandmarker.createFromOptions(await fileset(), {
    baseOptions: { modelAssetPath: MODEL_PATHS.face, delegate },
    runningMode: 'IMAGE',
    numFaces: 1,
  })
})

export const loadSelfieSegmenter = lazy<ImageSegmenter>(async (delegate) => {
  const { ImageSegmenter } = await import('@mediapipe/tasks-vision')
  return ImageSegmenter.createFromOptions(await fileset(), {
    // Multi-class: 0 background, 1 hair, 2 body skin, 3 face skin, 4 clothes, 5 accessories.
    baseOptions: { modelAssetPath: '/models/selfie_multiclass.tflite', delegate },
    runningMode: 'IMAGE',
    outputConfidenceMasks: true,
    outputCategoryMask: false,
  })
})

/** Pre-download model files into the service-worker cache (e.g. as soon as a camera trial is added). */
export function warmVisionAssets(kind: keyof typeof MODEL_PATHS) {
  const urls = [MODEL_PATHS[kind], `${VISION_WASM_PATH}/vision_wasm_internal.js`, `${VISION_WASM_PATH}/vision_wasm_internal.wasm`]
  for (const url of urls) void fetch(url).catch(() => undefined)
}
