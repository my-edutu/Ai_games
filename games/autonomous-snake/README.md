# Autonomous Snake

Autonomous Snake is the catalogue reference implementation: a deterministic self-playing Snake game designed for long-running livestream entertainment, escalating progression, clear mobile spectator comprehension, bounded audience influence, exact replay, durable recovery and evidence-gated release operations.

## Current Readiness

| Phase | Target | Software status |
|---|---|---|
| Phase 1 — Deterministic Headless Foundation | R1 | Completed and merged |
| Phase 2 — Survival AI, Progression and Procedural Content | R2 gameplay | Completed and merged |
| Phase 3 — Premium Broadcast Experience | R2 broadcast | Completed and merged |
| Phase 4 — Audience Interaction and Chat vs AI | R3 interaction | Completed and merged |
| Phase 5 — Persistence, Recovery, Observability and Operations | R4 infrastructure | Completed and merged |
| Phase 6 — Production Validation, Canary and Launch Governance | R5 machinery | Software implementation complete; external launch evidence blocked |

**Highest truthful readiness:** R4  
**R5 readiness verdict:** BLOCKED  
**Production ready:** No

All game/platform software phases are implemented. The remaining work is a real production evidence programme: production-reference capacity/audiovisual validation, credentialed YouTube and Twitch verification, external safety attestations, witnessed drills, a real 72-hour endurance run, a real seven-day canary and an independent exact-candidate review.

## Product Promise

The game continuously:

```text
creates a deterministic run
  → generates a validated board/objective
  → observes and plans
  → moves autonomously
  → eats, grows and changes strategic mode
  → resolves legitimate victory, collision or bounded stagnation
  → presents result/replay/intermission
  → restarts on a new deterministic seed
  → repeats indefinitely
```

Audience interactions may influence bounded events. They cannot buy a guaranteed victory, death, record, final result, or unavoidable immediate collision.

## Implemented Reference Stack

```text
Seeded authoritative simulation
  → layered autonomous survival AI
  → validated procedural boards, hazards, portals and objectives
  → bounded Event Director and influence reducer
  → normalized provider gateway, moderation, votes and Chat vs AI
  → immutable privacy-safe render snapshots
  → HUD, scenes, camera, VFX, audio, captions and replay
  → append-only durable authority and projections
  → single-writer leases, verified restore and quarantine
  → supervisor, output health, breakers, metrics and typed RBAC
  → frozen release manifest, traceability, campaigns and canary control
  → independent R5 readiness assessor
```

## Verification Snapshot

Exact Phase 6 implementation head `5e412685684fc2f6bbfc2e2d29ec969988f8108d` passed:

- **180 / 180 Node tests**;
- **3 / 3 Chromium tests**;
- full Phase 1–5 regression suite;
- stream self-test and autonomous restart/recovery;
- authoritative nondeterminism scan;
- final 50-run baseline/maximum-pressure campaign;
- zero campaign invariant failures;
- zero duplicate authoritative applications;
- 967 maximum-pressure effects applied without duplicate or prohibited terminal effect;
- 26 / 26 synthetic operational drills at implementation level;
- CI-reference capacity budgets;
- exact-source release bundle generation and artifact retention.

The Phase 6 validator returns `BLOCKED / R4`, proving that synthetic/fixture evidence cannot accidentally promote the game to R5.

## Local Commands

```bash
npm ci
npm test
npm run snake:headless
npm run snake:stream:self-test
npm run snake:stream
npm run test:browser
npm run snake:phase5:chaos
CANDIDATE_SOURCE_SHA=<40-character-commit-sha> npm run snake:phase6:validate
```

## Documentation

- `PRD.md` — product requirements and success model
- `GAME_DESIGN.md` — rules, progression and spectator experience
- `AI_SYSTEM.md` — autonomous strategy and failure behavior
- `VIEWER_INTERACTION.md` — bounded audience influence policy
- `AUDIO_VISUAL.md` — visual, audio and accessibility direction
- `TECHNICAL_ARCHITECTURE.md` — authoritative interfaces and boundaries
- `TESTING_STRATEGY.md` — deterministic, statistical and operational testing
- `PRODUCTION_READINESS.md` — R1–R5 evidence gates
- `phases/` — phase specifications and current status
- `../../docs/operations/autonomous-snake-r5-evidence-intake.md` — external R5 programme
- `../../docs/operations/autonomous-snake-handoff.md` — production handoff
- `../../evidence/autonomous-snake/` — phase evidence bundles

## Promotion Rule

Merged code and green CI do not equal production readiness. Change the game’s status to `production ready` only when the exact frozen deployed candidate has completed all external gates and the independent Phase 6 assessor returns:

```text
verdict = PASS
highestTruthfulReadiness = R5
productionReady = true
```