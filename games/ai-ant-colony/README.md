# AI Ant Colony / Ecosystem

AI Ant Colony is Game 12 in the autonomous livestream catalogue. A deterministic colony scouts, forages, excavates, raises brood, defends its queen, responds to seasons and predators, and automatically begins a new run after ascension, extinction or legitimate stagnation.

## Product promise

Viewers can understand the colony’s condition within ten seconds while discovering deeper stories in ant roles, pheromone trails, resource pressure, brood growth, tunnel expansion, weather and ecosystem crises. The runtime remains autonomous when audience providers, audio, rendering, or optional services are unavailable.

## Architecture

The game follows the proven autonomous-game boundaries without importing another game’s private code:

```text
seeded fixed-step authority
  -> bounded colony strategy and caste policies
  -> movement, excavation, resources, brood and ecosystem rules
  -> semantic events and checksums
  -> immutable stream snapshots
  -> provider-neutral audience gateway
  -> durable commands, leases, recovery and audit
  -> exact-candidate release governance
```

All gameplay randomness uses named seeded streams. Presentation cannot mutate gameplay. Normalized external commands are validated, moderated, rate-limited, idempotent, scheduled, and durably reserved before authority can apply them.

## Phase status

| Phase | Scope | Software status |
|---|---|---|
| 1 | Deterministic foundation, invariants, snapshot/replay and headless corpus | Complete |
| 2 | Swarm intelligence, pheromones, brood, predators, weather and progression | Complete |
| 3 | Premium accessible broadcast experience | Complete |
| 4 | Bounded audience interaction | Complete |
| 5 | Persistent authority, recovery, operations and chaos | Complete |
| 6 | Release validation, scoring and launch governance | Complete |

The exact candidate defaults to readiness `BLOCKED` at R4. Software completion is not a substitute for genuine production-reference provider, capacity, audiovisual, security, endurance, drill, canary, and independent-review evidence. R5 is awarded only when those external gates pass for the same release-manifest checksum.

## Local commands

```bash
npm run test:ant:phase1
npm run test:ant:phase2
npm run test:ant:phase3
npm run test:ant:phase4
npm run test:ant:phase5
npm run test:ant:phase6
npm run ant:headless -- 100 1000
npm run ant:campaign -- 50 1200
npm run ant:stream
npm run ant:stream:self-test
npm run ant:phase5:chaos -- ant-candidate
CANDIDATE_SOURCE_SHA=<40-char-sha> npm run ant:phase6:validate
```

## Operations and review

- `docs/operations/ai-ant-colony-runbook.md`
- `docs/operations/ai-ant-colony-handoff.md`
- `docs/operations/ai-ant-colony-rollback.md`
- `docs/operations/ai-ant-colony-evidence-intake.md`
- `docs/reviews/AI_ANT_COLONY_FINAL_REVIEW.md`
