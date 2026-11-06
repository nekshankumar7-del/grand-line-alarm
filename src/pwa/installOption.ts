import type { Platform } from './platform'
import type { InstallOption } from './types'

interface InstallContext {
  platform: Platform
  standalone: boolean
  installed: boolean
  canPrompt: boolean
}

export function resolveInstallOption({ platform, standalone, installed, canPrompt }: InstallContext): InstallOption {
  if (standalone) return 'open'
  if (canPrompt) return 'prompt'
  if (installed) return 'open'
  if (platform === 'ios') return 'ios-guide'
  return 'manual-guide'
}
