import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState, type RefObject } from 'react'
import { db } from '@/db/db'
import { describeFace, matchDistance } from './faceId'

export type IdentityStatus = 'off' | 'loading' | 'checking' | 'match' | 'stranger'

/**
 * During a mission the user has ALREADY passed the strict identity check at the start,
 * so this background watch is deliberately lenient: it only exists to catch a clearly
 * different person taking over. Phone angles, lighting and stepping back must never block you.
 */
const SAME_PERSON = 0.62 // a lot looser than the strict start check
const MIN_FACE_PX = 70 // ignore tiny/far faces (e.g. full-body exercises)
const MISMATCHES_TO_FLAG = 3

export function useIdentityWatch(videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean, intervalMs = 4000) {
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
          if (!sample || sample.box.width < MIN_FACE_PX) {
            // no clear face (far away / turned) — not evidence of anyone else
            setStatus((s) => (s === 'loading' ? 'checking' : s))
          } else if (matchDistance(sample.descriptor, profile) < SAME_PERSON) {
            mismatches = 0
            setStatus('match')
          } else if (++mismatches >= MISMATCHES_TO_FLAG) {
            setStatus('stranger')
          }
        } catch {
          if (!stopped) setStatus('off') // model failed — never trap the user
          return
        }
      }
      if (!stopped) timer = window.setTimeout(check, intervalMs)
    }
    timer = window.setTimeout(check, 1500)
    return () => {
      stopped = true
      window.clearTimeout(timer)
    }
  }, [enabled, profile, videoRef, intervalMs])

  return status
}
