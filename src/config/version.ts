/** App version (from package.json) + build stamp, injected at build time. */
export const APP_VERSION = __APP_VERSION__
export const BUILD_ID = __BUILD_ID__
export const BUILD_TIME = __BUILD_TIME__

export const versionLabel = `v${APP_VERSION} (${BUILD_ID})`

/** Newest first. Shown once in "What's new" after updating. */
export const CHANGELOG: Array<{ version: string; date: string; notes: string[] }> = [
  {
    version: '1.1.0',
    date: '2026-11-06',
    notes: [
      'In-app updates: you’re asked before switching to a new version',
      'Version number shown in your case file',
      'Deeper, more commanding Sentinel voice',
      'Alarm sounds from your device, with the exact part of the song you choose',
      'Delete buttons on every alarm',
      'Smoother loading and faster screens on phones',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-11-06',
    notes: ['Night Sentinel launch: missions, Face ID, hanging Sentinel, city moods'],
  },
]

/** Compare dotted versions: >0 if a is newer than b. */
export function compareVersions(a: string, b: string) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d) return d
  }
  return 0
}
