export const pad = (n: number) => String(n).padStart(2, '0')

export const formatTime = (hour: number, minute: number) => `${pad(hour)}:${pad(minute)}`

export const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const same = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i])

export function describeDays(days: number[]) {
  const sorted = [...days].sort()
  if (sorted.length === 0) return 'Once'
  if (sorted.length === 7) return 'Every day'
  if (same(sorted, [1, 2, 3, 4, 5])) return 'Weekdays'
  if (same(sorted, [0, 6])) return 'Weekends'
  return sorted.map((d) => DAY_NAMES[d]).join(' · ')
}

export function formatCountdown(ms: number) {
  if (ms < 60_000) return 'less than a minute'
  const mins = Math.round(ms / 60_000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  return h ? `${h}h ${m}m` : `${m}m`
}
