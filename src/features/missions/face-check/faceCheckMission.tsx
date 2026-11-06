import { useRef, useState } from 'react'
import { ChipGroup } from '@/components/ui/ChipGroup'
import { Stepper } from '@/components/ui/Stepper'
import { FaceMissionStage, type FaceVerdict } from '@/features/vision/FaceMissionStage'
import type { FaceReading } from '@/features/vision/faceAnalysis'
import { defineMission, type MissionRunnerProps } from '../types'

interface FaceCheckConfig {
  seconds: number
  liveness: 'on' | 'off'
}

type Challenge = 'blink' | 'smile'

const HOLD_SHARE = 0.65

function FaceCheckRunner({ config, onProgress, onComplete, onUnavailable }: MissionRunnerProps<FaceCheckConfig>) {
  const liveness = config.liveness === 'on'
  const [challenge] = useState<Challenge>(() => (Math.random() < 0.5 ? 'blink' : 'smile'))
  const [phase, setPhase] = useState<'hold' | 'challenge'>('hold')
  const s = useRef({ phase: 'hold' as 'hold' | 'challenge', held: 0, eyes: 'open' as 'open' | 'closed', blinks: 0, smileMs: 0 })
  const needMs = config.seconds * 1000

  function evaluate(r: FaceReading, dt: number, gate: string | null): FaceVerdict {
    const st = s.current
    const holdShare = liveness ? HOLD_SHARE : 1

    if (st.phase === 'hold') {
      let hint = gate ?? 'Hold still — eyes wide open!'
      if (!gate && r.eyesOpen) st.held += dt
      else {
        if (!gate) hint = 'Open your eyes!'
        st.held = Math.max(0, st.held - dt * 2)
      }
      const p = Math.min(1, st.held / needMs)
      if (p >= 1) {
        if (!liveness) return { hint: 'Awake and accounted for!', progress: 1, done: true }
        st.phase = 'challenge'
        setPhase('challenge')
      }
      return { hint, progress: p * holdShare, done: false }
    }

    // Liveness challenge: a photo can't blink or smile on command.
    if (gate) {
      st.blinks = 0
      st.smileMs = 0
      return { hint: gate, progress: HOLD_SHARE, done: false }
    }
    if (challenge === 'blink') {
      if (st.eyes === 'open' && r.blink > 0.55) st.eyes = 'closed'
      else if (st.eyes === 'closed' && r.blink < 0.3) {
        st.eyes = 'open'
        st.blinks += 1
      }
      const done = st.blinks >= 2
      return { hint: done ? 'Alive and kicking!' : `Blink twice! (${st.blinks}/2)`, progress: HOLD_SHARE + (1 - HOLD_SHARE) * Math.min(1, st.blinks / 2), done }
    }
    st.smileMs = r.smile > 0.55 ? st.smileMs + dt : 0
    const p = Math.min(1, st.smileMs / 1200)
    return { hint: p >= 1 ? 'Liveness confirmed!' : 'Now SMILE big!', progress: HOLD_SHARE + (1 - HOLD_SHARE) * p, done: p >= 1 }
  }

  return (
    <FaceMissionStage
      evaluate={evaluate}
      badge={phase === 'hold' ? `Hold ${config.seconds}s` : challenge === 'blink' ? 'Liveness: blink ×2' : 'Liveness: smile'}
      onProgress={onProgress}
      onComplete={onComplete}
      onUnavailable={onUnavailable}
    />
  )
}

function FaceCheckEditor({ value, onChange }: { value: FaceCheckConfig; onChange(c: FaceCheckConfig): void }) {
  return (
    <div className="space-y-3">
      <Stepper label="Hold (seconds)" value={value.seconds} min={3} max={15} onChange={(seconds) => onChange({ ...value, seconds })} />
      <ChipGroup
        label="Blink / smile liveness"
        value={value.liveness}
        options={[
          { value: 'on', label: 'On' },
          { value: 'off', label: 'Off' },
        ]}
        onChange={(liveness) => onChange({ ...value, liveness })}
      />
    </div>
  )
}

export const faceCheckMission = defineMission<FaceCheckConfig>({
  id: 'face-check',
  name: 'Retina Scan',
  icon: '👁️',
  description: 'Face centred, eyes open, then a random blink or smile so a photo can’t pass.',
  needsCamera: true,
  visionModel: 'face',
  defaultConfig: { seconds: 5, liveness: 'on' },
  summary: (c) => `${c.seconds}s eyes open${c.liveness === 'on' ? ' + liveness' : ''}`,
  ConfigEditor: FaceCheckEditor,
  Runner: FaceCheckRunner,
})
