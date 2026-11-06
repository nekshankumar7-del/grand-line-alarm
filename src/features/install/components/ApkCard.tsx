import { motion } from 'motion/react'
import { Button, ButtonAnchor } from '@/components/ui/Button'
import { downloads } from '@/config/app'
import { fadeUp } from '@/motion/variants'

export function ApkCard() {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-3xl border-[3px] border-ink bg-ink/40 p-5 text-left backdrop-blur hard-shadow"
    >
      <p className="font-display text-2xl tracking-wide text-gold">Android: most reliable alarms</p>
      <p className="mt-1 text-sm text-white/85">
        The native Android app rings even when the app is closed or your phone is locked. Use it if you never
        want to miss an alarm.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {downloads.apkAvailable ? (
          <ButtonAnchor href={downloads.apkUrl} download variant="secondary" size="md">
            🤖 Download APK
          </ButtonAnchor>
        ) : (
          <Button variant="ghost" size="md" disabled>
            APK coming soon
          </Button>
        )}
        {downloads.playStoreUrl && (
          <ButtonAnchor href={downloads.playStoreUrl} external variant="ghost" size="md">
            ▶ Get it on Google Play
          </ButtonAnchor>
        )}
      </div>
      {downloads.apkAvailable && (
        <p className="mt-3 text-xs text-white/70">
          Your phone may ask you to allow installs from “unknown sources”. Allow it for your browser, then open the
          downloaded file.
        </p>
      )}
    </motion.div>
  )
}
