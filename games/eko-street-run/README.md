# Eko Run

**Slug:** `eko-street-run`  
**Purpose:** Catalogue entrypoint for the Eko Run game project.  
**Status:** `in-implementation`  
**Owning phase:** Phase 0 constitution moving into Phase 1 foundation.  
**Authoritative documents:** `PRD.md`, `GAME_DESIGN.md`, `TECHNICAL_ARCHITECTURE.md`, `TESTING_STRATEGY.md`, `docs/EKO_EXPERIENCE_STANDARD.md`, `AGENTS.md`.  
**Last material review:** 2026-09-15  
**Decision ID:** `EKO-V1-CONSTITUTION-001`

## Premise

Eko Run is an original 2.5D/3D Lagos-inspired precision platformer in which Tayo runs through fictionalized city routes, reads traffic and street hazards, preserves momentum, reaches checkpoints, and chases distance records while the environment escalates from ordinary movement to memorable city-scale set pieces.

## Viewer Hook

A viewer joining for five seconds should see one clear story: **Tayo is moving forward through Lagos, a readable danger is approaching, a safe route exists, and the current run record is at stake.**

## Visible Goal and Run Resolution

The primary progress measure is distance/checkpoint progress through the current district. A standard run ends when Tayo completes the current authored run route, loses all current-run recovery capacity through a legitimate gameplay failure, or an integrity condition quarantines the run. Technical failures are never recorded as gameplay losses.

AI Street Run can chain districts into renewable cycles. Every cycle still has checkpoint, district, record, result, intermission, and next-cycle closure.

## Modes

- **Player Mode:** keyboard, gamepad, and touch use the authoritative command interface.
- **AI Street Run:** an autonomous Tayo policy uses the same observations available to the game contract and submits the same legal action commands as a human controller.
- **Viewer Mode:** later phases add bounded, moderated, replayable choices around future route modifiers, themes, or challenge classes. Viewer services remain optional and cannot guarantee survival, failure, or a record.

## Original Identity

Eko Run studies the craft of excellent precision platformers but does not use Nintendo/Mario characters, artwork, layouts, sounds, music, names, or copied assets. Its identity comes from Tayo, Nigerian clothing silhouettes, Lagos-inspired spatial/traffic situations, environmental rhythm, soundscape, district progression, and an original visual language.

## Initial District Ladder

1. Mainland Morning
2. Market Rush
3. Danfo Junction
4. Rainy Lagos
5. Island Night
6. Bridge Run

These districts are fictionalized composites inspired by Lagos visual and movement references, not GIS replicas.

## Expected Run Structure

The first launch balance target is a 12–30 minute standard full-district run for a competent human or tuned autonomous policy, with shorter early failures and longer record attempts represented in the target distribution. Phase 6 validates the final distribution using seeded campaigns rather than one showcase route.

## Project Map

- `src/config/` — versions and run configuration.
- `src/state/` — authoritative serializable state.
- `src/runtime/` — fixed-step supervisor, commands, random streams, checksums.
- `src/rules/` — route, checkpoint, hazard, result, reward rules.
- `src/physics/` — kinematic movement/collision.
- `src/generation/` — deterministic route grammar and validators.
- `src/ai/` — autonomous Tayo, traffic and selected NPC policies.
- `src/presentation/` — immutable render snapshots and semantic presentation adapters.
- `src/persistence/` — replay, snapshot, restore and records.
- `src/influence/` — normalized audience requests; disabled until the interaction phase.
- `src/operations/` — health/readiness metadata.
- `phases/` — executable phase contracts.
- `docs/` — project-specific experience and research standards.

## Current Phase

Phase 0 establishes the executable game contract, cultural/visual reference pack, asset provenance and evidence model. Phase 1 establishes a headless deterministic simulation foundation. Three.js scene production begins only after the foundation and precision-movement gates.

## Current Commands

Phase 0 is documentation-only. Phase 1 adds `scripts/run-eko-run-headless.cjs` and foundation test commands. Until those files are committed and verified, no README command claims they exist.

## Known Current Limitations

There is not yet a playable build, renderer, audio engine, controller, AI policy, generated route system, viewer integration, or production deployment. These are owned by the numbered phases in the master plan and may not be represented as complete before evidence exists.
