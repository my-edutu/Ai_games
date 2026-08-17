# AI Games — Autonomous Livestream Game Platform

This monorepo builds a catalogue of autonomous games for uninterrupted YouTube and Twitch entertainment on one shared deterministic simulation, audience-interaction, broadcast, durability, operations and release-governance platform.

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
  → writer leases, recovery, supervisor, output health and controls
  → release freeze, traceability, endurance, canary and readiness assessor
```

## Implementation status

| Game | Software phases | Score | Highest truthful readiness | Production status |
|---|---:|---:|---|---|
| Autonomous Snake | 6 / 6 | R4 evidence-gated candidate | R4 | External R5 evidence blocked |
| AI Maze Escape | 6 / 6 | **88 / 100** | R4 | External R5 evidence blocked |
| Games 3–12 | Documentation/specification packages | Not scored | Pre-implementation | Not production ready |

No game is labelled R5 merely because code merged or CI passed. Production readiness requires exact-candidate primary evidence, real elapsed operation, current credentialed providers, external review, independently witnessed drills, and a guarded canary.

## AI Maze Escape review snapshot

Game 2 implements deterministic generation and oracle validation, partial-observation belief and planning, keys/doors/traps/threats, responsive broadcast UI, safe audience influence, durable commands/events/snapshots/audit, verified restore and quarantine, operations/chaos, release governance, and an evidence-based readiness assessor.

The reviewed runtime candidate passed 251 / 251 Node tests and 8 / 8 catalogue Chromium tests. Internal architecture, gameplay, UI, interaction, durability and release-governance review closed all load-bearing software findings. Its score remains 88 / 100 because the final 12 points require real production evidence.

## Documentation contract

Every game has product requirements, game design, autonomous AI, viewer interaction, audiovisual direction, technical architecture, testing strategy, production-readiness gates, and six executable implementation phases. Reusable specialist skills live under `skills/`; shared architecture and standards live under `docs/`; reproducible phase evidence lives under `evidence/`.

## Safe audience influence

Paid or free audience input cannot guarantee victory, death, capture, escape, a record, or an unavoidable terminal outcome. All interactions share authentication, moderation, eligibility, rate, cap, conflict, expiry, reversal, idempotency, audit, privacy, and emergency-disable boundaries.

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

Promotion to `production ready` is permitted only when the frozen deployed candidate’s final assessor returns `PASS`, `R5`, and `productionReady: true` with zero open P0/P1 findings.
