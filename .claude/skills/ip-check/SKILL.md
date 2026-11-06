---
name: ip-check
description: Scan Night Sentinel for third-party IP (character names, logos, fonts, audio) that must not ship. Use after adding assets, copy or a feature, or before a release.
---

# IP check

Night Sentinel's hero, city, emblem and names are original. Nothing from existing franchises may ship.

1. Search `src/`, `public/`, `index.html`, `pwa.manifest.ts`, `server/` (skip `node_modules`, `dist`, `docs/`), case-insensitive, for franchise names, e.g.:
   `batman|gotham|joker|wayne|bat-?signal|batmobile|one piece|luffy|zoro|straw ?hat|grand line|marvel|spider-?man`
2. Check the hero art has no franchise signatures (e.g. bat ears, bat-wing capes, bat emblems).
3. Check every font is openly licensed (Bebas Neue, Nunito are OFL).
4. Check `public/` images/audio are original or have a stated licence.
5. Report each hit with file:line and an original replacement.
