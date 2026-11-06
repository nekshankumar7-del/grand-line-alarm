import { useRef } from 'react'
import { Stepper } from '@/components/ui/Stepper'
import { FaceMissionStage, type FaceVerdict } from '@/features/vision/FaceMissionStage'
import type { FaceReading } from '@/features/vision/faceAnalysis'
import { defineMission, type MissionRunnerProps } from '../types'

interface SmileConfig {
  seconds: number
}

const SMILE_ON = 0.6
const NEUTRAL_BELOW = 0.25

function SmileRunner({ config, onProgress, onComplete, onUnavailable }: MissionRunnerProps<SmileConfig>) {
  // Must start from a neutral face first, so a still photo of a smile can't pass.
  const s = useRef({ neutralMs: 0, armed: false, held: 0 })
  const needMs = config.seconds * 1000

  function evaluate(r: FaceReading, dt: number, gate: string | null): FaceVerdict {
    const st = s.current
    if (gate) {
      st.held = Math.max(0, st.held - dt * 2)
      return { hint: gate, progress: st.held / needMs, done: false }
    }
    if (!st.armed) {
      st.neutralMs = r.smile < NEUTRAL_BELOW ? st.neutralMs + dt : 0
      if (st.neutralMs > 500) st.armed = true
      return { hint: 'Straight face first…', progress: 0, done: false }
    }
    if (r.smile > SMILE_ON) st.held += dt
    else st.held = Math.max(0, st.held - dt * 1.5)
    const p = Math.min(1, st.held / needMs)
    return {
      hint: p >= 1 ? 'Grin confirmed!' : r.smile > SMILE_ON ? 'Hold that grin!' : 'BIGGER smile!',
      progress: p,
      done: p >= 1,
    }
  }

  return (
    <FaceMissionStage
      evaluate={evaluate}
      badge={`Smile ${config.seconds}s`}
      onProgress={onProgress}
      onComplete={onComplete}
      onUnavailable={onUnavailable}
    />
  )
}

function SmileEditor({ value, onChange }: { value: SmileConfig; onChange(c: SmileConfig): void }) {
  return <Stepper label="Hold smile (seconds)" value={value.seconds} min={3} max={15} onChange={(seconds) => onChange({ seconds })} />
}

export const smileMission = defineMission<SmileConfig>({
  id: 'smile',
  name: 'Crack a Grin',
  icon: '😏',
  description: 'Start with a straight face, then hold a big smile.',
  needsCamera: true,
  visionModel: 'face',
  defaultConfig: { seconds: 5 },
  summary: (c) => `${c.seconds}s smile`,
  ConfigEditor: SmileEditor,
  Runner: SmileRunner,
})
