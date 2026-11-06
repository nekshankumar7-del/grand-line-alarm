# Build Prompt — "Grand Line Alarm" (Animated Task-Verified Alarm PWA)

> Copy everything below this line into Claude (Claude Code works best, since this is a multi-file project).

---

## Role

You are a senior React + PWA engineer and motion designer. Build a production-quality, animation-first alarm app that runs as an installable PWA on desktop and mobile, and can also be wrapped as a native Android/iOS app. Write clean, typed, modular code. Work in phases (listed at the end), and after each phase stop, summarise what was built, list how to run it, and wait for my go-ahead.

## The idea in one paragraph

The user sets an alarm and attaches one or more **"missions"** (tasks), e.g. "do 10 jumping jacks", "beat me at rock-paper-scissors (best of 3)", "show your face with eyes open for 5 seconds". When the alarm fires, it keeps ringing and the **only** way to stop it is to complete every mission. Completion is verified **on-device with the camera** using open-source ML models (MediaPipe / TensorFlow.js). Failing or leaving the mission screen does not stop the alarm. The whole experience is heavily animated with a **pirate-adventure theme inspired by One Piece** (sea voyage, wanted posters, bounties, treasure).

## Theme & IP rule (important)

- The look and feel should be *inspired by* One Piece: bright shonen-anime energy, ocean and ship visuals, wanted-poster cards, bounty numbers, treasure maps, crew/ranks, dramatic manga-style speed lines and impact text.
- Do **NOT** use any official One Piece characters, names, logos, artwork, fonts, audio or screenshots. Create **original** characters and assets (e.g. our own captain mascot, our own ship, our own snail-phone-style alarm creature). This keeps the app publishable on stores.
- Name ideas (original): app = "Grand Line Alarm" or "Wake the Crew"; missions = "Trials"; streak = "Voyage"; user score = "Bounty"; ranks = Cabin Boy → Deckhand → First Mate → Captain → Pirate Emperor.

## Hard platform realities — design around these, don't ignore them

1. **A pure PWA cannot reliably ring an alarm when the app is closed or the phone is locked** (especially on iOS). Service workers cannot run exact timers, and the Notification Triggers API was abandoned.
2. **A web app cannot stop the user from leaving or closing it.**

So build it in two layers:

- **Layer 1, PWA (desktop + Android/iOS browsers):** works fully while the app is open/foregrounded (use the Screen Wake Lock API plus a "Night mode / Bedside mode" screen the user leaves open). Add a **Web Push fallback**: a tiny Node backend schedules a push at alarm time so the user still gets a notification if the app is closed; tapping it reopens the app straight into the ringing screen.
- **Layer 2, native wrapper with Capacitor (Android first, then iOS):** same React codebase, using `@capacitor/local-notifications` (exact alarms on Android, custom sound, full-screen intent) so the alarm rings even when the app is killed. If the user dismisses the notification without completing missions, re-fire every 60s until missions are done (on Android consider a small native plugin/foreground service for a true persistent alarm).
- **"Keep ringing if they exit":** on visibility change / app background, keep audio playing where the platform allows, immediately re-notify, and when the app is reopened, **always** route back to the active mission. Alarm state is persisted, so a page refresh or restart cannot clear it.

Explain any remaining platform limitation in a short in-app "How reliable is my alarm?" help screen.

## "Download App" from the website (required)

The website is the single entry point. Users must be able to get the app straight from it:

- **Public landing page** (`/`): animated hero (ship sailing in, ringing alarm creature), feature highlights, short demo animations of the missions, and a big **"Download App"** button. The alarm app itself lives at `/app`.
- **Smart Download button** that detects the device and shows the right option:
  - **Chrome / Edge / Android / desktop:** capture the `beforeinstallprompt` event and trigger the native **"Install app"** prompt in one click (PWA install to home screen/desktop, with its own icon and standalone window).
  - **iOS Safari** (no install prompt there): show an animated step-by-step sheet: "Tap Share → Add to Home Screen".
  - **Android native build:** also offer **"Download APK"** (the Capacitor build hosted on the site, e.g. `/downloads/grand-line-alarm.apk`) with a short note about allowing install from unknown sources, and a "Get it on Google Play" badge once published. Explain that the APK/native version gives the most reliable alarms.
  - **Already installed** (`display-mode: standalone` detected): hide the button and show "Open App" instead.
- **Install banner inside `/app`** if the user is still using it in the browser: a dismissible animated banner that says installing makes alarms more reliable.
- Full manifest: name, short_name, icons (192, 512, maskable), splash/theme colours, screenshots (for the richer install UI), shortcuts ("New alarm", "Stats").
- Track install outcome (`appinstalled` event) and show a celebration animation.

## Tech stack

