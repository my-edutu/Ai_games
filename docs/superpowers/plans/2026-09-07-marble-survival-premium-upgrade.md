# Marble Survival Tournament Premium 2026 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Game 7 — Marble Survival Tournament onto current `main`, preserve its deterministic tournament authority, fix known fairness/physics defects, and upgrade the spectator presentation toward a premium miniature-motorsport broadcast without changing simulation outcomes by rendering quality.

**Architecture:** `MarbleRuntime` remains the sole authority for physics, qualification, elimination and champion state. Presentation consumes authoritative snapshots/events and may interpolate or replay them visually, but it may never decide results. The implementation is split into correctness, recovery, presentation, broadcast direction and verification so each layer can be tested independently.

**Tech Stack:** TypeScript deterministic simulation, Node test runner, browser Canvas/WebGL/Three-style presentation where already used, CSS, seeded RNG, replay checksums.

**Spec:** User-approved Option A architecture from the September 7, 2026 Marble Survival Tournament review.

## Global Constraints

- Start from current `main`; do not continue development directly on the historical Game 7 branch.
- Preserve exact tournament progression `32 → 16 → 8 → 4 → 2 → 1`.
- Rendering quality presets must never change physics ticks, AI decisions, competitors, collision accuracy, tournament events, viewer influence ordering, qualification or champion results.
- Presentation/audio/providers must never mutate authoritative game state.
- Same seed and same accepted influence event sequence must produce the same authoritative result regardless of frame rate or visual preset.
- Do not claim R5 production readiness without genuine external endurance, canary, provider, security, accessibility, recovery and capacity evidence.
- Follow TDD for every bug fix and behavior change: RED → GREEN → refactor.

---

### Task 1: Port the verified Game 7 baseline onto current main

**Files:**
- Create: `games/marble-survival/**` from the historical Game 7 branch without importing branch-wide packaging artifacts.
- Create: only directly related Game 7 test/runner files that are needed to execute the authoritative TypeScript implementation on current main.

**Interfaces:**
- Consumes: current-main `packages/seeded-rng/src/index.ts` and `packages/replay/src/index.ts`.
- Produces: current-main-compatible `MarbleRuntime`, arena generation, physics, tournament rules, persistence and browser runtime.

- [ ] Port the existing Game 7 directory using the historical blobs so the initial behavior is unchanged.
- [ ] Confirm every imported shared package still resolves on current main.
- [ ] Reconcile the historical `complete/game7.cjs` packaging inconsistency rather than treating missing generated files as passing evidence.
- [ ] Run the smallest available compile/test baseline and record any pre-existing failure honestly.

### Task 2: Deterministic finish adjudication

**Files:**
- Modify: `games/marble-survival/src/rules/tournament.ts`
- Modify as required: `games/marble-survival/src/state/types.ts`
- Test: Game 7 tournament regression test file on the new branch.

**Interfaces:**
- Consumes: authoritative pre/post-step marble positions and finish line geometry.
- Produces: deterministic finish ordering based on crossing fraction within the simulation tick, with an explicit stable tie policy only for genuinely indistinguishable crossings.

- [ ] Write a failing test where two marbles cross the line in the same tick and the marble with the smaller ID crosses later.
- [ ] Verify the old implementation incorrectly favors iteration/ID order.
- [ ] Add crossing metadata needed to compare finish fraction deterministically.
- [ ] Sort same-tick finishers by crossing fraction before assigning `finishRank` or filling quota.
- [ ] Add a true-tie regression proving stable deterministic behavior.
- [ ] Run tournament bracket/replay tests and verify checksum stability for unchanged scenarios where ordering does not differ.

### Task 3: Moving-obstacle momentum and tunnelling protection

**Files:**
- Modify: `games/marble-survival/src/physics/solver.ts`
- Modify as required: `games/marble-survival/src/state/types.ts`
- Test: Game 7 physics regression test file.

**Interfaces:**
- Consumes: sweeper transform at previous/current substep and marble velocity.
- Produces: collision response from relative marble/collider velocity with bounded deterministic substeps.

- [ ] Write a failing test proving a moving sweeper does not currently transfer movement into a stationary marble.
- [ ] Verify RED on the historical solver.
- [ ] Evaluate sweeper transform per substep, not once per outer tick.
- [ ] Compute deterministic collider velocity and resolve impact in relative-velocity space.
- [ ] Add high-speed crossing/tunnelling regression coverage.
- [ ] Verify contact ordering and state checksums remain deterministic.

### Task 4: Replace invisible shield teleport with readable deterministic recovery

