# AI Games — Autonomous Livestream Game Platform

This monorepo builds autonomous games for uninterrupted YouTube and Twitch entertainment on one shared deterministic simulation, audience-interaction, broadcast, durability, operations, and release-governance platform.

## Catalogue

1. Autonomous Snake
2. AI Maze Escape
3. Infinite Tower Climb
4. AI vs 1,000 Floors
5. AI Civilization / Tiny Kingdom
6. AI Battle Royale
7. Marble Survival Tournament
8. AI Escape Room
9. AI Dungeon — Endless Adventure
10. AI Zombie Survival
11. AI City Traffic Experiment
12. AI Ant Colony / Ecosystem

## Shared platform

```text
Seeded authoritative simulation
  → autonomous AI and procedural content
  → deterministic rules, physics and progression
  → bounded event director and audience gateway
  → stream HUD, camera, VFX, audio, captions and replay
  → append-only commands, events, snapshots, records and audit
  → verified recovery, supervisor, output health and controls
  → release freeze, traceability, endurance, canary and readiness assessor
```

## Implementation status

| Game | Software phases | Score | Highest truthful readiness | Production status |
|---|---:|---:|---|---|
| Autonomous Snake | 6 / 6 | R4 evidence-gated candidate | R4 | External R5 evidence blocked |
| AI Maze Escape | 6 / 6 | **88 / 100** | R4 | External R5 evidence blocked |
| AI City Traffic Experiment | 6 / 6 | **88 / 100** | R4 | External R5 evidence blocked |
| Games 3–10 and 12 | Documentation/specification packages | Not scored | Pre-implementation | Not production ready |

No game is labelled R5 merely because code merged or CI passed. Production readiness requires exact-candidate primary evidence, real elapsed operation, current credentialed providers, external review, independently witnessed drills, and a guarded canary.

## AI City Traffic Experiment review snapshot

Game 11 implements deterministic connected city generation, collision-free lane-cell authority, adaptive signals, congestion-aware routing, demand waves, incidents, causal gridlock/cycle outcomes, premium responsive broadcast UI, semantic audio, bounded audience policy influence, verified snapshots and restore, typed quarantine, health actions, chaos and soak validation, CI evidence generation, and a fail-closed release assessor.

Its software score is 88 / 100. The final 12 points are reserved for production-reference capacity, real 72-hour endurance, current credentialed YouTube and Twitch tests, external safety attestations, independently witnessed production drills, a real seven-day canary, and independent exact-candidate review.

## Documentation contract

Every implemented game has product requirements, game design, autonomous AI, viewer interaction, audiovisual direction, technical architecture, testing strategy, production-readiness gates, and six executable implementation phases. Reusable specialist skills live under `skills/`; shared architecture and standards live under `docs/`; reproducible phase evidence lives under `evidence/`.

## Safe audience influence

Paid or free audience input cannot guarantee victory, death, capture, escape, a record, gridlock, or an unavoidable terminal outcome. All interactions share authentication, moderation, eligibility, rate, cap, conflict, expiry, reversal, idempotency, audit, privacy, and emergency-disable boundaries.

## Operations handoffs

### Autonomous Snake

- `docs/operations/autonomous-snake-runbook.md`
- `docs/operations/autonomous-snake-r5-evidence-intake.md`
- `docs/operations/autonomous-snake-rollback-matrix.md`
- `docs/operations/autonomous-snake-handoff.md`

### AI Maze Escape

- `docs/reviews/AI_MAZE_ESCAPE_FINAL_REVIEW.md`
- `docs/operations/ai-maze-escape-runbook.md`
- `docs/operations/ai-maze-escape-r5-evidence-intake.md`
- `docs/operations/ai-maze-escape-rollback-matrix.md`
- `docs/operations/ai-maze-escape-handoff.md`

### AI City Traffic Experiment

- `docs/reviews/AI_CITY_TRAFFIC_FINAL_REVIEW.md`
- `docs/operations/ai-city-traffic-runbook.md`
- `docs/operations/ai-city-traffic-r5-evidence-intake.md`
- `docs/operations/ai-city-traffic-rollback-matrix.md`
- `docs/operations/ai-city-traffic-handoff.md`
- `docs/releases/ai-city-traffic-production-candidate.md`

Promotion to `production ready` is permitted only when the frozen deployed candidate’s final assessor returns `PASS`, `R5`, and `productionReady: true` with zero open P0/P1 findings.
