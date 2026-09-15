# Phase 02 — Precision Movement Graybox

## Status

`IN PROGRESS — TDD RED corpus authored before production implementation`

## Purpose

Prove Eko Run is an excellent deterministic platformer with all Lagos art, character art, camera effects, VFX, audio and HUD removed. Phase 2 owns movement and collision truth only.

## Mandatory skill review

All 22 Eko Run skills are loaded for the phase. Load-bearing reviewers are `game-physics`, `platformer-experience-review`, `deterministic-simulation`, `game-feel-vfx`, `difficulty-failure-balancing`, `performance-optimization`, and `simulation-qa`.

## Acceptance criteria

- Ground acceleration, braking and air control are deliberate and bounded.
- Jump supports coyote time, input buffering and variable release.
- Fast motion cannot tunnel through outcome-critical graybox geometry.
- Ceiling, wall, step and slope contacts remain deterministic and penetration-free within declared skin tolerance.
- Slide uses a lower collider and cannot stand through an obstruction.
- Vault is explicit, bounded, obstacle-eligible and never automatic.
- Ordinary landing never locks legal control; severe landing may enter a bounded stumble with automatic recovery.
- Gameplay death is distinct from integrity/technical failure and a restart command restores the checkpoint deterministically.
- Identical authoritative input streams produce identical checksums independent of 30/60/120 Hz presentation sampling.
- Mechanics-only p99 tick remains below 4 ms and worst tick below 16.67 ms in CI evidence.
- Phase 1 determinism, snapshot/restore, command ordering and render-snapshot guarantees remain green.
- Three specialist review/improvement passes have no unresolved stop-ship or P1 finding.

## Explicit non-goals

Character mesh/costume art, animation clips, Three.js world presentation, final camera, Lagos hazards, traffic AI, audio, HUD, viewer influence and production readiness are not Phase 2 completion claims. They remain owned by later phases.

## TDD evidence rule

The Phase 2 test corpus is committed before production behavior. CI must show expected failures caused by missing movement functionality, then the same corpus must turn green after implementation.
