/** Night Sentinel's original emblem: an open eye cradled by a crescent moon. */
export function SentinelEmblem({ className, color = '#1b1424' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path d="M62 8 A44 44 0 1 0 92 70 A36 36 0 1 1 62 8Z" fill={color} />
      <path d="M22 52 Q50 28 78 52 Q50 76 22 52Z" fill={color} />
      <path d="M28 52 Q50 34 72 52 Q50 70 28 52Z" fill="none" stroke="#fef3c7" strokeWidth={3} />
      <circle cx={50} cy={52} r={9} fill="#fef3c7" />
      <circle cx={50} cy={52} r={4.5} fill={color} />
    </svg>
  )
}