- **Core:** React 19 + TypeScript + Vite
- **PWA:** `vite-plugin-pwa` (Workbox), manifest, offline caching of all assets and ML model files, install prompt UI
- **Native:** Capacitor (Android + iOS), `@capacitor/local-notifications`, `@capacitor/haptics`
- **State:** Zustand (with persist middleware)
- **Storage:** IndexedDB via Dexie (alarms, missions, history, stats)
- **Styling:** Tailwind CSS + CSS variables for themes
- **Routing:** React Router
- **Audio:** Howler.js (looping, gradual volume ramp-up, multiple ringtones)
- **Animation (main focus):**
  - `motion` (Framer Motion, `motion/react`) for UI transitions, layout animations, gestures, page transitions, `AnimatePresence`
  - GSAP (+ ScrollTrigger, MorphSVG, SplitText, all free now) for cinematic timelines: the alarm "raid" sequence, bounty counter, manga impact text
  - Rive (`@rive-app/react-canvas`) or Lottie (`@lottiefiles/dotlottie-react`) for the mascot and character animations with state machines (idle, angry while ringing, cheering on success)
  - React Three Fiber + Drei (optional, lazy-loaded) for a 3D ocean/ship on the home screen
  - tsParticles for confetti, sea spray, coins
- **ML / vision (all on-device, no images ever uploaded):**
  - `@mediapipe/tasks-vision`: **Pose Landmarker** (exercise counting), **Gesture Recognizer / Hand Landmarker** (rock-paper-scissors), **Face Landmarker** (face present, eyes open, smile, blink liveness)
  - Fallback: TensorFlow.js MoveNet for pose if MediaPipe fails on a device
  - Run inference in a Web Worker / with `requestVideoFrameCallback` to keep animations at 60fps

## Screens

