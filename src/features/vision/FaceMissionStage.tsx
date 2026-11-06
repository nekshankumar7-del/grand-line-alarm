import { useRef } from 'react'
import { drawFace, readFace, type FaceReading } from './faceAnalysis'
import { loadFaceLandmarker } from './visionTasks'
import { VisionShell } from './VisionShell'

export interface FaceVerdict {
  hint: string
  progress: number
  done: boolean
}

interface FaceMissionStageProps {
  /** Called every frame. `gate` is a problem message (no face, off-centre, frozen…) or null when the face is valid. */
  evaluate(reading: FaceReading, dt: number, gate: string | null): FaceVerdict
  badge?: string
  onProgress(p: number): void
  onComplete(): void
  onUnavailable?(reason: string): void
}

const STATIC_WINDOW_MS = 2000
const STATIC_THRESHOLD = 0.004

function gateFor(r: FaceReading): string | null {
  if (r.frozen) return 'Camera feed frozen!'
  if (r.faces === 0) return 'No face in frame — show yourself!'
  if (r.faces > 1) return 'One person at a time!'
  if (!r.centered) return 'Centre your face & come closer'
  if (r.static) return 'Feed looks frozen — move a little'
  return null
}

export function FaceMissionStage({ evaluate, badge, onProgress, onComplete, onUnavailable }: FaceMissionStageProps) {
  const s = useRef<{ prev: FaceReading | null; window: Array<{ t: number; m: number }> }>({ prev: null, window: [] })

  return (
    <VisionShell
      load={loadFaceLandmarker}
      badge={badge}
      onProgress={onProgress}
      onComplete={onComplete}
      onUnavailable={onUnavailable}
      onFrame={(model, video, info, canvas) => {
        const st = s.current
        let reading: FaceReading
        if (info.frozen) {
          reading = { at: info.now, faces: 0, centered: false, eyesOpen: false, blink: 0, smile: 0, landmarks: null, motion: 0, static: true, frozen: true }
        } else {
          reading = readFace(model.detectForVideo(video, info.now), st.prev, info.now)
          if (reading.landmarks) st.window.push({ t: info.now, m: reading.motion })
          else st.window.length = 0
          while (st.window.length && st.window[0].t < info.now - STATIC_WINDOW_MS) st.window.shift()
          const covered = st.window.length > 0 && info.now - st.window[0].t > STATIC_WINDOW_MS * 0.8
          reading.static = Boolean(reading.landmarks) && covered && st.window.reduce((a, b) => a + b.m, 0) < STATIC_THRESHOLD
          st.prev = reading
        }
        const gate = gateFor(reading)
        drawFace(canvas, video, reading, !gate)
        const v = evaluate(reading, info.dt, gate)
        return { ...v, good: !gate }
      }}
    />
  )
}
