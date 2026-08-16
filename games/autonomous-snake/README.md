# Autonomous Snake

Autonomous Snake is the catalogue reference implementation: a deterministic self-playing Snake simulation designed for long-running livestream entertainment, escalating progression, clear spectator comprehension, safe audience influence, replayability, and automatic recovery.

## Current Readiness

| Phase | Readiness | Status |
|---|---|---|
| Phase 1 — Deterministic Headless Foundation | R1 | Completed and merged |
| Phase 2 — Survival AI, Progression and Procedural Content | R2 gameplay | Completed and merged |
| Phase 3 — Premium Broadcast Experience | R2 broadcast candidate | Completed on PR #5; verified evidence recorded |
| Phase 4 — Audience Interaction and Chat vs AI | R3 target | Next implementation phase |
| Phase 5 — Persistence, Recovery, Observability and Operations | R4 target | Not started |
| Phase 6 — Production Validation, Canary and Launch | R5 target | Not started |

**Production-ready status is not yet claimed.** R5 requires provider validation, production persistence and operations, a full engineering soak, production-reference audiovisual measurements, a 72-hour frozen-candidate soak, operational drills, a real seven-day canary, and an independent production-readiness verdict.

## Product Promise

The game continuously starts, plays, progresses, wins or loses legitimately, resolves the result, enters an intentional intermission, and starts another deterministic run. Later audience features may influence bounded events but cannot buy a guaranteed victory, death, record, or unavoidable immediate collision.

## Implemented Reference Stack

```text
Seeded authoritative simulation
  → Layered autonomous survival AI
  → Validated procedural boards, hazards, portals and objectives
  → Immutable privacy-safe render snapshots
  → Scene/HUD/entity/camera/VFX/audio/replay presentation
  → Accessible Canvas browser source
  → Output-health detection and verified view recovery
```

## Phase 3 Verification Snapshot

- 56/56 Node model and integration tests pass.
- 3/3 Chromium browser-source tests pass.
- Twin runtimes remain checksum-identical while presentation runs independently.
- Renderer recovery and full result/intermission/restart presentation are verified.
- Desktop 1920×1080, phone-size 640×360, and clean-feed 1280×720 captures are retained in GitHub Actions artifact `9268139446`.
- Public state contains no seed, raw run ID, provider/user/payment data, internal AI search details, stack traces, or operator diagnostics.
- No third-party visual/audio media asset is shipped by the Phase 3 candidate.

## Documentation

- `PRD.md` — product requirements and success model
- `GAME_DESIGN.md` — rules, progression and spectator experience
- `AI_SYSTEM.md` — autonomous strategy and failure behavior
- `VIEWER_INTERACTION.md` — bounded audience influence policy
- `AUDIO_VISUAL.md` — visual, audio and accessibility direction
- `TECHNICAL_ARCHITECTURE.md` — authoritative interfaces and boundaries
- `TESTING_STRATEGY.md` — deterministic, statistical and operational testing
- `PRODUCTION_READINESS.md` — R1–R5 evidence gates
- `phases/` — exact implementation phases and handoffs

## Local Commands

```bash
npm ci
npm test
npm run snake:stream:self-test
npm run snake:stream
npm run test:browser
```

The public browser source is served at the configured host root. Operator accessibility/output controls are intentionally hidden from stream capture and are exposed only by adding `?controls=1` locally.
