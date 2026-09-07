# Game 9 — AI Dungeon: Endless Adventure

A deterministic autonomous tactical roguelite for continuous livestream viewing. Astra, the Wayfinder explores generated floors, claims a sigil, defeats a guardian, unlocks the descent gate, builds through bounded relic choices and faces a chapter boss every five floors.

## Current software status

- Phase 1 — deterministic headless foundation: implemented and covered by repository tests.
- Phase 2 — autonomous RPG, combat, economy and progression: implemented and covered by repository tests.
- Phase 3 — broadcast presentation, vector characters, VFX, adaptive audio and browser-source verification: implemented and covered by repository tests.
- Phase 4 — bounded, audited audience interaction: implemented and covered by repository tests.
- Phase 5 — operations, persistence, recovery, fencing, bounded resources and chaos validation: implemented and covered by repository tests.
- Phase 6 — candidate-bound release validation, R4/R5 gates, endurance/canary contracts and rollback evidence: implemented and covered by repository tests.
- Premium review branch: `agent/game-09-ai-dungeon-premium-review`, based on `feat/game-09-ai-dungeon` commit `f031514c014c229adc3a3085cb6209b3461d9f85`.
- Current authority contract: `dungeon-rules-v4`; current presentation contract: `dungeon-presentation-v2`; generator contract remains `dungeon-generator-v1`.
- Highest truthful readiness: R4 only after the exact candidate SHA passes the complete software validation pipeline. R5 is intentionally blocked until genuine external evidence exists.
- Production ready: no.

The premium review changes wall-aware perception and ranged legality, removes hidden-objective fallback pathing, adds critical-health/telegraph-aware autonomous decisions, gives enemy attacks clearer commitment/recovery timing, repairs the active browser stylesheet route, and introduces scalable ancient-ruin presentation presets. Presentation quality never changes collision, AI, damage, loot, hazard timing, visibility rules or progression authority.

## Verification commands

```bash
npm test
npm run dungeon:stream:self-test
npm run scan:nondeterminism
npm run dungeon:phase5:chaos
npm run test:browser
npm run dungeon:phase6:validate
```

Open `http://127.0.0.1:4189/dungeon` as an OBS browser source while the local stream host is running. `?quality=low|balanced|high|ultra|auto`, `?reducedMotion=1`, `?cleanFeed=1`, and `?muted=1` affect presentation only.

Authority uses fixed logical steps, named random streams, canonical checksums and verified snapshots. Astra’s decision policy is pure and bounded. Rendering, audio and providers cannot mutate gameplay truth.

## R5 evidence that software tests cannot substitute for

Production promotion still requires exact-candidate evidence such as credentialed production-equivalent provider validation, a real 72-hour endurance run, production-reference capacity/device measurements, current security/privacy/accessibility/asset and supply-chain review, required production-equivalent drills, a clean seven-day production canary, and current independent review. Synthetic/accelerated evidence is useful for software verification but cannot satisfy those elapsed/live gates.