**Files:**
- Modify: `games/marble-survival/src/rules/tournament.ts`
- Modify as required: `games/marble-survival/src/state/types.ts`
- Test: Game 7 recovery regression test file.

**Interfaces:**
- Consumes: shield charge, hazard contact and current authoritative velocity.
- Produces: bounded deterministic recovery impulse/state rather than unexplained position teleport.

- [ ] Write a failing regression specifying the desired recovery behavior.
- [ ] Preserve shield consumption and elimination rules.
- [ ] Replace arbitrary multi-radius position jump with bounded re-entry/contact response that remains visible to presentation events.
- [ ] Emit one semantic recovery event with enough data for camera/audio/VFX consumers.
- [ ] Verify replay checksums and recovery snapshot restore.

### Task 5: Authoritative presentation snapshot adapter

**Files:**
- Create: `games/marble-survival/src/presentation/snapshot.ts`
- Create: `games/marble-survival/src/presentation/types.ts`
- Test: Game 7 presentation contract tests.

**Interfaces:**
- Consumes: `MarbleState` plus sanitized recent events.
- Produces: immutable presentation snapshot containing identities, positions, authoritative status, round/quota, hazards, camera-interest signals and no seed/RNG/operator secrets.

- [ ] Write privacy and authority-boundary tests first.
- [ ] Add status fields that distinguish `near-finish`, `qualified`, `threatened`, `eliminated` and `champion`.
- [ ] Expose stable non-colour identity tokens (number/pattern/material key).
- [ ] Ensure presentation output cannot mutate or feed back into `MarbleRuntime`.
- [ ] Add stale-snapshot rejection/versioning.

### Task 6: Premium miniature-motorsport scene and marble identity

**Files:**
- Modify: `games/marble-survival/public/complete-runtime/index.html`
- Modify: `games/marble-survival/public/complete-runtime/app.js`
- Modify: `games/marble-survival/public/complete-runtime/styles.css`
- Modify: `games/marble-survival/public/complete-runtime/ux-v2.css`
- Test: browser/static presentation checks.

**Interfaces:**
- Consumes: authoritative presentation snapshots only.
- Produces: premium ivory/charcoal/metal track presentation, readable numbered/patterned marbles, physically plausible visual rolling/interpolation and clean OBS layout.

- [ ] Add static/browser assertions for identity readability, clean feed and authority status labels before changing presentation code.
- [ ] Remove any local-browser result authority or fallback standings logic that can contradict the server runtime.
- [ ] Make the arena dominate the layout and reduce UI chrome.
- [ ] Implement restrained material hierarchy, track joints/supports, hazard readability and contact detail.
- [ ] Derive visual marble rotation from authoritative displacement without feeding rotation back into physics.
- [ ] Keep numbers/patterns readable under Low preset.

### Task 7: Broadcast camera, HUD, semantic audio and quality presets

**Files:**
- Create/modify focused presentation modules as needed under `games/marble-survival/src/presentation/` and `public/complete-runtime/`.
- Test: camera/HUD/audio/performance policy tests.

**Interfaces:**
- Consumes: immutable presentation snapshots/events.
- Produces: deterministic camera directives, event-prioritized HUD/audio cues and `Low | Balanced | High | Ultra` visual presets.

- [ ] Write camera policy tests for overview, final qualification battle, elimination, finish and champion reveal.
- [ ] Add shot-duration/hysteresis rules so camera switching is bounded.
- [ ] Ensure replay starts only after authoritative adjudication and never pauses/re-runs the authority.
- [ ] Cap simultaneous audio voices and map collision severity to bounded semantic cues.
- [ ] Add visual quality presets that affect only presentation cost.
- [ ] Add a same-seed cross-preset authority checksum regression.

### Task 8: Verification, release honesty and review evidence

**Files:**
- Modify: `games/marble-survival/TESTING_STRATEGY.md`
- Modify: `games/marble-survival/PRODUCTION_READINESS.md`
- Create: `docs/reviews/2026-09-07-game7-premium-upgrade-review.md`
- Modify/add Game 7 CI workflow only if it can execute against the actual checked-in/generated runtime.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: reproducible verification commands, known-limitations report and accurate R4/R5 boundary.

- [ ] Run focused physics/rules/presentation tests.
- [ ] Run TypeScript/build checks.
- [ ] Run deterministic multi-seed campaign/replay corpus.
- [ ] Run browser/static self-test if the environment supports it.
- [ ] Record anything not run as `NOT_RUN`; never infer passing evidence.
- [ ] Confirm the final branch contains no false `production-ready` claim without external R5 evidence.
