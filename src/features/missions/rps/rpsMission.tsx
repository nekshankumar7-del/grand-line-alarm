import type { GestureRecognizerResult, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ChipGroup } from '@/components/ui/ChipGroup'
import { loadGestureRecognizer } from '@/features/vision/visionTasks'
import { VisionShell } from '@/features/vision/VisionShell'
import { cn } from '@/lib/cn'
import { spring } from '@/motion/tokens'
import { defineMission, type MissionRunnerProps } from '../types'

type Throw = 'rock' | 'paper' | 'scissors'
type Outcome = 'win' | 'lose' | 'draw' | 'slow'
type Phase = 'waiting' | 'countdown' | 'capture' | 'result'

interface RpsConfig {
  bestOf: '3' | '5'
}

const EMOJI: Record<Throw, string> = { rock: '✊', paper: '✋', scissors: '✌️' }
const BEATS: Record<Throw, Throw> = { rock: 'scissors', paper: 'rock', scissors: 'paper' }
const THROWS: Throw[] = ['rock', 'paper', 'scissors']
const WORDS = ['ROCK…', 'PAPER…', 'SCISSORS…']
const OUTCOME_TEXT: Record<Outcome, string> = { win: 'YOU WIN!', lose: 'YOU LOSE!', draw: 'DRAW!', slow: 'TOO SLOW!' }

const HAND: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
]

const GESTURE_MAP: Record<string, Throw> = { Closed_Fist: 'rock', Open_Palm: 'paper', Victory: 'scissors' }

function classify(result: GestureRecognizerResult): Throw | null {
  const g = result.gestures[0]?.[0]
  if (g && g.score > 0.55 && GESTURE_MAP[g.categoryName]) return GESTURE_MAP[g.categoryName]
  const lm = result.landmarks[0]
  if (!lm) return null
  // Fallback: count extended fingers from landmark geometry.
  const d = (a: NormalizedLandmark, b: NormalizedLandmark) => Math.hypot(a.x - b.x, a.y - b.y)
  const ext = [[8, 6], [12, 10], [16, 14], [20, 18]].map(([tip, pip]) => d(lm[tip], lm[0]) > d(lm[pip], lm[0]) * 1.12)
  if (ext.every(Boolean)) return 'paper'
  if (ext[0] && ext[1] && !ext[2] && !ext[3]) return 'scissors'
  if (ext.every((e) => !e)) return 'rock'
  return null
}

