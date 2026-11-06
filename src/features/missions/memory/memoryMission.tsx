import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ChipGroup } from '@/components/ui/ChipGroup'
import { cn } from '@/lib/cn'
import { spring } from '@/motion/tokens'
import { defineMission, type MissionRunnerProps } from '../types'

interface MemoryConfig {
  pairs: '6' | '8'
}

const SYMBOLS = {
  sentinel: ['🔍', '🧤', '📼', '🗝️', '🔦', '📸', '🧾', '💼'],
}

interface Card {
  id: number
  symbol: string
}

function deal(pairs: number, symbols: string[]): Card[] {
  const chosen = symbols.slice(0, pairs)
  return [...chosen, ...chosen]
    .map((symbol, i) => ({ id: i, symbol, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(({ id, symbol }) => ({ id, symbol }))
}

function MemoryRunner({ config, onProgress, onComplete }: MissionRunnerProps<MemoryConfig>) {
  const pairs = Number(config.pairs)
  const [cards] = useState(() => deal(pairs, SYMBOLS.sentinel))
  const [open, setOpen] = useState<number[]>([])
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [peek, setPeek] = useState(true)
  const [misses, setMisses] = useState(0)

  // Short preview so it's a memory test, not a guessing game.
  useEffect(() => {
    const id = window.setTimeout(() => setPeek(false), 1600)
    return () => window.clearTimeout(id)
  }, [])

  function flip(card: Card) {
    if (peek || open.length === 2 || open.includes(card.id) || matched.has(card.symbol)) return
    const next = [...open, card.id]
    setOpen(next)
    if (next.length < 2) return
    const [a, b] = next.map((id) => cards.find((c) => c.id === id)!)
    if (a.symbol === b.symbol) {
      const done = new Set(matched).add(a.symbol)
      navigator.vibrate?.(40)
      window.setTimeout(() => {
        setMatched(done)
        setOpen([])
        onProgress(done.size / pairs)
        if (done.size === pairs) window.setTimeout(onComplete, 600)
      }, 350)
    } else {
      setMisses((m) => m + 1)
      window.setTimeout(() => setOpen([]), 800)
    }
  }

  const cols = pairs === 8 ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-4'
  const back = 'bg-[repeating-linear-gradient(45deg,#1f2937_0_8px,#111827_8px_16px)]'

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-center font-display text-2xl tracking-wide">
        {peek ? 'Memorise the evidence…' : `Pairs ${matched.size}/${pairs} · misses ${misses}`}
      </p>
      <div className={cn('grid w-full max-w-sm gap-2.5', cols)}>
        {cards.map((card, i) => {
          const faceUp = peek || open.includes(card.id) || matched.has(card.symbol)
          const done = matched.has(card.symbol)
          return (
            <motion.button
              key={card.id}
              type="button"
              aria-label={faceUp ? card.symbol : 'Hidden card'}
              onClick={() => flip(card)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: done ? 0.55 : 1, y: 0, rotateY: faceUp ? 0 : 180, scale: done ? 0.92 : 1 }}
              transition={{ ...spring.snappy, delay: i * 0.02 }}
              whileTap={{ scale: 0.9 }}
              className="relative aspect-[3/4] [transform-style:preserve-3d]"
            >
              <span className="absolute inset-0 grid place-items-center rounded-xl border-[3px] border-ink bg-paper text-4xl [backface-visibility:hidden]">{card.symbol}</span>
              <span className={cn('absolute inset-0 grid place-items-center rounded-xl border-[3px] border-ink [backface-visibility:hidden] [transform:rotateY(180deg)]', back)}>
                <span className="font-display text-2xl text-gold/80">?</span>
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function MemoryEditor({ value, onChange }: { value: MemoryConfig; onChange(c: MemoryConfig): void }) {
  return (
    <ChipGroup
      label="Pairs"
      value={value.pairs}
      options={[
        { value: '6', label: '6 pairs' },
        { value: '8', label: '8 pairs' },
      ]}
      onChange={(pairs) => onChange({ pairs })}
    />
  )
}

export const memoryMission = defineMission<MemoryConfig>({
  id: 'memory',
  name: 'Evidence Match',
  icon: '🗂️',
  description: 'Memorise the evidence, then flip the cards to find every matching pair. No camera.',
  needsCamera: false,
  defaultConfig: { pairs: '6' },
  summary: (c) => `${c.pairs} pairs`,
  ConfigEditor: MemoryEditor,
  Runner: MemoryRunner,
})
