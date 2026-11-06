import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useLocation, useOutlet } from 'react-router'
import { WaveWipe } from '@/components/effects/WaveWipe'
import { useAlarmEngine } from '@/features/alarms/useAlarmEngine'
import { InstallCelebration } from '@/features/install'
import { pageTransition } from '@/motion/variants'

function FrozenOutlet() {
  const outlet = useOutlet()
  const [frozen] = useState(outlet)
  return frozen
}

export function RootLayout() {
  const { pathname } = useLocation()
  useAlarmEngine()

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={pathname} {...pageTransition}>
          <FrozenOutlet />
        </motion.div>
      </AnimatePresence>
      <WaveWipe routeKey={pathname} />
      <InstallCelebration />
    </>
  )
}
