# Phase 02 — Precision Movement Graybox

## Status

`VERIFIED — deterministic mechanics-only precision movement scope`

## Purpose

Prove Eko Run is an excellent deterministic platformer controller with Lagos art, character art, camera effects, VFX, audio and HUD removed. Phase 2 owns movement and collision truth only.

## Mandatory skill review

All 22 Eko Run specialist domains were applied across the three review/improvement passes. Load-bearing reviewers were `game-physics`, `platformer-experience-review`, `deterministic-simulation`, `game-feel-vfx`, `difficulty-failure-balancing`, `performance-optimization`, `simulation-qa`, architecture, reliability and production-readiness review.

The full experience rubric was also applied honestly to the mechanics-only candidate. Categories intentionally absent from Phase 2 are scored `0 / deferred` in `evidence/eko-run/phase2/PHASE-02-EXPERIENCE-REVIEW.md`; they are not represented as completed.

## Acceptance criteria

- [x] Ground acceleration, braking and air control are deliberate and bounded.
- [x] Jump supports coyote time, input buffering and variable release.
- [x] Fast player motion and deterministic moving-solid sweeps cannot tunnel through outcome-critical Phase 2 graybox geometry.
- [x] Ceiling, wall, step and slope contacts remain deterministic and penetration-safe within declared collision tolerance.
- [x] Slide uses a lower collider and cannot stand or jump-expand through an obstruction.
- [x] Vault is explicit, bounded, obstacle-eligible, never automatic, and validates authoritative body clearance over current/future path samples.
- [x] Ordinary landing never locks legal control; severe landing may enter a bounded stumble with automatic deterministic recovery.
- [x] Gameplay death is distinct from integrity/technical failure and a restart command restores legal checkpoint support deterministically.
- [x] Exactly one sorted move authority wins per tick; losing legal moves are auditable as `MOVE_CONFLICT` rather than reported accepted.
- [x] Identical authoritative input streams produce identical checksums independent of 30/60/120 Hz presentation sampling.
- [x] Mechanics-only p99 tick remains below 4 ms and worst tick below 16.67 ms in exact-candidate CI evidence.
- [x] Phase 1 determinism, snapshot/restore, command ordering and render-snapshot guarantees remain green.
- [x] Three specialist review/improvement passes have no unresolved stop-ship, P1 or P2 finding in Phase 2 scope.

## Verification record

Runtime/evidence candidate:

- `af9d322115cd9c187d78823fd43bce0f938a3784`

Exact-candidate CI:

- dedicated `Eko Run Phase 2 Movement` run `34936307144` — success;
- full `Autonomous Games CI` run `34936307163` — success.

Deterministic evidence artifact:

- artifact `10383279034`, `eko-run-phase2-evidence`;
- digest `sha256:60fa522ce2e6281abe76cf546bd61d941f7eb0f017b7567d010d4a19c271c4e9`;
- 1,051 measured authoritative ticks;
- p99 `0.321217 ms` (`< 4 ms` budget);
- worst `0.443234 ms` (`< 16.67 ms` budget);
- repeat determinism pass;
- snapshot/restore continuation pass with matching checksum `5001c2e0f4caae6c`.

Evidence documents:

- `evidence/eko-run/phase2/PHASE-02-RESULTS.md`
- `evidence/eko-run/phase2/PHASE-02-EXPERIENCE-REVIEW.md`
- `evidence/eko-run/phase2/PHASE-02-REVIEW-1.md`
- `evidence/eko-run/phase2/PHASE-02-REVIEW-2.md`
- `evidence/eko-run/phase2/PHASE-02-REVIEW-3.md`

## Representative play interpretation for this phase

The project-wide gate requires normal-speed and slow-motion review. Phase 2's approved implementation plan explicitly keeps presentation absent from the mechanics gate, so representative play is reviewed from the same authoritative simulation at two diagnostic levels:

- **normal speed:** fixed 60 Hz deterministic control trajectories and the headless stress scenarios;
- **slow motion / frame step:** tick-by-tick state, contacts, timers, semantic events and replay continuation used by the adversarial tests.

This satisfies the mechanics-only Phase 2 gate without inventing a renderer, camera, animation or visual capture that belongs to later phases. Those presentation domains remain open and can still block later phases.

## Explicit non-goals

Character mesh/costume art, animation clips, Three.js world presentation, final camera, Lagos hazards, traffic AI, audio, HUD, viewer influence and production readiness are not Phase 2 completion claims. They remain owned by later phases.

## TDD evidence rule

The Phase 2 movement corpus and all three adversarial review corpora were committed before the corresponding production fixes and observed failing in CI for the intended missing behavior. The final exact runtime candidate then passed the dedicated Phase 2 workflow and full catalogue CI. See `PHASE-02-RESULTS.md` for the RED → GREEN commit/run mapping.

## Gate decision

**PASS — mechanics-only precision movement scope.**

Phase 3 must begin from an integrated `main` commit after Phase 2 branch integration; this Phase 2 status does not itself claim that integration has occurred.
