import { getHero } from '@/features/hero/hero'

/**
 * The Sentinel speaks with a distinct synthesized voice
 * (on-device Web Speech API; no recordings, no imitation of real actors).
 */
const HINTS = {
  male: /male|david|daniel|alex|fred|george|mark|guy|ryan/i,
  female: /female|samantha|zira|victoria|karen|hazel|susan|aria|jenny/i,
}

let muted = false
export const setVoiceMuted = (value: boolean) => {
  muted = value
  if (value) window.speechSynthesis?.cancel()
}

export function speak(crewId: string, text: string) {
  const synth = window.speechSynthesis
  if (!synth || muted) return
  const { voice } = getHero(crewId)
  const utterance = new SpeechSynthesisUtterance(text.replace(/[^\p{L}\p{N}\s!?.,'’~-]/gu, '').replace(/~/g, '!'))
  const english = synth.getVoices().filter((v) => v.lang.startsWith('en'))
  utterance.voice = english.find((v) => HINTS[voice.prefer].test(v.name)) ?? english[0] ?? null
  utterance.pitch = voice.pitch
  utterance.rate = voice.rate
  synth.cancel()
  synth.speak(utterance)
}
