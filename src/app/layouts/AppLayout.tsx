import { motion } from 'motion/react'
import { Link, Outlet, useLocation } from 'react-router'
import { InstallBanner } from '@/features/install'
import { cn } from '@/lib/cn'
import { spring } from '@/motion/tokens'

const TABS = [
  { to: '/app', label: 'Home', icon: '🗼', match: (p: string, q: string) => p === '/app' && !q.includes('profile') },
  { to: '/app/alarms/new', label: 'New', icon: '➕', match: (p: string) => p.startsWith('/app/alarms') },
  { to: '/app/face', label: 'Face ID', icon: '🪪', match: (p: string) => p === '/app/face' },
  { to: '/app?profile=1', label: 'Profile', icon: '🗂️', match: (p: string, q: string) => p === '/app' && q.includes('profile') },
]

/** Mobile-first bottom tab bar (hidden on desktop and inside the alarm editor). */
function TabBar() {
  const { pathname, search } = useLocation()
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#05070d]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map((t) => {
          const active = t.match(pathname, search)
          return (
            <li key={t.label}>
              <Link to={t.to} aria-current={active ? 'page' : undefined} className="relative flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-bold">
                {active && <motion.span layoutId="tab-active" transition={spring.snappy} className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-amber-400 shadow-[0_0_12px_#f59e0b]" />}
                <span className={cn('text-xl transition-transform', active && 'scale-110')}>{t.icon}</span>
                <span className={active ? 'text-amber-400' : 'text-white/60'}>{t.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function AppLayout() {
  const { pathname } = useLocation()
  const showTabs = !pathname.startsWith('/app/alarms')
  return (
    <>
      <InstallBanner />
      <Outlet />
      {showTabs && <TabBar />}
    </>
  )
}
