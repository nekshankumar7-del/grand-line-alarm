import { Outlet } from 'react-router'
import { InstallBanner } from '@/features/install'

export function AppLayout() {
  return (
    <>
      <InstallBanner />
      <Outlet />
    </>
  )
}
