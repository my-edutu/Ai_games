# Game 9 — AI Dungeon: Endless Adventure

A deterministic autonomous tactical roguelite for continuous livestream viewing. Astra, the Wayfinder explores generated floors, claims a sigil, unlocks the descent gate, builds through bounded relic choices and faces a chapter boss every five floors.

## Current software status

- Phase 1: complete and reviewed.
- Phases 2–6: planned on `feat/game-09-ai-dungeon`.
- Highest truthful readiness: R1 after Phase 1.
- Production ready: no.

## Phase 1 commands

```bash
npm run build
node --test tests/foundation/dungeon-foundation.test.cjs
node scripts/run-dungeon-headless.cjs dungeon-demo 2000
```

Authority uses fixed logical steps, named random streams, canonical checksums and verified snapshots. Presentation and providers are not allowed to mutate gameplay truth.