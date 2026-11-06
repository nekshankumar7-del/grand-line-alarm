import { MotionConfig } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
import { useThemeStore } from '@/store/themeStore'

function useThemeSync() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    const deep = getComputedStyle(root).getPropertyValue('--c-sea-deep').trim()
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', deep)
  }, [theme])
}

export function AppProviders({ children }: { children: ReactNode }) {
  useThemeSync()
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
