# Game 9 — AI Dungeon: Endless Adventure

A deterministic autonomous tactical roguelite for continuous livestream viewing. Astra, the Wayfinder explores generated floors, claims a sigil, defeats a guardian, unlocks the descent gate, builds through bounded relic choices and faces a chapter boss every five floors.

## Current software status

- Phase 1 — deterministic headless foundation: complete and reviewed.
- Phase 2 — autonomous RPG, combat, economy and progression: complete and reviewed.
- Phases 3–6: implementation planned on `feat/game-09-ai-dungeon`.
- Highest truthful readiness: R2.
- Production ready: no.

## Phase 1–2 commands

```bash
npm run build
node --test tests/foundation/dungeon-foundation.test.cjs tests/phase2/dungeon-gameplay.test.cjs
node scripts/run-dungeon-headless.cjs dungeon-demo 2000
node scripts/run-dungeon-phase2-campaign.cjs 50 12000
```

Authority uses fixed logical steps, named random streams, canonical checksums and verified snapshots. Astra's decision policy is pure, bounded, privacy-safe and independent of providers. Rendering, audio and audience systems cannot mutate gameplay truth.