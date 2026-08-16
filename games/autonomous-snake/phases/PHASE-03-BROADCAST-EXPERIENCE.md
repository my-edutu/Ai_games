# Phase 3 — Premium Broadcast Experience

**Phase status:** Implementation complete; R2 broadcast candidate verified  
**Completed candidate:** `r2-phase-03`  
**Verified implementation head:** `c55cd0f57544270a0ee0736dcdabb08185d4de7d`  
**CI evidence:** GitHub Actions run `31964576797` — success  
**Viewer-visible outcome:** A full autonomous Snake run is rendered through a premium, accessible browser source, communicates goal/progress/danger/intent/result, recovers its view from the latest verified snapshot, and restarts without operator action.

## Objective

Implement the stream-facing player, render adapter, HUD, camera, VFX, semantic audio, captions, scenes, replay buffer, clean feed, and output-health supervision using the Phase 2 semantic contracts. Presentation improves comprehension without mutating or duplicating authoritative rules.

## Delivered

### Presentation Contract and Authority Isolation

- versioned, deeply frozen, checksummed and privacy-safe `RenderSnapshot`;
- hashed public run token and deterministic monotonic presentation revision;
- duplicate, stale, unsupported and divergent-snapshot handling;
- twin-runtime checksum proof that different presentation schedules do not alter authority;
- complete reconstruction from the latest accepted snapshot;
- public state excludes seed, raw run ID, provider/user/payment data, state-hash history, planner internals, stack traces and internal failure text.

### Visual Entities, HUD and Scenes

- deterministic entity registry for snake, objectives, obstacles, hazards and portals;
- stable create/update/remove lifecycle and bounded interpolation;
- desktop/phone responsive safe-zone layout;
- prominent length/goal, percentage/profile, record, AI intent, caption/status and integrity hierarchy;
- normal, danger, milestone, result, intermission, recovery, maintenance and clean-feed behavior;
- explicit result labels for victory, wall, obstacle, hazard, self-collision and stagnation;
- operator controls hidden from public capture and exposed only through `?controls=1`.

### Canvas Browser Source

- dependency-free Node HTTP host and Canvas 2D browser source;
- board, snake head/body/tail, standard/bonus objective, obstacle, pulsing hazard and portal rendering;
- semantic shape differences so color is not the sole carrier of meaning;
- device-pixel-ratio cap, bounded particles and no unsafe HTML injection;
- `/snapshot`, `/replay` and `/health` endpoints;
- Content Security Policy, no-store live state, referrer restriction and MIME hardening.

### Camera, VFX, Audio and Replay

- bounded overview, danger, milestone, result and recovery camera modes;
- semantic VFX priority, dedupe, duration, active-count and reduced-mode controls;
- semantic audio buses, priority, cooldown, voice stealing, music-state dwell and caption alternatives;
- generated Web Audio cues with no shipped third-party media asset;
- bounded defensive replay ring buffer;
- result → intermission → new-run presentation verification.

### Accessibility and Degradation

- phone-size landscape capture and layout checks;
- reduced-motion and reduced-flash scheduler behavior;
- muted-audio mode that retains captions and visible meaning;
- clean feed that removes all overlays and controls;
- stale, black, frozen, wrong-scene and unintended-silence fault classification;
- deterministic rebuild and safe-slate behavior;
- no public technical error details.

## Explicit Non-Scope Retained

Live YouTube/Twitch events, gifts and paid entitlements, final operator dashboard, production database, OBS/capture-card supervision, calibrated production audio, 24/72-hour soak, production canary, and R5 launch remain later phases.

## Verification

### Automated Model and Integration Tests

- `56` passed, `0` failed;
- full Phase 1 and Phase 2 regressions retained;
- total test duration on the reference CI runner: `3996.321655 ms`.

### Autonomous Stream Self-Test

- twin runtime authority remained identical through `900` steps;
- `901` snapshots accepted, `0` rejected;
- renderer recovery verified;
- complete victory → result → intermission → tick-zero new-run path verified;
- final registry size `73`, replay size bounded at `360`;
- privacy and asset checks passed.

### Actual Chromium Capture

- `3/3` Playwright tests passed in `7.3 s`;
- desktop public source: `1920×1080`;
- phone-size landscape source: `640×360`;
- reduced-motion/muted/clean-feed source: `1280×720`;
- no console or page errors;
- no horizontal overflow;
- public operator controls absent;
- capture artifact `9268139446`, SHA-256 `8e91757c7dae91bc5f99310c668e1aace89be4be413f1ceceae25859f1d27dfb`.

### Reference CI Animation Measurement

At 1920×1080 in constrained headless Chromium:

- `23` animation frames over `1002 ms`;
- `22.9541` average FPS;
- `50.1 ms` maximum measured frame gap;
- continuous-animation/frozen-output gate passed.

This is a CI baseline, not a production GPU or encoder budget.

## Acceptance Criteria and Gate Decisions

- [x] Full runs resolve and restart through the public stream application without manual action.
- [x] Presentation cannot change authoritative checksums under different frame schedules or component recovery.
- [x] Goal, head, objective, hazard, progress and result remain readable in tested desktop and phone captures.
- [x] Reduced-motion, reduced-flash, captions, muted-audio and clean-feed modes preserve critical meaning.
- [x] Result output uses the exact authoritative cause and distinguishes technical recovery from game loss.
- [x] Renderer/output faults activate recovery or safe output and reconstruct from the latest verified snapshot.
- [x] Particles, VFX, voices, captions, replay, text, DPR and public UI state are explicitly bounded.
- [x] No unlicensed or placeholder audiovisual asset is shipped.
- [x] Specification and engineering reviews contain no open P0/P1 finding.
- [ ] Independent uninstructed ten-second human comprehension study — accepted P2, required again during Phase 6 canary validation.
- [ ] Production-reference GPU/encoder frame budget and long browser-resource slope — accepted P2, required during Phase 5 soak and Phase 6 candidate validation.
- [ ] Calibrated loudness, true peak and capture-chain silence/clipping validation — accepted P2, required during Phase 5–6 production-chain work.

Unchecked items are not silently waived as production-ready evidence. They are non-blocking for the R2 broadcast-candidate handoff because they depend on the production capture environment and real audience validation created in later phases; they remain blocking for R5.

## Evidence Bundle

Evidence is stored under `evidence/autonomous-snake/r2-phase-03/phase-03/`:

- `manifest.json`;
- `test-report.txt`;
- `stream-self-test.json`;
- `capture-manifest.json`;
- `performance-baseline.json`;
- `accessibility-review.md`;
- `asset-licence-manifest.json`;
- `review.md`.

The actual screenshots, metrics and Playwright report are retained in GitHub Actions artifact `9268139446`.

## Rollback

The presentation release is versioned separately as `snake-broadcast-v1`. A failed presentation candidate can revert browser assets and presentation modules while the authoritative simulation continues. An incompatible render contract switches public output to a safe scene before the last compatible presentation is restored.

## Exit and Handoff

Phase 3 exits at **R2 broadcast candidate**. Phase 4 consumes the immutable snapshot, semantic event, HUD, VFX, audio and recovery contracts to add a provider-neutral audience gateway, bounded effect catalogue, deterministic votes, Chat vs AI pressure rounds, moderation, idempotency and auditable interaction consequences.
