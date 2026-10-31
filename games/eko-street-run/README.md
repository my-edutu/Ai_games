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

## Current Implementation Evidence

The existing repository contains fixed-step deterministic gameplay, authored/procedural Phase 6 districts, hazard contracts, kinematic movement, character-pose and visual-world presentation packages. Their readiness is determined by tests and evidence rather than package presence.

**Gauntlet 3D preview (feature branch):** the experimental browser viewer at `/eko/` uses Three.js to render a Lagos-inspired streetscape with procedural shopfronts, minibuses, lighting, animated Tayo, road furniture, pedestrians, real hazard positions, six-district visual themes, player/AI controls, and a mobile HUD. A Node host runs the **existing authoritative Phase 6 simulation** at a fixed logical 60Hz; the browser renders immutable public snapshots over server-sent events. The renderer cannot award tokens, bypass hazards, or write physics state.

**Run locally:**

```bash
npm ci
npm run eko:stream
# Open http://127.0.0.1:4177/eko/
# Live quality ledger: http://127.0.0.1:4177/eko/progress
```

**Focused smoke and browser evidence:**

```bash
npm run test:eko:stream
npx playwright install chromium
npx playwright test tests/browser/eko-run-gauntlet.spec.cjs
```

The browser runs in AI mode by default. Switch to Player Mode for left/right, Space to jump, Down to slide, or V to vault. Touch buttons are available on mobile; outfits may be changed for visual exploration without changing hitboxes. Quality Low removes decoration and shadows before gameplay warnings.

**Current art/AI iteration:** Tayo now has a hierarchical original joint rig with articulated shoulders, elbows, wrists, hips, knees, and ankles, expressive facial parts and four layered Nigerian-inspired costume silhouettes. This is a more developed procedural character, but **not** a high-fidelity skinned production mesh. The Lagos streetscape has more detailed buses, painted facade panels, street commerce, balconies, rooftop tanks, water drains and utility lines; static meshes are batched into frustum-culled chunks. An experimental hazard-aware autonomous policy consumes only public game snapshots and legal action commands. Focused model, performance-batching and deterministic-AI tests are available in `tests/eko/`.

**Known shortcomings and review status:** a real Chromium WebGL screenshot at commit `54af280` (GitHub Actions artifact `11538341657`) confirmed improved camera visibility and Tayo readability. It did **not** pass the external Subway Surfers City reference bar, and the capture indicated 5 FPS in CI, which may involve software rendering. The new static batching, skyline and AI revisions are awaiting their own runtime measurements. Six districts still use shared environment grammar, without individually authored premium assets. Normal-speed gameplay critique, device-specific performance, independent reviewers and blind A/B, production audio and materials, and endurance/release approval all remain open. The ledger deliberately does not claim a quality-bar win or production readiness.

## Gauntlet Visual Quality Iterations 7–9 (feature branch)

The game now includes an original six-district **chromatic presentation system** with a high-contrast aqua/amber/coral/violet HUD, responsive progress meter, checkpoint countdown, upcoming-hazard warning, compact autonomous-mode controls, and district-reactive colors. The procedural skyline has been expanded into more visually distinctive fictional Lagos streets with stalls, painted shopfronts, posters, produce stands, building balconies, colorful awnings, murals and gardens. A lightweight single-shader sunset sky adds a sun halo and moving cloud depth.

Additional presentation components include capped **event-synchronized VFX** (jump, landing, token, danger and checkpoint), original **opt-in synthesized street ambience and action cues** (no third-party audio assets), and a bounded stream-event accumulator so the browser does not miss events between snapshot updates. None of these components can mutate authoritative physics or award progress.

The latest composition is implemented on this branch; all new modules passed independent JavaScript syntax parsing, but **new browser screenshot / gameplay / GPU tests have not yet completed**. In particular, more procedural density does not imply professional visual polish or verified performance. CI remains responsible for validating new code against mobile/desktop rendering; the latest visual quality verdict is still **BELOW the reference**.

Style and runtime modules: `public/eko-run/theme.css`, `world-vibrance.js`, `atmosphere.js`, `gamefeel.js`, and `soundscape.js`. Quality gates are continuously recorded in `public/eko-run/gauntlet.json`.

**Scope:** development-only host bound to loopback by default. Additional authentication, deployment, multi-operator sessions and remote public viewer infrastructure are not included in this feature.
