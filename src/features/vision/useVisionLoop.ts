import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

export type ModelStatus = 'loading' | 'slow' | 'ready' | 'error'

export interface FrameInfo {
  now: number
  /** ms since the previous processed frame (capped). */
  dt: number
  /** No new camera frames for ~2.5s. */
  frozen: boolean
}

const FROZEN_AFTER_MS = 2500
const FALLBACK_INTERVAL_MS = 66 // ~15 fps when requestVideoFrameCallback is unavailable
const SLOW_AFTER_MS = 15_000

type VideoWithRvfc = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: (now: number, meta: { presentedFrames?: number; mediaTime?: number }) => void) => number
  cancelVideoFrameCallback?: (id: number) => void
}

/**
 * Loads a model, then runs `onFrame` on camera frames.
 *  • Uses requestVideoFrameCallback (fires once per *real* camera frame) when available.
 *  • Otherwise ticks at ~15 fps — it never relies on `video.currentTime`, which some phone
 *    browsers barely update for live camera streams (that made missions look "dead" on mobile).
 * Also reports a frozen feed when frames stop arriving, and a slow first load.
 */
export function useVisionLoop<Model>(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  load: () => Promise<Model>,
  onFrame: (model: Model, video: HTMLVideoElement, info: FrameInfo) => void,
) {
  const [status, setStatus] = useState<ModelStatus>('loading')
  const [attempt, setAttempt] = useState(0)
  const frame = useRef(onFrame)
  frame.current = onFrame
  const loader = useRef(load)
  loader.current = load
  const retry = useCallback(() => setAttempt((a) => a + 1), [])

  useEffect(() => {
    if (!enabled) return
    let stopped = false
    let model: Model | null = null
    let lastProcessed = 0
    let lastFrameAt = performance.now()
    let lastFrozenReport = 0
    let lastMediaTime = -1
    let rvfcId = 0
    let interval = 0
    let watchdog = 0

    const process = (now: number, frozen: boolean) => {
      const video = videoRef.current
      if (!model || !video || video.readyState < 2 || !video.videoWidth) return
      const dt = lastProcessed ? Math.min(150, now - lastProcessed) : 0
      lastProcessed = now
      try {
        frame.current(model, video, { now, dt, frozen })
      } catch {
        /* one bad frame (e.g. during camera hand-over) must not kill the loop */
      }
    }

    const startLoop = () => {
      const video = videoRef.current as VideoWithRvfc | null
      if (video?.requestVideoFrameCallback) {
        const onVideoFrame = (_now: number, meta: { mediaTime?: number }) => {
          if (stopped) return
          lastFrameAt = performance.now()
          if (meta.mediaTime !== undefined) lastMediaTime = meta.mediaTime
          process(performance.now(), false)
          rvfcId = (videoRef.current as VideoWithRvfc | null)?.requestVideoFrameCallback?.(onVideoFrame) ?? 0
        }
        rvfcId = video.requestVideoFrameCallback(onVideoFrame)
      } else {
        interval = window.setInterval(() => {
          if (stopped) return
          const v = videoRef.current
          if (v && !v.paused && v.readyState >= 2) {
            // Count a frame as fresh when time moves OR the browser can't tell us (assume live).
            if (v.currentTime !== lastMediaTime || v.currentTime === 0) lastFrameAt = performance.now()
            lastMediaTime = v.currentTime
          }
          process(performance.now(), false)
        }, FALLBACK_INTERVAL_MS)
      }
      // Frozen-feed watchdog (works for both modes).
      watchdog = window.setInterval(() => {
        const now = performance.now()
        if (now - lastFrameAt > FROZEN_AFTER_MS && now - lastFrozenReport > 300) {
          lastFrozenReport = now
          process(now, true)
          // Nudge a stalled <video> (iOS sometimes pauses it after a camera hand-over).
          void videoRef.current?.play().catch(() => undefined)
        }
      }, 300)
    }

    setStatus('loading')
    const slowTimer = window.setTimeout(() => !stopped && !model && setStatus('slow'), SLOW_AFTER_MS)
    loader
      .current()
      .then((m) => {
        if (stopped) return
        model = m
        setStatus('ready')
        startLoop()
      })
      .catch(() => !stopped && setStatus('error'))

    return () => {
      stopped = true
      window.clearTimeout(slowTimer)
      window.clearInterval(interval)
      window.clearInterval(watchdog)
      const v = videoRef.current as VideoWithRvfc | null
      if (rvfcId && v?.cancelVideoFrameCallback) v.cancelVideoFrameCallback(rvfcId)
    }
  }, [enabled, videoRef, attempt])

  return { status, retry }
}
