import { useEffect, useRef, useState, type RefObject } from 'react'

export type ModelStatus = 'loading' | 'ready' | 'error'

export interface FrameInfo {
  now: number
  /** ms since the previous processed frame (capped). */
  dt: number
  /** No new camera frames for ~2s. */
  frozen: boolean
}

const FROZEN_AFTER_MS = 2000

/**
 * Loads a model, then runs `onFrame` once per *new* video frame (skips duplicate frames, keeps animations smooth).
 * Also reports a frozen feed when frames stop arriving.
 */
export function useVisionLoop<Model>(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  load: () => Promise<Model>,
  onFrame: (model: Model, video: HTMLVideoElement, info: FrameInfo) => void,
) {
  const [status, setStatus] = useState<ModelStatus>('loading')
  const frame = useRef(onFrame)
  frame.current = onFrame
  const loader = useRef(load)
  loader.current = load

  useEffect(() => {
    if (!enabled) return
    let stopped = false
    let raf = 0
    let model: Model | null = null
    let lastVideoTime = -1
    let lastNewFrame = performance.now()
    let lastProcessed = 0

    const loop = () => {
      if (stopped) return
      const video = videoRef.current
      const now = performance.now()
      if (model && video && video.readyState >= 2) {
        const fresh = video.currentTime !== lastVideoTime
        const frozen = !fresh && now - lastNewFrame > FROZEN_AFTER_MS
        if (fresh) {
          lastVideoTime = video.currentTime
          lastNewFrame = now
        }
        if (fresh || (frozen && now - lastProcessed > 250)) {
          const dt = lastProcessed ? Math.min(150, now - lastProcessed) : 0
          lastProcessed = now
          frame.current(model, video, { now, dt, frozen })
        }
      }
      raf = requestAnimationFrame(loop)
    }

    setStatus('loading')
    loader
      .current()
      .then((m) => {
        if (stopped) return
        model = m
        setStatus('ready')
        raf = requestAnimationFrame(loop)
      })
      .catch(() => !stopped && setStatus('error'))

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
    }
  }, [enabled, videoRef])

  return status
}