function drawHand(canvas: HTMLCanvasElement | null, lm: NormalizedLandmark[] | undefined, good: boolean) {
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (!lm) return
  const { width: w, height: h } = canvas
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.strokeStyle = good ? '#ffc53d' : '#e9e9e9'
  ctx.shadowColor = ctx.strokeStyle
  ctx.shadowBlur = 10
  for (const [a, b] of HAND) {
    ctx.beginPath()
    ctx.moveTo(lm[a].x * w, lm[a].y * h)
    ctx.lineTo(lm[b].x * w, lm[b].y * h)
    ctx.stroke()
  }
  ctx.shadowBlur = 0
  ctx.fillStyle = '#e63946'
  for (const p of lm) {
    ctx.beginPath()
    ctx.arc(p.x * w, p.y * h, 4.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

function RpsRunner({ config, onProgress, onComplete, onUnavailable }: MissionRunnerProps<RpsConfig>) {
  const need = config.bestOf === '5' ? 3 : 2
  const [phase, setPhase] = useState<Phase>('waiting')
  const [word, setWord] = useState('')
  const [round, setRound] = useState<{ you: Throw | null; cpu: Throw; outcome: Outcome } | null>(null)
  const [score, setScore] = useState({ wins: 0, losses: 0 })
  const s = useRef({ phase: 'waiting' as Phase, handMs: 0, votes: { rock: 0, paper: 0, scissors: 0 } as Record<Throw, number>, wins: 0, losses: 0, doneAt: 0 })
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))
  const go = (p: Phase) => {
    s.current.phase = p
    setPhase(p)
  }

  function startRound() {
    go('countdown')
    setRound(null)
    WORDS.forEach((w, i) => later(i * 650, () => setWord(w)))
    later(WORDS.length * 650, () => {
      setWord('SHOOT!')
      s.current.votes = { rock: 0, paper: 0, scissors: 0 }
      go('capture')
    })
    later(WORDS.length * 650 + 900, resolve)
  }

  function resolve() {
    const st = s.current
    const [best, count] = (Object.entries(st.votes) as Array<[Throw, number]>).sort((a, b) => b[1] - a[1])[0]
    const you = count >= 3 ? best : null
    const cpu = THROWS[Math.floor(Math.random() * 3)]
    const outcome: Outcome = !you ? 'slow' : you === cpu ? 'draw' : BEATS[you] === cpu ? 'win' : 'lose'
    if (outcome === 'win') st.wins += 1
    if (outcome === 'lose') st.losses += 1
    setScore({ wins: st.wins, losses: st.losses })
    setRound({ you, cpu, outcome })
    go('result')
    navigator.vibrate?.(outcome === 'win' ? [60, 40, 60] : 200)
    if (st.wins >= need) st.doneAt = performance.now() + 1600
    else later(1900, () => {
      st.handMs = 0
      go('waiting')
    })
  }

  const overlay = (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="absolute left-1/2 top-16 flex -translate-x-1/2 gap-1.5">
        {Array.from({ length: need }, (_, i) => (
          <motion.span key={i} animate={{ scale: i < score.wins ? [1.6, 1] : 1 }} className={cn('text-3xl', i < score.wins ? '' : 'opacity-30 grayscale')}>
            ⭐
          </motion.span>
        ))}
      </div>
      <AnimatePresence mode="popLayout">
        {(phase === 'countdown' || phase === 'capture') && (
          <motion.p
            key={word}
            initial={{ scale: 3, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={spring.bouncy}
            className={cn('font-display text-7xl tracking-wide text-outline manga-shadow', word === 'SHOOT!' ? 'text-accent' : 'text-gold')}
          >
            {word}
          </motion.p>
        )}
        {phase === 'result' && round && (
          <motion.div key="result" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={spring.bouncy} className="glass rounded-3xl px-6 py-4 text-center">
            <div className="flex items-center gap-5 text-6xl">
              <motion.span initial={{ x: -60, rotate: -40 }} animate={{ x: 0, rotate: 0 }}>{round.you ? EMOJI[round.you] : '❓'}</motion.span>
              <span className="font-display text-3xl text-white/70">VS</span>
              <motion.span initial={{ x: 60, rotate: 40 }} animate={{ x: 0, rotate: 0 }}>{EMOJI[round.cpu]}</motion.span>
            </div>
            <p className={cn('mt-1 font-display text-5xl tracking-wide text-outline', round.outcome === 'win' ? 'text-gold' : round.outcome === 'lose' ? 'text-accent' : 'text-white')}>
              {OUTCOME_TEXT[round.outcome]}
            </p>
            <p className="text-xs font-bold text-white/70">you · the Sentinel</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <VisionShell
      load={loadGestureRecognizer}
      badge={`✊✋✌️ Win ${need}`}
      overlay={overlay}
      onProgress={onProgress}
      onComplete={onComplete}
      onUnavailable={onUnavailable}
      onFrame={(model, video, info, canvas) => {
        const st = s.current
        const progress = st.wins / need
        if (info.frozen) return { hint: 'Camera feed frozen!', good: false, progress, done: false }
        const result = model.recognizeForVideo(video, info.now)
        const current = classify(result)
        drawHand(canvas, result.landmarks[0], Boolean(current))
        if (st.doneAt && info.now > st.doneAt) return { hint: 'VICTORY!', good: true, progress: 1, done: true }

        switch (st.phase) {
          case 'waiting':
            st.handMs = result.landmarks[0] ? st.handMs + info.dt : 0
            if (st.handMs > 500) startRound()
            return { hint: `Raise your hand ✋ to play (${st.wins}/${need} wins · ${st.losses} losses)`, good: Boolean(result.landmarks[0]), progress, done: false }
          case 'capture':
            if (current) st.votes[current] += 1
            return { hint: current ? `${EMOJI[current]} locked in!` : 'THROW NOW!', good: Boolean(current), progress, done: false }
          case 'countdown':
            return { hint: 'Get ready to throw…', good: Boolean(result.landmarks[0]), progress, done: false }
          default:
            return { hint: st.wins >= need ? 'VICTORY!' : 'Next round coming…', good: true, progress, done: false }
        }
      }}
    />
  )
}

function RpsEditor({ value, onChange }: { value: RpsConfig; onChange(c: RpsConfig): void }) {
  return (
    <ChipGroup
      label="Match"
      value={value.bestOf}
      options={[
        { value: '3', label: 'Win 2' },
        { value: '5', label: 'Win 3' },
      ]}
      onChange={(bestOf) => onChange({ bestOf })}
    />
  )
}

export const rpsMission = defineMission<RpsConfig>({
  id: 'rps',
  name: 'Interrogation Duel',
  icon: '✊',
  description: 'Out-guess the Sentinel with real hand gestures. Losing just starts a new round.',
  needsCamera: true,
  visionModel: 'gesture',
  defaultConfig: { bestOf: '3' },
  summary: (c) => `win ${c.bestOf === '5' ? 3 : 2} rounds`,
  ConfigEditor: RpsEditor,
  Runner: RpsRunner,
})
