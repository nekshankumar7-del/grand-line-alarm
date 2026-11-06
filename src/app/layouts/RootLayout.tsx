import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { Outlet, useLocation, useNavigation } from 'react-router'
import { useAlarmEngine } from '@/features/alarms/useAlarmEngine'
import { InstallCelebration } from '@/features/install'
import { UpdatePrompt } from '@/pwa/UpdatePrompt'
import { duration, ease } from '@/motion/tokens'

/** Warm the code for every screen in the background so taps feel instant. */
function usePrefetchScreens() {
  useEffect(() => {
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
    const idle = (cb: () => void) => (ric ? ric(cb) : window.setTimeout(cb, 1200))
    idle(() => {
      void import('@/features/watchtower/WatchtowerPage').catch(() => undefined)
      void import('@/features/alarms/editor/AlarmEditorPage').catch(() => undefined)
      void import('@/features/faceid/FaceEnrollPage').catch(() => undefined)
    })
  }, [])
}

/** Fade out the HTML launch splash once the app has rendered. */
function useHideSplash() {
  useEffect(() => {
    const el = document.getElementById('splash')
    if (!el) return
    const id = window.setTimeout(() => {
      el.classList.add('hide')
      window.setTimeout(() => el.remove(), 500)
    }, 250)
    return () => window.clearTimeout(id)
  }, [])
}

/** Thin progress line at the top while a screen's code is loading (instead of a full-screen animation). */
function TopProgress() {
  const navigation = useNavigation()
  const busy = navigation.state !== 'idle'
  return (
    <AnimatePresence>
      {busy && (
        <motion.div
          key="top-progress"
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[3px] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
          <motion.div
            className="h-full w-1/3 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]"
            initial={{ x: '-100%' }}
            animate={{ x: '320%' }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Smooth, enter-only page transitions: the new page renders immediately and fades in.
 * (No full-screen logo animation on every tap — the logo shows once, as the launch splash.)
 */
export function RootLayout() {
  const { pathname } = useLocation()
  useAlarmEngine()
  usePrefetchScreens()
  useHideSplash()

  return (
    <>
      <TopProgress />
      <motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: duration.fast, ease: ease.out }}>
        <Outlet />
      </motion.div>
      <InstallCelebration />
      <UpdatePrompt />
    </>
  )
}
