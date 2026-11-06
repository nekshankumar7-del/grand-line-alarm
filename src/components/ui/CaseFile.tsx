import type { ReactNode } from 'react'
import { CountUp } from '@/components/ui/CountUp'
import { TiltCard } from '@/components/ui/TiltCard'
import { SentinelEmblem } from '@/editions/sentinel/SentinelEmblem'
import { APP } from '@/editions/editions'
import { cn } from '@/lib/cn'

interface CaseFileProps {
  name: string
  reputation: number
  title: string
  subtitle?: string
  portrait?: ReactNode
  className?: string
}

/** Dossier card for the player: clipped photo, classified stamp, reputation counter. */
export function CaseFile({ name, reputation, title, subtitle, portrait, className }: CaseFileProps) {
  return (
    <TiltCard className={cn('relative w-64 rounded-md bg-[#e7e2d6] p-4 text-left text-[#0b0f19] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)]', className)}>
      {/* folder tab */}
      <span aria-hidden className="absolute -top-3 left-5 h-5 w-24 rounded-t-md bg-[#d6cfc0]" />
      <div className="flex items-center justify-between border-b-2 border-dashed border-black/30 pb-2">
        <p className="font-display text-3xl leading-none tracking-[0.12em]">{APP.posterTitle}</p>
        <SentinelEmblem color="#0b0f19" className="size-7 opacity-80" />
      </div>
      <div className="relative mt-3">
        {/* paper clip */}
        <span aria-hidden className="absolute -top-3 left-4 z-10 h-8 w-3 rounded-full border-[3px] border-slate-500" />
        <div className="aspect-square w-full -rotate-1 overflow-hidden border-[6px] border-white bg-slate-800 shadow-md">
          {portrait ?? <SentinelEmblem color="#f59e0b" className="m-auto mt-[20%] size-1/2" />}
        </div>
        <span aria-hidden className="absolute bottom-3 right-1 rotate-[-14deg] rounded border-[3px] border-red-700 px-1.5 font-display text-lg tracking-widest text-red-700 opacity-85">
          CLASSIFIED
        </span>
      </div>
      <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.3em] opacity-60">{APP.posterTagline}</p>
      <p className="truncate font-display text-3xl leading-tight tracking-wide">{name}</p>
      <p className="text-xs font-bold uppercase tracking-widest text-amber-700">{title}</p>
      <div className="mt-2 flex items-baseline justify-between border-t-2 border-black/20 pt-2">
        <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">{APP.currency}</span>
        <CountUp value={reputation} suffix={APP.currencySuffix} className="font-display text-3xl tabular-nums" />
      </div>
      {subtitle && <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{subtitle}</p>}
      {/* fingerprints */}
      <svg aria-hidden viewBox="0 0 40 40" className="absolute bottom-3 left-3 size-8 opacity-15">
        {[6, 10, 14, 18].map((r) => (
          <ellipse key={r} cx={20} cy={20} rx={r * 0.8} ry={r} fill="none" stroke="#0b0f19" strokeWidth={1.4} />
        ))}
      </svg>
    </TiltCard>
  )
}
