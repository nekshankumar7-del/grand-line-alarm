import { useEffect } from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { SentinelEmblem } from '@/editions/sentinel/SentinelEmblem'

const RELOAD_KEY = 'ns-chunk-reload'

/** True when a code-split file from an older deployment no longer exists. */
export function isStaleChunkError(error: unknown) {
  const msg = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '')
  return /dynamically imported module|Importing a module script failed|Failed to fetch dynamically|error loading dynamically|ChunkLoadError|Loading chunk/i.test(msg)
}

/** Reload once to pick up the new deployment (guarded so it can never loop). */
export function reloadOnceForNewVersion() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
    if (Date.now() - last < 15_000) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    /* storage unavailable — still reload */
  }
  location.reload()
  return true
}

/** Friendly recovery screen instead of the raw router error page. */
export function RouteError() {
  const error = useRouteError()
  const stale = isStaleChunkError(error)

  useEffect(() => {
    if (stale) reloadOnceForNewVersion()
  }, [stale])

  const detail = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : ''

  return (
    <main className="grid min-h-dvh place-items-center bg-[#05070d] px-6 text-center text-white">
      <div className="max-w-sm">
        <SentinelEmblem color="#f59e0b" className="mx-auto size-16" />
        <h1 className="mt-4 font-display text-4xl tracking-wide">{stale ? 'Updating…' : 'Something slipped'}</h1>
        <p className="mt-2 text-white/75">
          {stale
            ? 'A new version of Night Sentinel is available. Reloading to finish up — your alarms and progress are safe.'
            : 'The Sentinel caught an unexpected error. Your alarms, progress and any active alarm are saved.'}
        </p>
        <button type="button" onClick={() => location.reload()} className="mt-6 rounded-2xl bg-amber-400 px-6 py-3 font-display text-2xl tracking-wide text-black">
          ↻ Reload
        </button>
        <a href="/app" className="mt-3 block text-sm font-bold text-amber-300 underline">
          Back to the Watchtower
        </a>
        {!stale && detail && <p className="mt-6 break-words text-xs text-white/40">{detail}</p>}
      </div>
    </main>
  )
}
