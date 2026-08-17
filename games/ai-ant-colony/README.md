# AI Ant Colony / Ecosystem

AI Ant Colony is Game 12 in the autonomous livestream catalogue. A deterministic colony scouts, forages, excavates, raises brood, defends its queen, responds to seasons and predators, and automatically begins a new run after ascension, extinction or legitimate stagnation.

## Product promise

Viewers can understand the colony’s condition within ten seconds while discovering deeper stories in individual ant roles, pheromone trails, resource pressure, brood growth, tunnel expansion, weather and ecosystem crises. The runtime remains autonomous when audience providers, audio, rendering or optional services are unavailable.

## Architecture

The game follows the proven Autonomous Snake boundaries without importing Snake’s private code:

```text
seeded fixed-step authority
  -> bounded colony strategy and caste policies
  -> movement, excavation, resources, brood and ecosystem rules
  -> semantic events and checksums
  -> immutable stream snapshots
  -> provider-neutral audience gateway
  -> durable evidence, recovery and release governance
```

All gameplay randomness uses named seeded streams. Presentation cannot mutate gameplay. Normalized external commands are validated, moderated, rate-limited, idempotent, scheduled and audited before authority can apply them.

## Phase status

| Phase | Scope | Status |
|---|---|---|
| 1 | Deterministic foundation, invariants, snapshot/replay and headless corpus | Implemented |
| 2 | Swarm intelligence, pheromones, brood, predators, weather and progression | Implemented |
| 3 | Premium accessible broadcast experience | Implemented |
| 4 | Bounded audience interaction | Implementation candidate under exact-head CI |
| 5 | Reliability and operations | Pending implementation |
| 6 | Release validation and launch governance | Pending implementation |

No software phase is a substitute for genuine production-reference provider, capacity, audiovisual, endurance, drill, canary or independent-review evidence.

## Local commands

```bash
npm run test:ant:phase1
npm run test:ant:phase2
npm run test:ant:phase3
npm run test:ant:phase4
npm run ant:headless -- 100 1000
npm run ant:campaign -- 50 1200
npm run ant:stream
```
