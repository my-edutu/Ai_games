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
| 1 | Deterministic foundation, invariants, snapshot/replay and headless corpus | Implemented on development branch |
| 2 | Swarm intelligence, pheromones, brood, predators, weather and progression | Pending implementation |
| 3 | Premium accessible broadcast experience | Pending implementation |
| 4 | Bounded audience interaction | Pending implementation |
| 5 | Reliability and operations | Pending implementation |
| 6 | Release validation and launch governance | Pending implementation |

Phase 1 is an R1 software foundation, not a production launch claim. R5 remains evidence-gated by production-reference capacity/audiovisual tests, credentialed providers, external review, witnessed drills, a real 72-hour endurance run and a real seven-day canary.

## Local commands

```bash
npm run test:ant:phase1
npm run ant:headless -- 100 1000
```
