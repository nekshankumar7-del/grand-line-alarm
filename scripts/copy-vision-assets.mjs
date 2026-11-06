// Copies on-device ML runtimes/models into public/ so every vision trial works offline from our own origin.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'

function copy(srcDir, destDir, files, label) {
  if (!existsSync(srcDir)) return console.warn(`[vision] ${label} not installed, skipping`)
  mkdirSync(destDir, { recursive: true })
  for (const f of files) if (!existsSync(`${destDir}/${f}`)) copyFileSync(`${srcDir}/${f}`, `${destDir}/${f}`)
  console.log(`[vision] ${label} ready in ${destDir}`)
}

copy('node_modules/@mediapipe/tasks-vision/wasm', 'public/mediapipe/wasm', ['vision_wasm_internal.js', 'vision_wasm_internal.wasm'], 'MediaPipe wasm')

const faceApiModels = ['tiny_face_detector_model', 'face_landmark_68_model', 'face_recognition_model'].flatMap((m) => [
  `${m}-weights_manifest.json`,
  `${m}.bin`,
])
copy('node_modules/@vladmandic/face-api/model', 'public/models/face-api', faceApiModels, 'face-api models')
