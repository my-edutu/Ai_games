# AI Zombie Survival

Cinematic autonomous 2.5D survival game package.

## Runtime
- `npm test` — build and run authoritative/presentation tests.
- `npm run serve` — build and serve the browser game.
- `H` hides/shows the HUD, `R` restarts the deterministic run, `Space` pauses/resumes.

## Architecture
The fixed-step simulation is authoritative. Rendering, camera, VFX and audio consume authoritative state and may not mutate outcomes. The current rebuild includes physical scavenging/carry/deposit, civilians and rescue escorts, safe-house progression, multiple infected archetypes, modular districts/interiors, day/night/weather, barricade defense and bounded viewer influence.

See `VISUAL_ACCEPTANCE_REPORT.md` and `PRODUCTION_READINESS.md` for evidence status. Runtime screenshots and browser acceptance must be generated from the actual browser build; concept art is never accepted as runtime evidence.
