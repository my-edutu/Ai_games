# AI Maze Escape — Will It Find the Exit?

AI Maze Escape is the catalogue’s second implemented autonomous livestream game. A partially observed explorer discovers procedurally generated mazes, builds a bounded belief map, plans around keys and doors, survives traps and moving threats, reaches a hidden exit, presents a route/result replay, and automatically begins the next deterministic challenge.

## Current readiness

| Phase | Target | Software status |
|---|---|---|
| Phase 1 — Deterministic Maze Foundation | R1 | Complete |
| Phase 2 — Partial-Observation AI, Threats, and Progression | R2 gameplay | Complete |
| Phase 3 — Broadcast Map, HUD, Audio, and Replay | R2 broadcast | Complete |
| Phase 4 — Audience Influence and Chat vs AI | R3 | Complete |
| Phase 5 — Persistent Campaigns, Recovery, and Operations | R4 | Complete |
| Phase 6 — Production Validation and Launch Governance | R5 machinery | Software complete; external evidence blocked |

```text
Production-readiness score: 88 / 100
Highest truthful readiness: R4
R5 verdict: BLOCKED_EXTERNAL
Production ready: false
Open software P0: 0
Open software P1: 0
```

## Endless autonomous loop

```text
generate and validate a seeded maze
  → reveal only permitted cells
  → update the explorer belief map
  → choose a safe frontier, key, door, exit, or evasion action
  → resolve movement, inventory, traps, threats and audience effects
  → escape or fail for a rule-valid cause
  → show result and discovered route
  → update eligible records
  → intermission and next deterministic seed
  → repeat indefinitely
```

## Implemented systems

- five topology/content profiles: tree, loops, chambers, layers, and hunter;
- constructive generation, connectedness checks, key-before-lock dependencies, and exact solution oracle;
- fixed-step authority, named random streams, checksums, snapshots, restore, replay, result/intermission/restart;
- hidden-information-safe observation and bounded belief map;
- known-space pathing, frontier exploration, dependency planning, stuck recovery, threat evasion, and deterministic fallback;
- keys, doors, clues, checkpoints, traps, paused/active threat semantics, progression and dramatic-pattern campaigns;
- privacy-safe public snapshots, focused public-knowledge camera, responsive HUD, route trails, audio/captions, clean feed and safe recovery;
- bounded votes and ten validated audience-effect classes with moderation, caps, cooldowns, expiry, reversal and exactly-once application;
- append-only events/commands/snapshots/audit, file-backed durability, leases, stale-writer fencing, verified restore, older-snapshot fallback and quarantine;
- metrics, alerts, RBAC, operator controls, output health, chaos, release manifest, traceability, capacity/endurance contracts, canary and readiness assessor.

## Verification snapshot

Reviewed runtime candidate `cd77b7a59cbcf01074825777426c413b34d122be` passed 251 / 251 Node tests and 8 / 8 catalogue Chromium tests in workflow `31998030132`. The final Maze captures, operations evidence, and release-validation evidence were retained as artifacts `9277539661`, `9277540030`, and `9277540366`.

## Local commands

```bash
npm ci
npm test
npm run maze:headless
npm run maze:stream:self-test
npm run maze:stream
npm run test:browser
npm run maze:phase5:chaos
CANDIDATE_SOURCE_SHA=<40-character-commit-sha> npm run maze:phase6:validate
```

## Documentation and operations

- `PRD.md` — product requirements and measurable acceptance
- `GAME_DESIGN.md` — rules, modes, progression and dramatic patterns
- `AI_SYSTEM.md` — observation, belief, policy, threats and fallback
- `VIEWER_INTERACTION.md` — votes, gifts, effects, moderation and fairness
- `AUDIO_VISUAL.md` — broadcast language, audio and accessibility
- `TECHNICAL_ARCHITECTURE.md` — authoritative boundaries and performance
- `TESTING_STRATEGY.md` — deterministic, statistical, UI and operational tests
- `PRODUCTION_READINESS.md` — score and R1–R5 gates
- `phases/` — Phase 1–6 implementation evidence
- `../../docs/reviews/AI_MAZE_ESCAPE_FINAL_REVIEW.md` — internal final software review
- `../../docs/operations/ai-maze-escape-runbook.md` — incident and drill runbook
- `../../docs/operations/ai-maze-escape-r5-evidence-intake.md` — remaining R5 programme
- `../../docs/operations/ai-maze-escape-rollback-matrix.md` — compatibility/rollback rules
- `../../docs/operations/ai-maze-escape-handoff.md` — production handoff

## Promotion rule

Do not label the game production ready until one exact frozen deployed candidate completes production-reference capacity/audiovisual validation, credentialed current providers, external attestations, independently witnessed drills, a real 72-hour endurance run, a real seven-day canary, and an external signed review, and the assessor returns `PASS / R5 / 100`.
