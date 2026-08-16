# Autonomous Snake Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a premium, accessible, renderer-independent autonomous Snake broadcast vertical slice that consumes immutable render snapshots and never mutates simulation authority.

**Architecture:** The simulation remains the only authoritative writer. A pure presentation adapter emits privacy-safe immutable snapshots; deterministic scene/HUD models, an entity registry, camera/layout models, bounded VFX/audio schedulers, replay storage and output-health supervision consume those snapshots. A dependency-free Node host serves a Canvas 2D browser source that polls snapshots and can rebuild entirely from current state.

**Tech Stack:** TypeScript 5.8.3, Node.js 22.16, Node test runner, Canvas 2D browser source, Web Audio API with caption fallback, GitHub Actions.

## Global Constraints

- Presentation cannot mutate, time, pause, score, collide, move or restart authoritative gameplay.
- Public output contains no seed, raw provider payload, payment data, viewer identity, internal error, stack trace or debug state.
- Goal, progress, snake head, current objective, danger and terminal cause remain understandable at phone-size viewing.
- Color is never the only carrier of meaning.
- Animation, particles, camera impulses, voices, captions and replay frames are bounded.
- Reduced-motion, reduced-flash, color-safe, muted-audio, captions and clean-feed variants preserve critical meaning.
- Renderer/audio failure cannot stop simulation and must recover from the latest accepted snapshot.
- All behaviour changes follow red-green-refactor and retain Phase 1–2 regression coverage.

---

### Task 1: Reproducible CI and presentation contracts

**Files:** `.github/workflows/ci.yml`, `package.json`, `games/autonomous-snake/src/presentation/*.ts`, `tests/phase3/presentation-contract.test.cjs`

**Interfaces:** Produces `RenderSnapshot`, `PresentationHost`, `EntityRegistry`, `HudModel`, responsive layout and scene contracts.

- [ ] Add CI with pinned Node and TypeScript.
- [ ] Write failing tests for immutable snapshots, public-data exclusion, stale/divergent rejection, stable entity lifecycle, scene/HUD hierarchy and authority checksum independence.
- [ ] Implement the smallest pure models that pass.
- [ ] Run focused Phase 3 tests and full regression suite.

### Task 2: VFX, audio, replay and accessibility

**Files:** `presentation/cues.ts`, `presentation/audio.ts`, `presentation/camera.ts`, `presentation/replay.ts`, `tests/phase3/sensory.test.cjs`

**Interfaces:** Produces bounded cue/audio frames, camera framing, caption alternatives and replay windows.

- [ ] Write failing priority, dedupe, expiry, reduced-mode, voice-stealing, music-hysteresis, caption, camera-bound and replay-cap tests.
- [ ] Implement bounded semantic schedulers with no authoritative imports.
- [ ] Verify muted audio and reduced modes preserve captions/meaning.

### Task 3: Output health and autonomous browser source

**Files:** `presentation/health.ts`, `presentation/controller.ts`, `scripts/serve-snake-stream.cjs`, `public/snake-stream/*`, `tests/phase3/stream-host.test.cjs`

**Interfaces:** Produces safe-slate/rebuild decisions, a complete snapshot endpoint, browser-source assets and `--self-test` verification.

- [ ] Write failing health/recovery and host self-test assertions.
- [ ] Implement stale/black/frozen/wrong-scene/silence detection and verified reconstruction.
- [ ] Implement a no-dependency Node stream host and Canvas 2D client.
- [ ] Verify frame schedule and presentation restarts do not change authoritative checksums.

### Task 4: Evidence, review and phase gate

**Files:** `evidence/autonomous-snake/r2-phase-03/phase-03/*`, `games/autonomous-snake/phases/PHASE-03-BROADCAST-EXPERIENCE.md`, `games/autonomous-snake/src/manifest.ts`

**Interfaces:** Produces test output, static capture fixtures, performance/resource measurements, asset licence manifest, review and readiness verdict.

- [ ] Record fresh CI/test/self-test results and bounded-resource campaign output.
- [ ] Review specification compliance separately from engineering quality.
- [ ] Fix all P0/P1 findings and rerun verification.
- [ ] Mark Phase 3 complete only with evidence; do not claim provider, production-operations or public-launch readiness.
