import { useMemo } from 'react'
import { useInstallStore } from '@/store/installStore'
import { resolveInstallOption } from './installOption'
import { detectPlatform } from './platform'

export function useInstallOption() {
  const canPrompt = useInstallStore((s) => s.deferred !== null)
  const standalone = useInstallStore((s) => s.standalone)
  const installed = useInstallStore((s) => s.installed)
  const platform = useMemo(detectPlatform, [])

  const option = resolveInstallOption({ platform, standalone, installed, canPrompt })
  return { option, platform }
}
