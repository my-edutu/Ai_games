# Autonomous Snake

Autonomous Snake is the catalogue reference implementation: a deterministic self-playing Snake game designed for continuous livestream entertainment, escalating progression, clear mobile spectator comprehension, bounded audience influence, exact replay, durable recovery, and evidence-gated release operations.

## Current Readiness

| Phase | Target | Status |
|---|---|---|
| Phase 1 — Deterministic Headless Foundation | R1 | Completed and merged |
| Phase 2 — Survival AI, Progression and Procedural Content | R2 gameplay | Completed and merged |
| Phase 3 — Premium Broadcast Experience | R2 broadcast | Completed and merged |
| Phase 4 — Audience Interaction and Chat vs AI | R3 interaction | Completed and merged |
| Phase 5 — Persistence, Recovery, Observability and Operations | R4 infrastructure | Completed and merged |
| Phase 6 — Production Validation, Canary and Launch Governance | R5 machinery | Software implementation complete; external launch evidence pending |

**Highest truthful readiness:** R4  
**Phase 6 software candidate:** PASS  
**R5 production verdict:** BLOCKED_EXTERNAL  
**Production ready:** No

All game and platform software phases are implemented. The remaining programme requires evidence that cannot be fabricated in CI: production-reference capacity and audiovisual measurements, credentialed YouTube and Twitch verification, external safety attestations, independently witnessed drills, a real 72-hour endurance run, a real seven-day canary, and an independent exact-candidate review.

## Product Promise

The game continuously:

```text
creates a deterministic run
  → generates and validates a board and objective
  → observes, plans, and moves autonomously
  → eats, grows, and changes strategic mode
  → resolves legitimate victory, collision, or bounded stagnation
  → presents result, replay, and intermission
  → restarts on a new deterministic seed
  → repeats indefinitely
```

Audience interactions may influence bounded events. They cannot buy a guaranteed victory, death, record, final result, or unavoidable immediate collision.

## Implemented Reference Stack

```text
Seeded authoritative simulation
  → layered autonomous survival AI
  → validated procedural boards, hazards, portals, and objectives
  → bounded Event Director and influence reducer
  → normalized provider gateway, moderation, votes, and Chat vs AI
  → immutable privacy-safe render snapshots
  → HUD, scenes, camera, VFX, audio, captions, and replay
  → append-only durable authority and projections
  → single-writer leases, verified restore, and quarantine
  → supervisor, output health, breakers, metrics, and typed RBAC
  → frozen release manifest, traceability, campaigns, and canary control
  → independent fail-closed R5 readiness assessor
```

## Latest Software Verification

Implementation head `3363ac2c6f900b9c3f4202dc8db476530556c87a` passed GitHub Actions run `31971531325`, job `95224633989`:

- **197 / 197 Node tests passed**;
- **3 / 3 Chromium tests passed**;
- locked `npm ci` and strict TypeScript compilation passed;
- the complete Phase 1–5 regression suite remained green;
- stream self-test accepted 901 presentation snapshots with zero rejection, stable authority, verified recovery, and autonomous restart;
- authoritative ambient-nondeterminism scan passed;
- deterministic Phase 5 chaos evidence and Phase 6 release-validation bundles were generated;
- final no-audience and maximum-bounded-pressure campaigns recorded zero invariant failures and zero duplicate authoritative applications;
- all 26 mandatory synthetic drill implementations passed;
- CI-reference software budgets passed while remaining explicitly non-production-reference.

Retained artifacts from that run:

- Phase 3 capture: artifact `9269952746`, SHA-256 `794db7c3af11fe903e246585f96d00b59045a99a272c001e5406e35f7433ec2a`;
- Phase 5 operations: artifact `9269952933`, SHA-256 `7b7b3c8848d6f3aaf53ed45b412917753ff81393b2aa1bb36b70e2bd026f8a19`;
- Phase 6 validation: artifact `9269953069`, SHA-256 `5074ea2fab01c92a8c18a226aefdb7301655e24e092eb5fb56a973d22a51a8f9`.

The Phase 6 validator returns `BLOCKED / R4`, proving that fixture providers, accelerated timestamps, CI hardware, synthetic drills, and self-review cannot accidentally promote the game to R5.

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
- `GAME_DESIGN.md` — rules, progression, and spectator experience
- `AI_SYSTEM.md` — autonomous strategy and failure behavior
- `VIEWER_INTERACTION.md` — bounded audience influence policy
- `AUDIO_VISUAL.md` — visual, audio, and accessibility direction
- `TECHNICAL_ARCHITECTURE.md` — authoritative interfaces and boundaries
- `TESTING_STRATEGY.md` — deterministic, statistical, and operational testing
- `PRODUCTION_READINESS.md` — R1–R5 evidence gates
- `phases/` — phase specifications and current status
- `../../docs/operations/` — operations, launch, canary, and evidence-intake runbooks
- `../../release/autonomous-snake/` — candidate freeze, traceability, canary, and evidence schemas
- `../../evidence/autonomous-snake/` — phase evidence bundles

## Promotion Rule

Merged code and green CI do not equal production readiness. Change the game status to `production ready` only when the exact frozen deployed candidate completes every external gate and the independent Phase 6 assessor returns:

```text
verdict = PASS
highestTruthfulReadiness = R5
productionReady = true
```
