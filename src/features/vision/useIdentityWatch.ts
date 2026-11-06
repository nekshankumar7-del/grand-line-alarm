import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState, type RefObject } from 'react'
import { db } from '@/db/db'
import { describeFace, matchDistance, MATCH_THRESHOLD } from './faceId'

export type IdentityStatus = 'off' | 'loading' | 'checking' | 'match' | 'stranger'

/**
 * Periodically checks that the face in front of the camera is the registered user.
 * A single far-away/blurred frame never fails you — only 2 confident mismatches in a row flag a stranger.
 */
export function useIdentityWatch(videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean, intervalMs = 2500) {
  const profile = useLiveQuery(() => db.profile.get('me'), [])
  const [status, setStatus] = useState<IdentityStatus>('loading')

  useEffect(() => {
    if (!enabled) return
    if (profile === undefined) return
    if (!profile) {
      setStatus('off')
      return
    }
    let stopped = false
    let mismatches = 0
    let timer = 0
    const check = async () => {
      const video = videoRef.current
      if (video) {
        try {
          const sample = await describeFace(video)
          if (stopped) return
          if (sample) {
            if (matchDistance(sample.descriptor, profile) < MATCH_THRESHOLD) {
              mismatches = 0
              setStatus('match')
            } else if (++mismatches >= 2) {
              setStatus('stranger')
            }
          } else {
            setStatus((s) => (s === 'loading' ? 'checking' : s))
          }
        } catch {
          if (!stopped) setStatus('off') // model failed to load — don't trap the user
          return
        }
      }
      if (!stopped) timer = window.setTimeout(check, intervalMs)
    }
    timer = window.setTimeout(check, 600)
    return () => {
      stopped = true
      window.clearTimeout(timer)
    }
  }, [enabled, profile, videoRef, intervalMs])

  return status
}
