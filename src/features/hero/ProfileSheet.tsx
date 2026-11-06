import { useState } from 'react'
import { Link } from 'react-router'
import { Sheet } from '@/components/ui/Sheet'
import { APP, rankFor } from '@/editions/editions'
import { useProfile } from '@/features/faceid/useProfile'
import { cn } from '@/lib/cn'
import { usePlayerStore } from '@/store/playerStore'
import { AvatarLightbox } from './AvatarLightbox'
import { PlayerAvatar } from './PlayerAvatar'

export function ProfileSheet({ open, onClose }: { open: boolean; onClose(): void }) {
  const [zoomOpen, setZoomOpen] = useState(false)
  const profile = useProfile()
  const { name, title, avatarMode, suitFace, visor, bounty, setProfile } = usePlayerStore()
  const rank = rankFor('sentinel', bounty)

  return (
    <Sheet open={open} title="Case file" onClose={onClose}>
      <div className="mt-3 flex items-center gap-4">
        <button type="button" onClick={() => setZoomOpen(true)} aria-label="View your avatar full screen" className="shrink-0 cursor-zoom-in transition-transform hover:scale-105">
          <PlayerAvatar className="size-28" />
        </button>
        <div className="min-w-0">
          <p className="font-display text-4xl leading-none tracking-wide">{name || 'Sentinel'}</p>
          <p className="font-bold uppercase tracking-widest text-amber-700">{title}</p>
          <p className="mt-1 text-xs opacity-70">
            {APP.currency} rank: <b>{rank.title}</b> (earned by waking on time)
          </p>
        </div>
      </div>

      <label className="mt-5 block text-xs font-extrabold uppercase tracking-[0.2em] opacity-70" htmlFor="agent-name">
        Codename
      </label>
      <input
        id="agent-name"
        value={name}
        maxLength={20}
        onChange={(e) => setProfile({ name: e.target.value })}
        className="mt-1 w-full rounded-xl border-[3px] border-black bg-white px-3 py-2 text-lg font-bold"
      />

      <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.2em] opacity-70">Your title</p>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Your title">
        {APP.titles.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={t === title}
            onClick={() => setProfile({ title: t })}
            className={cn('rounded-full border-2 border-black px-3 py-1 text-sm font-bold transition-colors', t === title ? 'bg-[#0b0f19] text-amber-400' : 'bg-white')}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.2em] opacity-70">Case-file picture</p>
      {profile ? (
        <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Case-file picture">
          {(
            [
              { v: 'toon', label: '🎨 Toon', hint: 'drawn from your photo' },
              { v: 'photo', label: '📷 Photo', hint: 'real picture' },
              { v: 'sentinel', label: '🦸 Sentinel', hint: 'you in the suit' },
            ] as const
          ).map((o) => (
            <button
              key={o.v}
              type="button"
              role="radio"
              aria-checked={avatarMode === o.v}
              onClick={() => setProfile({ avatarMode: o.v })}
              className={cn('rounded-xl border-2 border-black p-2 text-center', avatarMode === o.v ? 'bg-amber-400' : 'bg-white')}
            >
              <PlayerAvatar mode={o.v} aura={false} className="mx-auto size-16" />
              <span className="mt-1 block text-sm font-bold">{o.label}</span>
              <span className="block text-[10px] opacity-60">{o.hint}</span>
            </button>
          ))}
        </div>
      ) : null}
      {profile && avatarMode === 'sentinel' && (
        <div className="mt-3 space-y-2 rounded-xl border-2 border-black/20 p-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] opacity-70">Sentinel form</p>
          <div className="flex flex-wrap gap-2">
            {(['toon', 'photo'] as const).map((f) => (
              <button key={f} type="button" aria-pressed={suitFace === f} onClick={() => setProfile({ suitFace: f })} className={cn('rounded-full border-2 border-black px-3 py-1 text-sm font-bold', suitFace === f ? 'bg-[#0b0f19] text-amber-400' : 'bg-white')}>
                {f === 'toon' ? '🎨 Toon face' : '📷 Photo face'}
              </button>
            ))}
            <button type="button" aria-pressed={visor} onClick={() => setProfile({ visor: !visor })} className={cn('rounded-full border-2 border-black px-3 py-1 text-sm font-bold', visor ? 'bg-[#0b0f19] text-amber-400' : 'bg-white')}>
              {visor ? '🕶️ Visor on' : '🕶️ Visor off'}
            </button>
          </div>
        </div>
      )}
      {!profile && (
        <Link to="/app/face" onClick={onClose} className="mt-2 block rounded-xl border-[3px] border-black bg-amber-400 p-3 text-center font-bold">
          📸 Scan your face to create your portrait
        </Link>
      )}
      <AvatarLightbox open={zoomOpen} onClose={() => setZoomOpen(false)} />
    </Sheet>
  )
}
