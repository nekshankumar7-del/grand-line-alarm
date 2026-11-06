import { motion, useAnimationControls } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { ChipGroup } from '@/components/ui/ChipGroup'
import { Stepper } from '@/components/ui/Stepper'
import { defineMission, type MissionRunnerProps } from '../types'

type Difficulty = 'easy' | 'normal' | 'hard'

interface MathConfig {
  count: number
  difficulty: Difficulty
}

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))

function makeProblem(difficulty: Difficulty) {
  if (difficulty === 'easy') {
    const a = rand(12, 59)
    const b = rand(11, 39)
    return { text: `${a} + ${b}`, answer: a + b }
  }
  if (difficulty === 'normal') {
    const a = rand(3, 12)
    const b = rand(4, 12)
    const c = rand(11, 49)
    return { text: `${a} × ${b} + ${c}`, answer: a * b + c }
  }
  const a = rand(12, 29)
  const b = rand(3, 9)
  const c = rand(11, 99)
  return { text: `${a} × ${b} − ${c}`, answer: a * b - c }
}

function MathRunner({ config, onProgress, onComplete }: MissionRunnerProps<MathConfig>) {
  const [solved, setSolved] = useState(0)
  const [problem, setProblem] = useState(() => makeProblem(config.difficulty))
  const [input, setInput] = useState('')
  const [wrong, setWrong] = useState(false)
  const controls = useAnimationControls()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => inputRef.current?.focus(), [problem])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (input.trim() === '') return
    if (Number(input) === problem.answer) {
      const next = solved + 1
      setSolved(next)
      setWrong(false)
      onProgress(next / config.count)
      if (next >= config.count) return onComplete()
      void controls.start({ scale: [1, 1.15, 1], transition: { duration: 0.3 } })
    } else {
      setWrong(true)
      void controls.start({ x: [0, -14, 14, -10, 10, 0], transition: { duration: 0.4 } })
    }
    setProblem(makeProblem(config.difficulty))
    setInput('')
  }

  return (
    <form onSubmit={submit} className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-gold">
        Cipher {Math.min(solved + 1, config.count)} of {config.count}
      </p>
      <motion.p animate={controls} className="font-display text-6xl tracking-wide text-outline manga-shadow tabular-nums">
        {problem.text} = ?
      </motion.p>
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value.replace(/[^\d-]/g, ''))}
        inputMode="numeric"
        autoComplete="off"
        aria-label="Your answer"
        className="w-48 rounded-2xl border-[3px] border-ink bg-white px-4 py-3 text-center font-display text-4xl text-ink"
      />
      {wrong && <p className="font-bold text-accent" role="alert">Wrong! A new cipher is intercepted…</p>}
      <Button type="submit" size="lg">
        Answer!
      </Button>
    </form>
  )
}

function MathEditor({ value, onChange }: { value: MathConfig; onChange(c: MathConfig): void }) {
  return (
    <div className="space-y-3">
      <Stepper label="Problems" value={value.count} min={1} max={10} onChange={(count) => onChange({ ...value, count })} />
      <ChipGroup
        label="Difficulty"
        value={value.difficulty}
        options={[
          { value: 'easy', label: 'Easy' },
          { value: 'normal', label: 'Normal' },
          { value: 'hard', label: 'Hard' },
        ]}
        onChange={(difficulty) => onChange({ ...value, difficulty })}
      />
    </div>
  )
}

export const mathMission = defineMission<MathConfig>({
  id: 'math',
  name: 'Crack the Cipher',
  icon: '🔐',
  description: 'Solve intercepted number ciphers. No camera needed.',
  needsCamera: false,
  defaultConfig: { count: 3, difficulty: 'normal' },
  summary: (c) => `${c.count} ${c.difficulty} problems`,
  ConfigEditor: MathEditor,
  Runner: MathRunner,
})
