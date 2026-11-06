import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { Stepper } from '@/components/ui/Stepper'
import { drawSkeleton, readJumpingJack, readSquat, RepCounter, type PoseRead } from '@/features/vision/poseAnalysis'
import { loadPoseLandmarker } from '@/features/vision/visionTasks'
import { VisionShell } from '@/features/vision/VisionShell'
import { spring } from '@/motion/tokens'
import { defineMission, type MissionRunnerProps } from '../types'

interface ExerciseConfig {
  reps: number
}

type Kind = 'jumping-jacks' | 'squats'

const READERS: Record<Kind, (lm: Parameters<typeof readJumpingJack>[0]) => PoseRead> = {
  'jumping-jacks': readJumpingJack,
  squats: readSquat,
}

const CHEERS = ['GO!', 'NICE!', 'STRONG!', 'AGAIN!', 'YES!', 'SHARP!']

function makeRunner(kind: Kind) {
  return function ExerciseRunner({ config, onProgress, onComplete, onUnavailable }: MissionRunnerProps<ExerciseConfig>) {
    const counter = useRef(new RepCounter())
    const [reps, setReps] = useState(0)

    const overlay = (
      <div className="pointer-events-none absolute inset-x-0 bottom-12 flex flex-col items-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={reps}
            initial={{ scale: 2.4, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: -30 }}
            transition={spring.bouncy}
            className="font-display text-8xl leading-none tabular-nums text-gold text-outline manga-shadow"
          >
            {reps}
            <span className="text-4xl text-white">/{config.reps}</span>
          </motion.span>
        </AnimatePresence>
        <AnimatePresence>
          {reps > 0 && (
            <motion.span
              key={`fx-${reps}`}
              initial={{ y: 0, opacity: 1, scale: 0.6 }}
              animate={{ y: -120, opacity: 0, scale: 1.6 }}
              transition={{ duration: 0.8 }}
              className="absolute font-display text-5xl text-accent text-outline"
            >
              {CHEERS[reps % CHEERS.length]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    )

    return (
      <VisionShell
        load={loadPoseLandmarker}
        badge={kind === 'jumping-jacks' ? `🤸 ${config.reps} jumping jacks` : `🏋️ ${config.reps} squats`}
        overlay={overlay}
        onProgress={onProgress}
        onComplete={onComplete}
        onUnavailable={onUnavailable}
        onFrame={(model, video, info, canvas) => {
          if (info.frozen) {
            drawSkeleton(canvas, null, false)
            return { hint: 'Camera feed frozen!', good: false, progress: counter.current.reps / config.reps, done: false }
          }
          const result = model.detectForVideo(video, info.now)
          if (result.landmarks.length > 1) {
            drawSkeleton(canvas, result.landmarks[0], false)
            return { hint: 'One person at a time!', good: false, progress: counter.current.reps / config.reps, done: false }
          }
          const lm = result.landmarks[0] ?? null
          if (!lm) {
            drawSkeleton(canvas, null, false)
            return { hint: 'Step into the frame!', good: false, progress: counter.current.reps / config.reps, done: false }
          }
          const read = READERS[kind](lm)
          drawSkeleton(canvas, lm, read.inFrame)
          if (read.inFrame && counter.current.update(read.phase, info.now)) {
            setReps(counter.current.reps)
            navigator.vibrate?.(40)
          }
          const n = counter.current.reps
          return { hint: n >= config.reps ? 'TRIAL CLEARED!' : read.detail, good: read.inFrame, progress: n / config.reps, done: n >= config.reps }
        }}
      />
    )
  }
}

function ExerciseEditor({ value, onChange }: { value: ExerciseConfig; onChange(c: ExerciseConfig): void }) {
  return <Stepper label="Reps" value={value.reps} min={5} max={50} step={5} onChange={(reps) => onChange({ reps })} />
}

export const jumpingJacksMission = defineMission<ExerciseConfig>({
  id: 'jumping-jacks',
  name: 'Rooftop Drills',
  icon: '🤸',
  description: 'Jumping jacks counted by on-device pose tracking. Whole body in frame.',
  needsCamera: true,
  visionModel: 'pose',
  defaultConfig: { reps: 10 },
  summary: (c) => `${c.reps} jumping jacks`,
  ConfigEditor: ExerciseEditor,
  Runner: makeRunner('jumping-jacks'),
})

export const squatsMission = defineMission<ExerciseConfig>({
  id: 'squats',
  name: 'Stakeout Squats',
  icon: '🏋️',
  description: 'Full squats counted from your knee angle. Half-reps don’t count.',
  needsCamera: true,
  visionModel: 'pose',
  defaultConfig: { reps: 10 },
  summary: (c) => `${c.reps} squats`,
  ConfigEditor: ExerciseEditor,
  Runner: makeRunner('squats'),
})
