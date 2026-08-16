# AI Games — Autonomous Livestream Game Platform

This monorepo contains 12 autonomous, always-on livestream games built on a shared platform architecture.

## Portfolio

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

## Platform Thesis

Each title is designed for continuous autonomous play, repeatable legitimate loss/win cycles, spectator clarity, escalating stakes, persistent records, procedural variation, and safe audience interaction through chat votes, gifts/items, configurable interventions, and operator controls.

The shared platform layers are:

```text
Simulation Authority
  → Autonomous AI
  → Procedural Content and Progression
  → Semantic Events and Event Director
  → Audience Gateway and Moderation
  → Stream HUD, VFX and Audio
  → Events, Snapshots, Replay, Records and Analytics
  → Recovery Watchdog and Operator Controls
```

## Current Execution State

The catalogue documentation foundation is merged. Autonomous Snake is the reference implementation and is being completed phase by phase before its shared packages are reused by the remaining titles.

| Autonomous Snake phase | Status |
|---|---|
| Phase 1 — Deterministic Headless Foundation | Completed and merged |
| Phase 2 — Survival AI and Procedural Content | Completed and merged |
| Phase 3 — Premium Broadcast Experience | R2 broadcast candidate verified on PR #5 |
| Phase 4 — Audience Interaction and Chat vs AI | Next |
| Phase 5 — Persistence, Recovery and Operations | Not started |
| Phase 6 — Production Validation and Canary | Not started |

**No game is currently labelled production ready.** That status requires R5 evidence, including current provider verification, production operations, long soak, operational drills, a real seven-day canary, and independent review.

## Documentation Structure

Each game has a production-grade PRD, game design, AI system, viewer-interaction model, audiovisual direction, technical architecture, testing strategy, production-readiness gates, and six implementation phases. Reusable specialist skills live under `skills/`; shared platform contracts and operating standards live under `docs/`.

## Safe Audience Influence

Paid or free audience input may never guarantee victory, death, a record, or an unavoidable immediate collision. All interactions must use the same verification, moderation, eligibility, cooldown, cap, conflict, expiry, reversal, idempotency, audit, privacy and emergency-disable boundaries.
