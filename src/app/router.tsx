import { createBrowserRouter, Navigate } from 'react-router'
import { RingPage } from '@/features/alarms/ringing/RingPage'
import { TrialPage } from '@/features/alarms/ringing/TrialPage'
import { VictoryPage } from '@/features/alarms/ringing/VictoryPage'
import { LandingPage } from '@/features/site/LandingPage'
import { RouteError } from './RouteError'
import { AppLayout } from './layouts/AppLayout'
import { RootLayout } from './layouts/RootLayout'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <LandingPage /> },
      // Full-screen alarm flow — bundled (not lazy) so finishing an alarm never needs a download,
      // even right after a new deployment removed older code-split files.
      { path: '/app/ring', element: <RingPage /> },
      { path: '/app/trial', element: <TrialPage /> },
      { path: '/app/victory', element: <VictoryPage /> },
      {
        path: '/app',
        element: <AppLayout />,
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/features/watchtower/WatchtowerPage')).WatchtowerPage }),
          },
          {
            path: 'face',
            lazy: async () => ({ Component: (await import('@/features/faceid/FaceEnrollPage')).FaceEnrollPage }),
          },
          {
            path: 'alarms/new',
            lazy: async () => ({ Component: (await import('@/features/alarms/editor/AlarmEditorPage')).AlarmEditorPage }),
          },
          {
            path: 'alarms/:id',
            lazy: async () => ({ Component: (await import('@/features/alarms/editor/AlarmEditorPage')).AlarmEditorPage }),
          },
          { path: '*', element: <Navigate to="/app" replace /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
