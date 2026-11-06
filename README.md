# Night Sentinel

An installable alarm app (PWA) that only stops when you complete your morning missions.
A lone, original hero — the Sentinel — hangs over a rainy city all night and only lets go when you rise.

## Features
- No snooze: the alarm keeps ringing until every mission is done (refresh/close returns you to it)
- Face ID: register your face; missions only count for the registered person (on-device)
- Camera missions verified on-device (MediaPipe): Rooftop Drills, Stakeout Squats, Interrogation Duel, Retina Scan, Crack a Grin
- No-camera missions: Crack the Cipher, Decode the Wiretap, Vault Cracker, Evidence Match
- Toon / photo / Sentinel-form avatar with PNG download
- Draggable hanging hero, city moods (Midnight, Downpour, Neon), offline support
- Emergency backup code so the app is never a real trap

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build && npm run preview
```

All camera processing happens on the device; nothing is recorded or uploaded.
