export type GuideKind = 'ios' | 'manual'

export interface GuideStep {
  icon: string
  text: string
}

export const GUIDES: Record<GuideKind, { title: string; intro: string; steps: GuideStep[] }> = {
  ios: {
    title: 'Add to Home Screen',
    intro: 'Safari installs apps from the Share menu. Three taps and you’re aboard!',
    steps: [
      { icon: '⬆️', text: 'Tap the Share button in Safari’s toolbar.' },
      { icon: '➕', text: 'Scroll down and tap “Add to Home Screen”.' },
      { icon: '🗼', text: 'Tap “Add”. Night Sentinel now lives on your home screen.' },
    ],
  },
  manual: {
    title: 'Install the app',
    intro: 'Your browser didn’t offer one-tap install. You can still add it yourself:',
    steps: [
      { icon: '⋮', text: 'Open your browser menu (⋮ or ⋯).' },
      { icon: '📲', text: 'Choose “Install app” or “Add to Home screen”.' },
      { icon: '🧭', text: 'No option? Open this page in Chrome, Edge or Safari, which support installing.' },
    ],
  },
}
