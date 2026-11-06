import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { groupCode } from '@/store/settingsStore'

export function BackupCodeSheet({ code, open, onDone }: { code: string; open: boolean; onDone(): void }) {
  return (
    <Sheet open={open} title="Your emergency code" onClose={() => undefined}>
      <p className="mt-2">
        If you are ever sick or in an emergency, this code stops a ringing alarm without completing the trials. It is shown <b>only once</b> — write it down
        somewhere away from your bed.
      </p>
      <p className="mt-4 select-all break-all rounded-xl border-[3px] border-ink bg-white p-3 text-center font-mono text-xl font-bold tracking-wider">
        {groupCode(code)}
      </p>
      <Button className="mt-5 w-full" onClick={onDone}>
        I have saved it
      </Button>
    </Sheet>
  )
}
