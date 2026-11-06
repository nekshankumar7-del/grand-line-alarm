/**
 * One-time migration from the app's previous storage names to Night Sentinel's.
 * Must be the FIRST import in main.tsx so it runs before any store hydrates.
 */
const KEYS: Array<[from: string, to: string]> = [
  ['gla-settings', 'ns-settings'],
  ['gla-player', 'ns-player'],
  ['gla-theme', 'ns-theme'],
  ['gla-install', 'ns-install'],
]

try {
  for (const [from, to] of KEYS) {
    const old = localStorage.getItem(from)
    if (old !== null && localStorage.getItem(to) === null) localStorage.setItem(to, old)
    localStorage.removeItem(from)
  }
  localStorage.removeItem('gla-edition')
  sessionStorage.removeItem('gla-edition-lock')
} catch {
  /* storage unavailable (private mode) */
}
