---
name: run-app
description: Launch, build, or preview the Night Sentinel PWA (Vite + React, PWA). Use when asked to run, start, serve, build, preview or screenshot the app, or to check that a change works.
---

# Run Night Sentinel

Project root: the folder containing `package.json` (Vite 6 + React 19 + vite-plugin-pwa).

## Steps
1. If `node_modules/` is missing, run `npm install`.
2. Type-check first: `npm run typecheck` (must exit 0).
3. Pick a mode:
   - **Dev (hot reload):** `npm run dev` (run in background). Serves on http://localhost:5173 and on the LAN (`--host`), so a phone on the same Wi-Fi can open it.
   - **Production check (service worker / install prompt / offline):** `npm run build`, then `npm run preview` (run in background) on http://localhost:4173. Use this to test the "Download App" button, since `beforeinstallprompt` is most reliable against the built SW.
4. Wait for the server to respond (`curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/`) before reporting.
5. Routes to check: `/` (landing + Download), `/app` (Watchtower), `/app/alarms/new`, `/app/face`.

## Notes
- Camera / install / wake-lock features need a secure context: `localhost` is fine; LAN IPs on phones are NOT secure — use a tunnel (e.g. `npx localtunnel`) or HTTPS for phone testing.
- Stop background servers when done if the user asks.
