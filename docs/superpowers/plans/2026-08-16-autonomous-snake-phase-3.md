# Autonomous Snake Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a premium, accessible, renderer-independent autonomous Snake broadcast vertical slice that consumes immutable render snapshots and never mutates simulation authority.

**Architecture:** The simulation remains the only authoritative writer. A pure presentation adapter emits privacy-safe immutable snapshots; deterministic scene/HUD models, an entity registry, camera/layout models, bounded VFX/audio schedulers, replay storage and output-health supervision consume those snapshots. A dependency-free Node host serves a Canvas 2D browser source that polls snapshots and can rebuild entirely from current state.

**Tech Stack:** TypeScript 5.8.3, Node.js 22.16, Node test runner, Canvas 2D browser source, Web Audio API with caption fallback, Playwright 1.55, GitHub Actions.

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

**Files:** `.github/workflows/ci.yml`, `package.json`, `package-lock.json`, `games/autonomous-snake/src/presentation/*.ts`, `tests/phase3/presentation-contract.test.cjs`

**Interfaces:** Produces `RenderSnapshot`, `PresentationHost`, `EntityRegistry`, `HudModel`, responsive layout and scene contracts.

- [x] Add CI with pinned Node, TypeScript, Playwright and a committed dependency lock.
- [x] Write failing tests for immutable snapshots, public-data exclusion, stale/divergent rejection, stable entity lifecycle, scene/HUD hierarchy and authority checksum independence.
- [x] Implement the smallest pure models that pass.
- [x] Run focused Phase 3 tests and the full Phase 1–3 regression suite.

### Task 2: VFX, audio, replay and accessibility

**Files:** `presentation/cues.ts`, `presentation/audio.ts`, `presentation/camera.ts`, `presentation/replay.ts`, `presentation/semantic.ts`, `presentation/experience.ts`, `tests/phase3/sensory.test.cjs`

**Interfaces:** Produces bounded cue/audio frames, camera framing, caption alternatives and replay windows.

- [x] Write failing priority, dedupe, expiry, reduced-mode, voice-stealing, music-hysteresis, caption, camera-bound and replay-cap tests.
- [x] Implement bounded semantic schedulers with no authoritative imports.
- [x] Verify muted audio and reduced modes preserve captions and critical meaning.

### Task 3: Output health and autonomous browser source

**Files:** `presentation/health.ts`, `presentation/controller.ts`, `scripts/serve-snake-stream.cjs`, `public/snake-stream/*`, `playwright.config.cjs`, `tests/phase3/stream-host.test.cjs`, `tests/browser/snake-stream.spec.cjs`

**Interfaces:** Produces safe-slate/rebuild decisions, a complete snapshot endpoint, browser-source assets and `--self-test` verification.

- [x] Write failing health/recovery, lifecycle-revision, autonomous-restart and host self-test assertions.
- [x] Implement stale/black/frozen/wrong-scene/silence detection and verified reconstruction.
- [x] Implement a no-dependency Node stream host and Canvas 2D client.
- [x] Verify frame schedule, presentation failure and autonomous restarts do not change authoritative checksums.
- [x] Capture and validate 1920×1080, 640×360 and clean-feed browser output in Chromium.

### Task 4: Evidence, review and phase gate

**Files:** `evidence/autonomous-snake/r2-phase-03/phase-03/*`, `games/autonomous-snake/phases/PHASE-03-BROADCAST-EXPERIENCE.md`, `games/autonomous-snake/src/manifest.ts`

**Interfaces:** Produces test output, capture fixtures, performance/resource measurements, asset licence manifest, review and readiness verdict.

- [x] Record fresh CI/test/self-test results and bounded-resource output.
- [x] Review specification compliance separately from engineering quality.
- [x] Fix all P0/P1 findings and rerun model, self-test and browser verification.
- [x] Record accepted later-phase P2 gates without claiming provider, production-operations or public-launch readiness.
- [x] Mark Phase 3 implementation complete at the highest evidence-supported level: R2 broadcast candidate.

## Completion Evidence

- GitHub Actions run `31964576797`: success.
- Node model/integration tests: 56 passed, 0 failed.
- Chromium capture tests: 3 passed, 0 failed.
- Stream self-test: twin authority stable, privacy safe, recovery verified, restart observed.
- Capture artifact: `9268139446`, SHA-256 `8e91757c7dae91bc5f99310c668e1aace89be4be413f1ceceae25859f1d27dfb`.
- Review: no open P0/P1; production-chain, long-soak and independent-human validation are retained as explicit Phase 5–6 P2 gates.
