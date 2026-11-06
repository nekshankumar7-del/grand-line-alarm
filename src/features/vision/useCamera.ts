import { useEffect, useState, type RefObject } from 'react'

export type CameraState = 'starting' | 'live' | 'denied' | 'unavailable'

/** Front camera stream into `videoRef`. Nothing is recorded or uploaded. */
export function useCamera(videoRef: RefObject<HTMLVideoElement | null>, hd = false) {
  const [state, setState] = useState<CameraState>('starting')

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unavailable')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: hd ? 1280 : 640 }, height: { ideal: hd ? 720 : 480 } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        const video = videoRef.current
        if (video) {
          video.srcObject = s
          void video.play().catch(() => undefined)
        }
        setState('live')
      })
      .catch((error: unknown) => {
        if (!cancelled) setState((error as DOMException)?.name === 'NotAllowedError' ? 'denied' : 'unavailable')
      })
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [videoRef, hd])

  return state
}
