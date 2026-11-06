---
name: next-phase
description: Implement the next build phase of Night Sentinel from docs/build-prompt.md (phases 1-7). Use when the user says "next phase", "go ahead", "start phase N", or asks what remains to build.
---

# Build the next phase

The spec lives in `docs/build-prompt.md` (copy also at `grand-line-alarm-prompt.md`). Phases:
1 Setup/design system/landing · 2 Alarms · 3 Mission framework + non-camera missions · 4 Vision missions · 5 Gamification & stats · 6 Reliability (Web Push, Capacitor) · 7 Polish.

## Workflow
1. Work out which phases are done by checking `src/` against the spec's project structure (e.g. `src/features/alarms`, `src/features/missions`, `src/db`, `server/`).
2. Give a short plan for the phase and ask only questions that block it.
3. Implement following the existing conventions:
   - `@/` alias for `src/`, feature folders under `src/features/<name>/`.
   - Motion values only from `src/motion/tokens.ts`; shared variants in `src/motion/variants.ts`; GSAP timelines in `src/motion/timelines/`.
   - Zustand stores in `src/store/` (persist middleware), Dexie schema in `src/db/`.
   - Honour reduced motion (`useReducedMotion` from `motion/react`).
   - Missions implement `MissionDefinition<Config>` from the spec.
4. Add new dependencies with `npm install`, keep heavy ones (MediaPipe, R3F, Rive) lazy-loaded.
5. Verify: `npm run typecheck` and `npm run build` both pass, then run the app (see the `run-app` skill).
6. Run the `ip-check` skill.
7. Stop: summarise what was built, how to run it, and wait for the user's go-ahead.
