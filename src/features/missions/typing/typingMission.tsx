import { useEffect, useRef, useState } from 'react'
import { Stepper } from '@/components/ui/Stepper'
import { cn } from '@/lib/cn'
import { defineMission, type MissionRunnerProps } from '../types'

interface TypingConfig {
  count: number
}

const SENTENCES = [
  'The night watch is over and I am awake',
  'Lights on and feet on the floor',
  'Every legend starts by getting out of bed',
  'The city is waking up and so am I',
  'Rain on the window and coffee on the stove',
  'No signal is louder than my alarm',
  'I am ready before the sun rises',
]

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function TypingRunner({ config, onProgress, onComplete }: MissionRunnerProps<TypingConfig>) {
  const [queue] = useState(() => shuffled(SENTENCES).slice(0, config.count))
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const target = queue[index]

  useEffect(() => inputRef.current?.focus(), [index])

  function change(value: string) {
    setTyped(value)
    if (value === target) {
      const next = index + 1
      onProgress(next / queue.length)
      if (next >= queue.length) return onComplete()
      setIndex(next)
      setTyped('')
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-gold">
        Sentence {index + 1} of {queue.length} — type it exactly
      </p>
      <p className="rounded-2xl border-[3px] border-ink bg-paper px-4 py-3 text-2xl font-bold text-ink" aria-label={target}>
        {target.split('').map((ch, i) => (
          <span
            key={i}
            className={cn(
              i < typed.length && (typed[i] === ch ? 'text-green-700' : 'bg-accent/30 text-accent'),
              i === typed.length && 'underline decoration-4 decoration-accent',
            )}
          >
            {ch}
          </span>
        ))}
      </p>
      <textarea
        ref={inputRef}
        value={typed}
        onChange={(e) => change(e.target.value)}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        rows={2}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        aria-label="Type the sentence"
        className="w-full max-w-md rounded-2xl border-[3px] border-ink bg-white px-4 py-3 text-xl text-ink"
      />
      <p className="text-sm text-white/70">Pasting is disabled. Capitals and spaces count.</p>
    </div>
  )
}

function TypingEditor({ value, onChange }: { value: TypingConfig; onChange(c: TypingConfig): void }) {
  return <Stepper label="Sentences" value={value.count} min={1} max={5} onChange={(count) => onChange({ count })} />
}

export const typingMission = defineMission<TypingConfig>({
  id: 'typing',
  name: 'Decode the Wiretap',
  icon: '📡',
  description: 'Type the intercepted message exactly. Pasting is blocked.',
  needsCamera: false,
  defaultConfig: { count: 2 },
  summary: (c) => `${c.count} sentence${c.count > 1 ? 's' : ''}`,
  ConfigEditor: TypingEditor,
  Runner: TypingRunner,
})
