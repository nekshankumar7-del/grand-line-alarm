import { createBrowserRouter, Navigate } from 'react-router'
import { LandingPage } from '@/features/site/LandingPage'
import { AppLayout } from './layouts/AppLayout'
import { RootLayout } from './layouts/RootLayout'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      // Full-screen alarm flow (no install banner).
      { path: '/app/ring', lazy: async () => ({ Component: (await import('@/features/alarms/ringing/RingPage')).RingPage }) },
      { path: '/app/trial', lazy: async () => ({ Component: (await import('@/features/alarms/ringing/TrialPage')).TrialPage }) },
      { path: '/app/victory', lazy: async () => ({ Component: (await import('@/features/alarms/ringing/VictoryPage')).VictoryPage }) },
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
