import { useEffect, useState } from 'react'

export function useTicker(intervalMs: number, paused = false) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => setTick((t) => t + 1), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs, paused])

  return tick
}
