import { motion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import type { RingtoneId } from '@/audio/ringtones'
import { AuroraBackdrop } from '@/components/effects/AuroraBackdrop'
import { Button } from '@/components/ui/Button'
import { db } from '@/db/db'
import { speak } from '@/audio/voice'
import { SentinelHero } from '@/editions/sentinel/SentinelHero'
import { useEdition } from '@/editions/useEdition'
import { useProfile } from '@/features/faceid/useProfile'
import { fadeUp, staggerContainer } from '@/motion/variants'
import { useSettingsStore } from '@/store/settingsStore'
import { newAlarmDraft, ringNow } from '../actions'
import { formatCountdown } from '../format'
import { nextOccurrence } from '../schedule'
import type { Alarm } from '../types'
import { BackupCodeSheet } from './BackupCodeSheet'
import { DayPicker } from './DayPicker'
import { MissionBuilder } from './MissionBuilder'
import { SoundPicker } from './SoundPicker'
import { TimeDial } from './TimeDial'

function Section({ step, icon, title, children }: { step: number; icon: string; title: string; children: ReactNode }) {
  return (
    <motion.section variants={fadeUp} className="glass relative rounded-[1.75rem] p-4 pt-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-full bg-gold font-display text-ink">{step}</span>
        <h2 className="text-xs font-extrabold uppercase tracking-[0.3em] text-gold">
          {icon} {title}
        </h2>
      </div>
      {children}
    </motion.section>
  )
}

async function askNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission()
    } catch {
      /* ignore */
    }
  }
}

