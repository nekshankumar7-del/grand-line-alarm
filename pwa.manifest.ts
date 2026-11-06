import type { ManifestOptions } from 'vite-plugin-pwa'

export const manifest: Partial<ManifestOptions> = {
  id: '/app',
  name: 'Night Sentinel',
  short_name: 'Night Sentinel',
  description: 'A lone hooded guardian hangs over the city all night and only lets go when you complete your morning missions.',
  start_url: '/app',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  theme_color: '#020617',
  background_color: '#020617',
  categories: ['lifestyle', 'productivity', 'health'],
  shortcuts: [{ name: 'New alarm', short_name: 'New', url: '/app/alarms/new' }],
}
