import { useState } from 'react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { useInstallOption } from '@/pwa/useInstallOption'
import { useInstallStore } from '@/store/installStore'
import type { GuideKind } from '../data/guideSteps'
import { InstallGuideSheet } from './InstallGuideSheet'

interface DownloadButtonProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
  /** Where "Open App" goes once installed. */
  openTo?: string
}

export function DownloadButton({ size = 'lg', className, label = '⬇ Download App', openTo = '/app' }: DownloadButtonProps) {
  const { option } = useInstallOption()
  const promptInstall = useInstallStore((s) => s.promptInstall)
  const [guide, setGuide] = useState<GuideKind | null>(null)

  if (option === 'open') {
    return (
      <ButtonLink to={openTo} variant="secondary" size={size} className={className}>
        ⚓ Open App
      </ButtonLink>
    )
  }

  async function handleClick() {
    if (option === 'prompt') {
      const outcome = await promptInstall()
      if (outcome !== 'unavailable') return
    }
    setGuide(option === 'ios-guide' ? 'ios' : 'manual')
  }

  return (
    <>
      <Button size={size} className={className} onClick={handleClick}>
        {label}
      </Button>
      <InstallGuideSheet kind={guide} onClose={() => setGuide(null)} />
    </>
  )
}