export function AlarmEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const profile = useProfile()
  const edition = useEdition()
  const [draft, setDraft] = useState<Alarm | null>(() => (id ? null : newAlarmDraft()))
  const [missing, setMissing] = useState(false)
  const [codeFor, setCodeFor] = useState<null | 'save' | 'test'>(null)
  const { backupCode, backupCodeSeen, ensureBackupCode, acknowledgeBackupCode } = useSettingsStore()

  useEffect(() => {
    if (!id) return
    void db.alarms.get(id).then((alarm) => (alarm ? setDraft(alarm) : setMissing(true)))
  }, [id])

  // Face must be registered before setting an alarm, so trials can verify it's really you.
  if (profile === null) return <Navigate to={`/app/face?return=${encodeURIComponent(location.pathname)}`} replace />

  if (missing) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="font-display text-4xl">That alarm sank 🌊</p>
          <Link to="/app" className="mt-4 inline-block underline">
            Back to the Watchtower
          </Link>
        </div>
      </div>
    )
  }
  if (!draft || profile === undefined) return null

  const update = (patch: Partial<Alarm>) => setDraft({ ...draft, ...patch })
  const next = nextOccurrence(draft)
  const valid = draft.missions.length > 0

  async function persist() {
    if (!draft) return
    await db.alarms.put({ ...draft, label: draft.label.trim() || 'Alarm', enabled: true, armedAt: Date.now() })
  }

  async function run(action: 'save' | 'test') {
    if (!draft || !valid) return
    void askNotificationPermission()
    if (!backupCodeSeen) {
      ensureBackupCode()
      setCodeFor(action)
      return
    }
    if (action === 'save') {
      await persist()
      navigate('/app')
    } else {
      await ringNow(draft)
    }
  }

  async function remove() {
    if (!draft) return
    await db.alarms.delete(draft.id)
    navigate('/app')
  }

  return (
    <div className="relative min-h-dvh">
      <AuroraBackdrop />
      <motion.div className="relative z-10 mx-auto flex max-w-md flex-col gap-4 px-4 pb-44 pt-6" variants={staggerContainer(0.07)} initial="hidden" animate="show">
        <motion.header variants={fadeUp} className="flex items-center gap-3">
          <Link to="/app" aria-label="Back to the Watchtower" className="glass grid size-11 place-items-center rounded-full text-2xl">
            ←
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-4xl tracking-wide text-outline manga-shadow">{id ? 'Edit alarm' : 'New alarm'}</h1>
            <p className="text-sm text-white/70">{next ? `Rings in ${formatCountdown(next.getTime() - Date.now())}` : 'Pick at least one day'}</p>
          </div>
          {profile?.photo && (
            <Link to="/app/face" title="Face ID registered" className="relative">
              <img src={profile.photo} alt="Your face ID" className="size-11 rounded-full border-2 border-gold object-cover" />
              <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-emerald-500 text-[10px]">✓</span>
            </Link>
          )}
        </motion.header>

        <Section step={1} icon="⏰" title="Wake-up time">
          <TimeDial hour={draft.hour} minute={draft.minute} onChange={(hour, minute) => update({ hour, minute })} />
        </Section>

        <Section step={2} icon="📅" title="Repeat">
          <DayPicker days={draft.days} onChange={(days) => update({ days })} />
          <input
            value={draft.label}
            onChange={(e) => update({ label: e.target.value.slice(0, 40) })}
            placeholder="Label (e.g. Night watch)"
            aria-label="Alarm label"
            className="mt-4 w-full rounded-2xl border-2 border-white/25 bg-white/10 px-4 py-2.5 text-lg font-bold text-white placeholder:text-white/40 focus:border-gold focus:outline-none"
          />
        </Section>

        <Section step={3} icon="🔊" title="Alarm sound">
          <SoundPicker value={draft.sound ?? (edition.defaultSound as RingtoneId)} onChange={(sound) => update({ sound })} />
          <p className="mt-2 text-xs text-white/60">Tap to preview. Starts soft, reaches full volume after 2 min, gets harsher after 5.</p>
        </Section>

        <Section step={4} icon="🌃" title="Your guardian">
          <div className="flex items-center gap-4">
            <div className="h-44 w-28 shrink-0">
              <SentinelHero mood="idle" className="h-full w-full" />
            </div>
            <div>
              <p className="font-display text-3xl tracking-wide">The Sentinel</p>
              <p className="text-sm text-white/80">Hangs over your city all night. When the alarm rings it swings in and only lets go when every mission is done.</p>
              <button type="button" onClick={() => speak('sentinel', 'The night is over. Rise.')} className="mt-2 text-xs font-bold text-gold underline">
                🔊 Hear the Sentinel
              </button>
            </div>
          </div>
        </Section>

        <Section step={5} icon="🗂️" title={`${edition.trials} (${draft.missions.length})`}>
          <p className="mb-3 text-sm text-white/75">The alarm only stops when every {edition.trials.toLowerCase().replace(/s$/, '')} is done — and only your registered face counts. Drag ⠿ to reorder.</p>
          <MissionBuilder missions={draft.missions} onChange={(missions) => update({ missions })} />
        </Section>

        {id && (
          <motion.div variants={fadeUp}>
            <Button variant="ghost" className="w-full border-accent text-accent" onClick={() => void remove()}>
              Delete alarm
            </Button>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ y: 120 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 22 }}
        className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-sea-deep via-sea-deep/90 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8"
      >
        <div className="mx-auto flex max-w-md gap-3">
          <Button variant="ghost" className="flex-1" disabled={!valid} onClick={() => void run('test')}>
            🔔 Test
          </Button>
          <Button size="lg" className="glow-ring flex-[2]" disabled={!valid} onClick={() => void run('save')}>
            ⚓ Save alarm
          </Button>
        </div>
      </motion.div>

      <BackupCodeSheet
        code={backupCode ?? ''}
        open={codeFor !== null && Boolean(backupCode)}
        onDone={() => {
          acknowledgeBackupCode()
          const action = codeFor
          setCodeFor(null)
          if (action === 'save') void persist().then(() => navigate('/app'))
          else if (action === 'test' && draft) void ringNow(draft)
        }}
      />
    </div>
  )
}
