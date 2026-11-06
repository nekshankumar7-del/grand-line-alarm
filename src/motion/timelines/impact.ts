import gsap from 'gsap'
import { gsapEase } from '../tokens'

export function impactTimeline(target: Element, repeatDelay = 2) {
  return gsap
    .timeline({ repeat: -1, repeatDelay })
    .fromTo(
      target,
      { scale: 3, rotate: -18, opacity: 0 },
      { scale: 1, rotate: -6, opacity: 1, duration: 0.35, ease: gsapEase.impact },
    )
    .to(target, { x: '+=6', duration: 0.05, repeat: 5, yoyo: true, ease: 'none' })
    .to(target, { scale: 1.08, duration: 0.6, ease: gsapEase.wave, yoyo: true, repeat: 1 })
    .to(target, { opacity: 0, scale: 0.8, duration: 0.25 })
}
