# AI vs 1,000 Floors — Gauntlet design

## Authorization and goal

The user approved applying the supplied Gauntlet Loop: build a complete 3D autonomous Game 4, compare real running output with ASTRO BOT, use independent builders and fresh critics, and keep a live progress page. The lead chooses implementation details. The goal is a finite 1,000-floor campaign with saved progress and checkpoints, not the catalogue's endless Game 3.

## Viewer promise

Watch a small autonomous explorer and its companion reach the crown of a living sky tower, reading hazards and finding a way through ten changing districts. Floor / 1,000 is the primary progress measure. Safe arrival, route selection, waits, jumps, setbacks and checkpoint recovery are visible events governed by the simulation.

## Creative direction

Working title: **THOUSAND / An autonomous ascent**. Warm ivory stone, oxidized turquoise metal, amber energy, botanical forms and a bright atmospheric sky establish the first district. A complete articulated explorer has a distinctive face/visor, layered clothing or armor, hands, feet, backpack, articulated limbs and expressive poses. No imported character likenesses or reference-game assets enter the shipped game.

Ten districts each cover 100 floors: Verdant Atrium, Sunlit Aqueduct, Copperworks, Frost Conservatory, Coral Archive, Cloud Gardens, Ember Foundry, Moonlit Observatory, Astral Vault, Crown of Dawn. Districts change geometry and props as well as palette. Seeded route templates, elevation, hazard timing and landmarks provide variety inside each district. A checkpoint every 10 cleared floors preserves a clearly stated recovery point.

## Fixed reference bar

- Primary: [ASTRO BOT official gameplay/media](https://www.playstation.com/en-us/games/astro-bot/), including Rising Heat and Spring-Loaded Run: character finish, animation, environment depth, camera clarity, feedback and overall polish.
- Secondary: [Luigi's Mansion 3](https://www.nintendo.com/us/store/products/luigis-mansion-3-switch/): distinct floor identities and environmental staging.
- Secondary: [Returnal](https://store.steampowered.com/app/1649240/Returnal/), Tower of Sisyphus: readable tower action, spatial depth and escalating presentation.
- Judge actual gameplay frames and moving output at matched viewing sizes. Cinematic marketing images cannot prove gameplay quality. Keep source credit/URLs in the review evidence, not the game assets.
- Fixed dimensions: character silhouette/materials; animation/weight; environment detail/variety; camera/action readability; feedback/audio/UI; functioning campaign/recovery; performance/accessibility. A win requires independent preference across the applicable presentation dimensions and no functional blocker. Merely improving our previous build is not a win.

## Architecture chosen by the lead

Use the repository's pinned Three.js and TypeScript. A deterministic game-owned core exposes immutable snapshots and runs in a browser worker; the same core runs headlessly in Node. Native browser modules are built with TypeScript, avoiding a new application framework or runtime CDN. Presentation owns no rule state. A small static Node server serves the game, the live progress page and locally installed Three.js modules.

## Complete outcome

- All 1,000 floors are constructively traversable, finite, seed-reproducible and complete under the autonomous policy; floor 1,001 never exists.
- Every movement/hazard result comes from fixed 30 Hz ticks. No rendering frame delta or ambient randomness changes authority.
- The AI observes timed hazards, waits for safe windows and traverses bounded paths, with visible jump/landing poses and safe recovery.
- Validated, versioned saves restore deterministically. Corrupt or incompatible data is rejected with a visible recovery option. Storage failure does not stop the game.
- Desktop and mobile HUDs expose floor, district, immediate intent and checkpoint without covering the protagonist. Pause, speed, camera, sound and settings are functional; reduced motion, keyboard access, focus and clean feed are supported.
- Browser graphics failure has a truthful fallback. Resource counts remain bounded across floor transitions. Audio is opt-in and uses simulation events.
- A separate progress page records baseline, iteration screenshots, source references, critic verdicts and unresolved gaps. It never labels this build as better than the reference without evidence.

## Boundaries

No live audience/payment integration is added in this change. No production readiness or console parity is inferred from tests. No unrelated game is changed. Builder/critic rounds are evidence-driven with no arbitrary round cap. The user has authorized implementation; no additional design approval is needed.