1. **Onboarding:** animated voyage intro (3 swipeable panels), permission requests (notifications, camera, motion sensors) each explained with a fun animated card, "install app" prompt.
2. **Home / Harbor:** animated ocean background with the ship, next-alarm countdown, list of alarms as wanted-poster cards (swipe to delete, toggle with a satisfying animation), current bounty & rank.
3. **Create / Edit Alarm:** animated time picker (ship's-wheel-style dial), repeat days, label, ringtone with preview, volume ramp, vibration, snooze rules, **mission builder** (add/reorder/remove missions with drag-and-drop, set difficulty and count).
4. **Ringing screen ("The Raid"):** full-screen, high-energy GSAP sequence (manga speed lines, shaking screen, angry mascot, pulsing "WAKE UP!" impact text), loud looping audio, vibration, a big "Start Trials" button. No stop button.
5. **Mission screens:** live camera feed with a skeleton/hand/face overlay drawn on canvas, rep counter with pop animations, progress bar shaped like a rope or ship journey, encouraging/taunting mascot lines. Alarm volume dips while a mission is in progress and returns to full if the user goes idle for 10s.
6. **Victory screen:** confetti, coins, bounty increase animation, streak update, a morning quote, optional "today's weather + first calendar event" card.
7. **Stats / Logbook:** wake-up history, streak calendar (heatmap), average time-to-complete, missions completed, bounty growth chart.
8. **Settings:** theme, sounds, reduced motion, camera choice, mission difficulty defaults, emergency backup code, data export/import, "how reliable is my alarm" help.

## Missions (build as a plugin system)

Create a `Mission` interface so new missions are easy to add:

```ts
interface MissionDefinition<Config> {
  id: string;
  name: string;
  icon: string;
  needsCamera: boolean;
  defaultConfig: Config;
  ConfigEditor: React.FC<{ value: Config; onChange(c: Config): void }>;
  Runner: React.FC<{ config: Config; onProgress(p: number): void; onComplete(): void; onFail(reason: string): void }>;
}
```

Build these missions:

| Mission | How it's verified |
|---|---|
| **Jumping jacks / squats / push-ups (N reps)** | Pose Landmarker: count reps with a state machine on joint angles and positions (e.g. wrists above head + ankles apart = "open", back to "closed" = 1 rep). Require full body in frame. Debounce to stop half-reps counting. |
| **Rock-Paper-Scissors (best of 3/5)** | Gesture/Hand Landmarker classifies the user's hand (fist = rock, open palm = paper, two fingers = scissors). Animated countdown "Rock… Paper… Scissors… SHOOT!", the mascot picks randomly, you must win. A loss means a new round, never a skip. |
| **Face check ("Show me you're awake")** | Face Landmarker: face centred, eyes open (blendshapes) for X seconds, plus a random blink or smile challenge for liveness so a photo can't pass. |
| **Smile challenge** | Hold a big smile for 5s (blendshape score threshold). |
| **Math riddle** | 3 to 5 arithmetic problems, difficulty-scaled. No camera. |
| **Memory game** | Repeat a growing sequence of animated tiles (Simon-style). |
| **Shake the phone** | DeviceMotion API, N strong shakes (mobile only). |
| **Typing challenge** | Type a random sentence exactly. |
| **Scan an object (barcode/QR)** | User registers a QR/barcode in another room (e.g. on the bathroom mirror) and must scan it to stop the alarm (BarcodeDetector API with a ZXing fallback). |

Anti-cheat rules: camera missions require a live face/body in frame for the whole attempt; detect a frozen or static feed; random challenge order; no skipping.

## Alarm engine rules

- Alarms are stored in IndexedDB; an `activeAlarm` record persists until all missions are complete.
- On app load, if `activeAlarm` exists, jump straight to the ringing/mission screen.
- Audio: looping, gradual 30s fade-in, escalates to max volume after 2 min; switches to a harsher sound after 5 min.
- **Snooze:** configurable (0 to 3 times, 5 to 10 min). Each snooze **costs bounty** and adds +1 extra mission rep.
- **Emergency exit:** a hidden "I'm sick / emergency" option that requires a long 30-char backup code (shown once at setup) and logs it, so the app is never a real trap.
- Respect Do Not Disturb when the OS allows; handle timezone changes and DST.
- Pre-alarm: optional gentle "sunrise" screen glow 10 min before.

## Extra features to make it better

- **Bounty & ranks gamification:** earn bounty per on-time wake-up, bonus for fast completion, penalties for snoozing; rank-up cinematic animation.
- **Voyage streak:** consecutive on-time wake-ups shown as ship progress across a sea map, with islands as milestones.
- **Daily wanted poster:** shareable image (canvas) of your rank/bounty/streak.
- **Difficulty modes:** Easy / Normal / Hard / "Emperor" (more reps, harder RPS, random mission order).
- **Morning briefing after victory:** weather (Open-Meteo, no API key) and a motivational line.
- **Bedtime reminder:** nudges you to sleep 8h before your next alarm.
- **Crew mode (later phase):** friends see each other's streaks; optional "wake-up buddy" gets a push if you snooze twice.
- **Themes:** "Day Sea", "Night Sea", "Storm" (all original art).
- **Accessibility:** honour `prefers-reduced-motion` (swap big animations for fades), high contrast, screen-reader labels, non-camera alternatives for users who can't do physical missions.
- **Privacy:** all camera processing on-device, nothing recorded or uploaded; say so clearly in the UI.
- **Offline-first:** everything, including ML models and sounds, works offline after first load.

## Animation guidelines

- Every interaction gets feedback: buttons squash on press, cards tilt on hover/drag, numbers count up, list items stagger in.
- Page transitions: sea-wave wipe or sliding map transitions with `AnimatePresence`.
- Use manga-style touches: speed lines, impact text ("DON!", "BAM!", written as original SFX), screen shake, ink splashes.
- Keep a consistent motion system: define shared durations/easings/springs in `src/motion/tokens.ts`.
- Target 60fps on mid-range Android: animate only `transform`/`opacity`, lazy-load heavy scenes (R3F, Rive), pause background animations while ML runs, use `will-change` sparingly.

## Project structure

```
src/
  app/            # routes, providers, layout
  features/
    alarms/       # alarm CRUD, scheduler, engine, ringing screen
    missions/     # mission registry + one folder per mission
    vision/       # MediaPipe loaders, workers, rep counters, gesture classifiers
    stats/        # history, streaks, bounty
    settings/
    onboarding/
  components/     # shared UI (Button, Card, WantedPoster, Modal…)
  motion/         # tokens, reusable variants, GSAP timelines
  audio/          # Howler wrapper, ringtones
  db/             # Dexie schema
  store/          # Zustand stores
  pwa/            # SW registration, install prompt, push subscription
  native/         # Capacitor bridges (notifications, haptics)
server/           # small Node/Express (or Hono) Web Push scheduler
```

## Build phases (stop after each one)

1. **Setup, design system & landing page:** Vite + TS + Tailwind + PWA + routing, theme tokens, motion tokens, core animated components, original mascot placeholder, landing page with the smart "Download App" button (PWA install + iOS guide).
2. **Alarms:** CRUD, IndexedDB, scheduler, ringing screen with audio/vibration/wake lock, persistence of the active alarm.
3. **Mission framework + non-camera missions:** registry, mission builder UI, math, memory, typing, shake.
4. **Vision missions:** camera handling, MediaPipe in a worker, jumping jacks/squats counter, rock-paper-scissors, face/smile checks, anti-cheat.
5. **Gamification & stats:** bounty, ranks, streak map, logbook, wanted-poster share image.
6. **Reliability:** Web Push backend fallback, Capacitor Android build with local notifications and full-screen alarm, re-fire loop, emergency backup code.
7. **Polish:** full animation pass, reduced-motion support, accessibility, performance profiling, offline test, Lighthouse PWA score ≥ 90.

## Acceptance criteria

- The alarm cannot be stopped without completing all missions (except via the emergency code).
- Refreshing, closing and reopening the app returns to the active mission.
- The jumping-jack counter is accurate within ±1 rep over 20 reps in normal lighting.
- RPS correctly reads rock/paper/scissors at ≥ 90% accuracy with the hand clearly visible.
- Works offline after first load; installable on Chrome desktop, Android and iOS Safari.
- Animations stay smooth (no visible jank) on a mid-range Android phone while the camera mission runs.
- The "Download App" button installs the PWA in one tap on Chrome/Android/desktop, shows the iOS guide on Safari, offers the APK on Android, and turns into "Open App" once installed.
- No official One Piece assets anywhere in the repo.

Start with **Phase 1**. Before writing code, give me a short plan for the phase and any questions.
