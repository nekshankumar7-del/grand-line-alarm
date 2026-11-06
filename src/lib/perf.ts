/**
 * Lite mode: phones and lower-powered devices get the same look with fewer moving/blurred parts.
 * Decided once at startup; also adds `html.lite` so CSS can drop expensive effects (backdrop blur…).
 */
function detectLite() {
  if (typeof window === 'undefined') return false
  try {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
    const fewCores = (nav.hardwareConcurrency ?? 8) <= 6
    const lowMemory = (nav.deviceMemory ?? 8) <= 4
    const saveData = nav.connection?.saveData === true
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    return coarse || fewCores || lowMemory || saveData || reduced
  } catch {
    return false
  }
}

export const LITE = detectLite()

if (typeof document !== 'undefined' && LITE) document.documentElement.classList.add('lite')
