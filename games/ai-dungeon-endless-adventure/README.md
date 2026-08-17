# Game 9 — AI Dungeon: Endless Adventure

A deterministic autonomous tactical roguelite for continuous livestream viewing. Astra, the Wayfinder explores generated floors, claims a sigil, defeats a guardian, unlocks the descent gate, builds through bounded relic choices and faces a chapter boss every five floors.

## Current software status

- Phase 1 — deterministic headless foundation: complete and reviewed.
- Phase 2 — autonomous RPG, combat, economy and progression: complete and reviewed.
- Phase 3 — premium broadcast UI, vector characters, VFX and adaptive audio: complete and reviewed.
- Phases 4–6: implementation planned on `feat/game-09-ai-dungeon`.
- Highest truthful readiness: R3.
- Production ready: no.

## Phase 1–3 commands

```bash
npm run build
node --test tests/foundation/dungeon-foundation.test.cjs tests/phase2/dungeon-gameplay.test.cjs tests/phase3/dungeon-broadcast.test.cjs
node scripts/run-dungeon-phase2-campaign.cjs 50 12000
node scripts/serve-dungeon-stream.cjs --self-test
node scripts/serve-dungeon-stream.cjs --port=4189
```

Open `http://127.0.0.1:4189/dungeon` as an OBS browser source. Authority uses fixed logical steps, named random streams, canonical checksums and verified snapshots. Astra’s decision policy is pure and bounded. Rendering, audio and providers cannot mutate gameplay truth.
