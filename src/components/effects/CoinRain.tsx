import { motion, useReducedMotion } from 'motion/react'

const COINS = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: (i * 0.13) % 2.4,
  duration: 2.2 + ((i * 7) % 10) / 10,
  size: 22 + ((i * 11) % 18),
  spin: i % 2 ? 720 : -720,
}))

/** Amber reputation tokens raining down after a victory. */
export function CoinRain() {
  const reduce = useReducedMotion()
  if (reduce) return null
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {COINS.map((c, i) => (
        <motion.span
          key={i}
          className="absolute -top-12 grid place-items-center rounded-full border-2 border-[#b8860b] font-display text-[#8a5a00]"
          style={{ left: c.left, width: c.size, height: c.size, fontSize: c.size * 0.55, background: 'radial-gradient(circle at 35% 30%, #fff3b0, #ffc53d 55%, #d4920f)' }}
          initial={{ y: -60, rotateY: 0, opacity: 1 }}
          animate={{ y: '110vh', rotateY: c.spin, opacity: [1, 1, 0.8] }}
          transition={{ duration: c.duration, delay: c.delay, ease: 'easeIn', repeat: 1, repeatDelay: 0.5 }}
        >
          ★
        </motion.span>
      ))}
    </div>
  )
}
