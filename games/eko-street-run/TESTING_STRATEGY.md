# Eko Run Testing Strategy

**Game:** Eko Run (`eko-street-run`)  
**Purpose:** Make every gameplay, experience, reliability and release claim falsifiable.  
**Status:** `approved` for Phase 1  
**Owning scope:** All phases  
**Related:** `PRD.md`, `TECHNICAL_ARCHITECTURE.md`, `docs/EKO_EXPERIENCE_STANDARD.md`.  
**Last material review:** 2026-09-15  
**Version:** `TEST-1.0`

## Test-First Rule

Every runtime behaviour change follows red-green-refactor:

1. write one focused test with the expected outcome;
2. run it and confirm failure for the missing behaviour rather than a setup error;
3. implement the minimum behaviour;
4. run the focused test;
5. run affected integration/replay tests;
6. refactor while green;
7. preserve discovered defects as regression fixtures/seeds.

A flaky test is a defect. Rerunning until green is not evidence.

## Requirement Traceability

`REQUIREMENT_TRACEABILITY.md` maps every PRD MUST to owning phase, implementation path and evidence. Runtime requirements cannot close by prose alone.

## Test Layers

### Unit

Pure config validation, PRNG derivation/draws, quantization, checksum canonicalization, command validation/order, movement integration, checkpoint/result rules.

### Contract/schema

Command, semantic event, render snapshot, persistence snapshot, replay log, later audience envelope and AI observation/action schemas.

### Property/invariant

- unique/stable IDs;
- finite/bounded numeric state;
- monotonic tick/event sequence;
- checkpoint/terminal result cannot regress illegally;
- legal command cannot produce unsupported lifecycle value;
- no duplicate command side effect;
- mandatory generated path remains reachable in later phases;
- terminal result becomes immutable except explicit fresh-run lifecycle.

### Deterministic replay

- same process repeat;
- independent state construction repeat;
- 30/60/120 Hz presentation schedule around the same 60 Hz authority;
- snapshot boundary/restore repeat;
- command batch order normalization;
- cosmetic stream extra draws do not change authoritative checksum;
- deliberate corrupt snapshot/checksum is rejected.

### Physics

Phase 1: horizontal/gravity/ground invariants and frame independence.  
Phase 2+: corners, edges, slopes, thin geometry, high speed, moving vehicles/platforms, simultaneous contacts, spawn/restore overlap and contact storms.

### Procedural generation

Phase 6+: hard validity, reachability, bounded repair/fallback, seed feature distribution, duplicate/near-duplicate rate, generation tails, agent benchmark and broken-seed regression corpus.

### Autonomous agents

Phase 8+: action legality, hidden-information leakage, decision budgets, stuck/oscillation/recovery, fallback/model-outage, path diversity and adversarial seeds.

### Audience/moderation/security

Phase 9+: duplicate/reorder/reconnect/reversal, rate/cooldown/conflict, malicious text/confusables, moderation outage, forged/replayed provider events, privacy/log redaction, provider full outage.

### Browser/presentation/accessibility

Phase 3+: render snapshot consumption, controls, mobile/crop layout, five-second comprehension, color-safe hierarchy, reduced motion/flash, muted-audio meaning, camera causality, VFX density and screenshot/video regressions.

### Audio

Phase 4/7+: semantic cue mapping, voice/density limits, clipping/silence, mobile/encoded-stream intelligibility, device/context restart and missing-asset fallback.

### Performance/reliability

Per-phase representative p50/p95/p99/worst metrics; later memory/handle/texture/audio/queue slopes, load, soak, chaos, restore, output health and rollback drills.

## Phase 1 Fixture Corpus

### `foundation-zero`

Seed `eko-foundation-zero`, no movement for 120 ticks. State remains valid, player stays grounded, progress does not advance spuriously.

### `foundation-forward`

Seed `eko-foundation-forward`, deterministic move-right command stream sufficient to pass x=10 checkpoint and x=20 finish. Expected checkpoint and final checksums are captured after implementation and become regression fixtures.

### `foundation-command-order`

Same logical commands supplied in shuffled arrays; normalized accepted order and final checksum match.

### `foundation-duplicate`

Duplicate `(sourceId, sourceSequence)` input; side effect occurs at most once and a stable rejection/ignore result is observable.

### `foundation-restore`

Snapshot before checkpoint, continue to finish; restore snapshot and replay remaining accepted commands; final checksum equals uninterrupted result.

### `foundation-cosmetic-isolation`

Draw the cosmetic stream extra times outside authority; authoritative route/traffic/AI/reward/audience stream states and final checksum remain identical.

### `foundation-render-schedule`

Drive the same authority ticks while requesting render snapshots at simulated 30, 60 and 120 Hz cadences; final authoritative checksum matches.

## Phase 1 Test Files

- `tests/foundation/eko-run-docs.test.cjs`
- `tests/foundation/eko-run-state.test.cjs`
- `tests/foundation/eko-run-determinism.test.cjs`
- `tests/foundation/eko-run-commands.test.cjs`
- `tests/foundation/eko-run-replay.test.cjs`
- `tests/foundation/eko-run-presentation.test.cjs`
- `tests/foundation/eko-run-architecture.test.cjs`

The repository `npm test` already compiles TypeScript and runs `tests/foundation/*.test.cjs`, so Eko foundation coverage participates in catalogue CI without a separate untrusted runner.

## Evidence Commands

Phase 1 CI evidence uses:

- `npm run build`
- `node --test tests/foundation/eko-run-*.test.cjs`
- `npm test`
- `node scripts/run-eko-run-headless.cjs`

The final evidence file records exact commit, Node/runtime, commands, pass/fail counts, deterministic checksums and measured foundation tick timing.

## Statistical/Balance Plan

Phase 1 does not make balance claims. Phase 6+ predeclares seed strata, run counts/sequential rule, confidence intervals, effect-size thresholds, failure categories and representative replay selection before tuning conclusions.

## Failure Triage

- **P0:** integrity/security/data corruption or unsafe external side effect.
- **P1:** MUST violation, replay divergence, unavoidable ordinary gameplay defect, unrecoverable system failure.
- **P2:** bounded meaningful quality defect.
- **P3:** refinement with no violated gate.

P0/P1 blocks the affected phase. Technical failure is never reclassified as a gameplay loss to improve metrics.

## Evidence Retention

Phase evidence lives under `evidence/eko-run/phaseN/` with version/commit/config/seed information. Large video/profile artifacts may live in CI artifacts with a manifest link/hash rather than bloating source control.

## Phase 0 Static Documentation Gate

`eko-run-docs.test.cjs` verifies required documents, key architecture terms and prohibited placeholder scan. It does not pretend to verify runtime behaviour.

## Phase 1 Gate

Pass only when focused Eko tests and affected catalogue tests are green; replay checksums match all declared variants; corruption is detected; authority boundaries hold; headless route completes; and fresh CI evidence matches the candidate commit.
