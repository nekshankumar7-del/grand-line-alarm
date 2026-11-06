import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { ImpactText } from '@/components/fx/ImpactText'
import { ButtonLink } from '@/components/ui/Button'
import { APP } from '@/editions/editions'
import { SentinelCity } from '@/editions/sentinel/SentinelCity'
import { SentinelEmblem } from '@/editions/sentinel/SentinelEmblem'
import { HangingSentinel } from '@/editions/sentinel/HangingSentinel'
import { SentinelHero } from '@/editions/sentinel/SentinelHero'
import { ApkCard, DownloadButton } from '@/features/install'
import { MISSION_LIST } from '@/features/missions/registry'
import { fadeUp, popIn, staggerContainer } from '@/motion/variants'
import { detectPlatform } from '@/pwa/platform'

const FEATURES = [
  { icon: '🚫', title: 'No snooze button', text: 'The alarm only stops when every mission is complete. Refreshing or closing the app brings you right back.' },
  { icon: '🪪', title: 'Face ID lock', text: 'Register your face once. Missions only count when the registered person is the one doing them.' },
  { icon: '📷', title: 'On-device vision', text: 'Rooftop drills, squats, hand duels and retina scans are verified by your camera — nothing is uploaded.' },
  { icon: '🌧️', title: 'A living city', text: 'Rain, neon and moonlight moods, a searchlight sweep and a hero hanging over the skyline.' },
  { icon: '📴', title: 'Works offline', text: 'Install it like an app. Models, sounds and art are cached so it works without a connection.' },
  { icon: '🆘', title: 'Emergency code', text: 'Sick or in an emergency? A 30-character backup code you saved stops the alarm safely.' },
]

const STEPS = [
  { n: '01', title: 'Register', text: 'Scan your face so only you can clear the missions.' },
  { n: '02', title: 'Set the watch', text: 'Pick a time, a ringtone and up to five missions.' },
  { n: '03', title: 'Rise', text: 'The Sentinel swings in. Prove it’s you, beat every mission, own the morning.' },
]

function Section({ id, kicker, title, children }: { id?: string; kicker: string; title: string; children: React.ReactNode }) {
  return (
    <motion.section id={id} className="relative mx-auto max-w-6xl px-4 py-24" variants={staggerContainer()} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
      <motion.div variants={fadeUp} className="text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.4em] text-amber-400">{kicker}</p>
        <h2 className="mt-2 font-display text-5xl tracking-[0.06em] text-white manga-shadow md:text-6xl">{title}</h2>
      </motion.div>
      {children}
    </motion.section>
  )
}

