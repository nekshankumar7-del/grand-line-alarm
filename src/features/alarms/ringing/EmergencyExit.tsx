import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { normalizeCode, useSettingsStore } from '@/store/settingsStore'
import { emergencyExit } from '../actions'
import { exitStrictFullscreen } from '../useStrictLock'

/** Hidden "I'm sick / emergency" escape hatch — needs the 30-char code so the app is never a real trap. */
export function EmergencyExit() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const backupCode = useSettingsStore((s) => s.backupCode)
  const navigate = useNavigate()

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (backupCode && normalizeCode(input) === normalizeCode(backupCode)) {
      await emergencyExit()
      exitStrictFullscreen()
      navigate('/app', { replace: true })
    } else {
      setError(true)
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-bold text-white/40 underline">
        I’m sick / emergency
      </button>
      <Sheet open={open} title="Emergency stop" onClose={() => setOpen(false)}>
        <form onSubmit={(e) => void submit(e)} className="mt-3 space-y-3">
          <p>Enter the 30-character emergency code you saved when you created your first alarm. This is logged and earns no reputation.</p>
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setError(false)
            }}
            autoComplete="off"
            spellCheck={false}
            aria-label="Emergency code"
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
            className="w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2 font-mono text-lg"
          />
          {error && (
            <p role="alert" className="font-bold text-accent">
              That code is wrong.
            </p>
          )}
          <Button type="submit" className="w-full">
            Stop the alarm
          </Button>
        </form>
      </Sheet>
    </>
  )
}
