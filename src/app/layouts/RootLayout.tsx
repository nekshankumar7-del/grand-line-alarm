import { motion } from 'motion/react'
import { Outlet, useLocation } from 'react-router'
import { WaveWipe } from '@/components/effects/WaveWipe'
import { useAlarmEngine } from '@/features/alarms/useAlarmEngine'
import { InstallCelebration } from '@/features/install'
import { duration, ease } from '@/motion/tokens'

/**
 * Page transitions are enter-only: the new page renders immediately and fades in.
 * (The previous "wait for the old page's exit animation" mode could stall on phones —
 * e.g. quick double taps or paused animations — leaving taps on a dead page until refresh.)
 */
export function RootLayout() {
  const { pathname } = useLocation()
  useAlarmEngine()

  return (
    <>
      <motion.div key={pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: duration.base, ease: ease.out }}>
        <Outlet />
      </motion.div>
      <WaveWipe routeKey={pathname} />
      <InstallCelebration />
    </>
  )
}
