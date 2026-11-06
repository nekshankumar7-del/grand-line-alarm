import { motion } from 'motion/react'

const COLORS = ['var(--c-gold)', 'var(--c-accent)', 'var(--c-foam)', 'var(--c-sky)', 'var(--c-sand)']
const COUNT = 48

const PIECES = Array.from({ length: COUNT }, (_, i) => {
  const angle = (i / COUNT) * Math.PI * 2
  const distance = 160 + ((i * 53) % 220)
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance - 120,
    rotate: (i * 97) % 720,
    color: COLORS[i % COLORS.length],
    size: 8 + ((i * 7) % 10),
    round: i % 3 === 0,
  }
})

export function ConfettiBurst() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden">
      {PIECES.map((piece, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{
            width: piece.size,
            height: piece.round ? piece.size : piece.size * 1.6,
            borderRadius: piece.round ? '9999px' : '2px',
            background: piece.color,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: piece.x, y: [0, piece.y, piece.y + 400], opacity: [1, 1, 0], rotate: piece.rotate }}
          transition={{ duration: 2.2, ease: 'easeOut', times: [0, 0.35, 1] }}
        />
      ))}
    </div>
  )
}