export function LandingPage() {
  const platform = useMemo(detectPlatform, [])
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, 140])
  const heroFade = useTransform(scrollY, [0, 500], [1, 0])

  return (
    <div className="relative min-h-dvh text-white">
      <SentinelCity />
      <HangingSentinel id="landing-md" defaultX={0.82} className="hidden md:block" rope={230} size={170} />
      <HangingSentinel id="landing" defaultX={0.84} className="md:hidden" rope={110} size={90} />

      {/* nav */}
      <nav className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <SentinelEmblem color="#f59e0b" className="size-8" />
            <span className="font-display text-2xl tracking-[0.12em]">{APP.appName}</span>
          </Link>
          <div className="flex items-center gap-2">
            <a href="#missions" className="hidden px-3 text-sm font-bold text-white/80 hover:text-white sm:block">
              Missions
            </a>
            <a href="#download" className="hidden px-3 text-sm font-bold text-white/80 hover:text-white sm:block">
              Download
            </a>
            <ButtonLink to="/app" size="sm" variant="secondary">
              Open app
            </ButtonLink>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* hero */}
        <motion.section style={reduce ? undefined : { y: heroY, opacity: heroFade }} className="relative flex min-h-dvh items-center px-4 pt-24">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1.2fr_1fr]">
            <motion.div variants={staggerContainer(0.12, 0.3)} initial="hidden" animate="show">
              <motion.p variants={fadeUp} className="text-xs font-extrabold uppercase tracking-[0.5em] text-amber-400">
                The alarm that won’t let go
              </motion.p>
              <motion.h1 variants={fadeUp} className="mt-3 font-display text-7xl leading-[0.85] tracking-[0.04em] manga-shadow md:text-9xl">
                Night
                <br />
                <span className="text-amber-400">Sentinel</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-5 max-w-lg text-lg text-white/85">
                {APP.tagline} No snooze. No skipping. Prove it’s you — then beat every mission to silence the city.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
                <DownloadButton />
                <ButtonLink to="/app" variant="ghost" size="lg">
                  Try in browser
                </ButtonLink>
              </motion.div>
            </motion.div>
            <motion.div variants={popIn} initial="hidden" animate="show" className="relative mx-auto h-[28rem] w-56 md:h-[34rem] md:w-72">
              <ImpactText text={APP.shout} className="absolute -left-10 top-1/2 z-30 text-6xl" repeatDelay={1.4} />
              <p className="absolute -bottom-6 left-1/2 w-max -translate-x-1/2 text-xs font-bold uppercase tracking-widest text-white/50">⇔ move the clamp · grab &amp; pull the Sentinel</p>
            </motion.div>
          </div>
          <motion.a href="#features" aria-label="Scroll down" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-3xl text-amber-400" animate={reduce ? undefined : { y: [0, 10, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
            ⌄
          </motion.a>
        </motion.section>

        <div className="bg-gradient-to-b from-transparent via-[#020617]/85 to-[#020617]">
          <Section id="features" kicker="Built for the hardest mornings" title="Why it works">
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <motion.article key={f.title} variants={popIn} whileHover={{ y: -6 }} className="glass rounded-xl p-5">
                  <span className="text-3xl">{f.icon}</span>
                  <h3 className="mt-2 font-display text-3xl tracking-wide">{f.title}</h3>
                  <p className="mt-1 text-sm text-white/75">{f.text}</p>
                </motion.article>
              ))}
            </div>
          </Section>

          <Section id="missions" kicker="Pick up to five each night" title="The missions">
            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MISSION_LIST.map((m) => (
                <motion.div key={m.id} variants={fadeUp} whileHover={{ scale: 1.02 }} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-2xl">{m.icon}</span>
                  <div>
                    <p className="font-display text-2xl leading-tight tracking-wide">{m.name}</p>
                    <p className="text-xs text-white/70">{m.description}</p>
                    <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${m.needsCamera ? 'bg-red-600/80' : 'bg-slate-600'}`}>
                      {m.needsCamera ? 'Camera · on-device' : 'No camera'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>

          <Section kicker="Three steps" title="How it works">
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {STEPS.map((s) => (
                <motion.div key={s.n} variants={popIn} className="relative overflow-hidden rounded-xl border border-white/10 bg-black/50 p-6">
                  <span className="absolute -right-2 -top-6 font-display text-8xl text-amber-400/15">{s.n}</span>
                  <p className="font-display text-4xl tracking-wide text-amber-400">{s.title}</p>
                  <p className="mt-1 text-white/80">{s.text}</p>
                </motion.div>
              ))}
            </div>
          </Section>

          <Section id="download" kicker="Free · installs like an app" title="Download Night Sentinel">
            <motion.div variants={fadeUp} className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-6 text-center">
              <div className="h-56 w-36">
                <SentinelHero mood="cheer" className="h-full w-full" />
              </div>
              <p className="text-white/80">Its own icon, its own window, works offline. On iPhone use Share → Add to Home Screen.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <DownloadButton />
                <ButtonLink to="/app" variant="ghost" size="lg">
                  Open in browser
                </ButtonLink>
              </div>
              {platform !== 'ios' && <ApkCard />}
            </motion.div>
          </Section>

          <footer className="border-t border-white/10 px-4 py-10 text-center text-sm text-white/60">
            <SentinelEmblem color="#f59e0b" className="mx-auto mb-3 size-8 opacity-80" />
            <p>{APP.appName} · all camera processing happens on your device · nothing is recorded or uploaded.</p>
            <p className="mt-1">An original app — characters, city and emblem created for Night Sentinel.</p>
          </footer>
        </div>
      </main>
    </div>
  )
}
