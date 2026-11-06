import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeName = 'dawn' | 'midnight' | 'downpour' | 'neon'

export interface ThemeInfo {
  id: ThemeName
  label: string
  icon: string
  blurb: string
  /** Small gradient used for the picker preview card. */
  preview: string
}

export const THEMES: ThemeInfo[] = [
  { id: 'dawn', label: 'Dawn', icon: '🌅', blurb: 'Sunrise over the skyline', preview: 'linear-gradient(to bottom,#1e3a8a,#9d4edd 40%,#f97316 75%,#fcd34d)' },
  { id: 'midnight', label: 'Midnight', icon: '🌕', blurb: 'Full moon over the skyline', preview: 'linear-gradient(to bottom,#0b1026,#1e2a5a 70%,#0f172a)' },
  { id: 'downpour', label: 'Downpour', icon: '🌧️', blurb: 'Rain, fog & lightning', preview: 'linear-gradient(to bottom,#111827,#374151 70%,#0b0f19)' },
  { id: 'neon', label: 'Neon', icon: '🌆', blurb: 'Glowing signs & wet streets', preview: 'linear-gradient(to bottom,#1a0533,#5b21b6 55%,#db2777 85%,#0f0a1f)' },
]

interface ThemeState {
  theme: ThemeName
  setTheme(theme: ThemeName): void
}

export const useThemeStore = create<ThemeState>()(
  persist((set) => ({ theme: 'midnight', setTheme: (theme) => set({ theme }) }), {
    name: 'ns-theme',
    version: 2,
    migrate: (persisted) => {
      const s = persisted as { theme?: string; sentinelTheme?: string }
      const t = s.sentinelTheme ?? s.theme
      return { theme: t === 'downpour' || t === 'neon' || t === 'dawn' ? t : 'midnight' } as ThemeState
    },
  }),
)
