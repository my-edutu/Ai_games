# Marble Survival Physics V2 + Factory Gauntlet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current flat deterministic Marble tournament into a genuinely physical 2.5D survival spectacle by first restoring green evidence, then adding deterministic elevation/ramp physics and an authoritative Industrial Factory gauntlet without weakening replay integrity.

**Architecture:** Preserve server-authoritative fixed-step simulation and presentation-only WebGL. Extend the authority with integer elevation/vertical velocity and explicit ramp/surface primitives rather than replacing it with nondeterministic browser rigid bodies. Every gameplay-affecting primitive must exist in state schema, generation, physics, public snapshot, renderer and tests together.

**Tech Stack:** TypeScript fixed-step authority, seeded RNG, Node test runner, WebGL2 browser renderer, Playwright CI evidence.

**Spec:** `games/marble-survival/22-SKILL-REVIEW.md`, `games/marble-survival/VISUAL_REBUILD_AUDIT.md`, `games/marble-survival/PHYSICS_SYSTEM.md`, and the approved Marble rebuild brief.

## Global Constraints

- Modify Marble Survival and Marble-specific tests/docs only; do not modify `games/eko-street-run/**` or other active game directories.
- Preserve deterministic server authority; browser presentation cannot adjudicate physics, qualification, elimination or winners.
- Do not claim unsupported mechanics as complete.
- Behaviour changes are TDD-first and must preserve replay/restore checksums for the declared determinism version.
- Visual acceptance remains runtime-evidence based: HUD-hidden gameplay must still communicate marbles, track, physical depth, danger and competition.

---

### Task 1: Restore a trustworthy visual-evidence baseline

**Files:**
- Modify: `tests/browser/marble-survival-stream.spec.cjs`

**Interfaces:**
- Consumes: existing `/api/operator` pause/restart/resume commands and `/api/snapshot`.
- Produces: independent deterministic benchmark and visual-evidence tournaments in one browser test.

- [ ] **Step 1: Use the current failing CI as RED evidence** — run 61 fails because `archetypes.size` is 1 after the benchmark consumes/finalizes the tournament.
- [ ] **Step 2: Reset authority after performance measurement** — pause, restart, verify round 0/tick 0/active, then resume before screenshot loop.
- [ ] **Step 3: Re-run Game 7 CI** and require browser capture to pass with >=3 archetypes plus winner and clean-feed evidence.
- [ ] **Step 4: Commit** `fix(marble): isolate benchmark from visual tournament evidence`.

### Task 2: Add deterministic vertical-state contract

**Files:**
- Modify: `games/marble-survival/src/state/types.ts`
- Modify: `games/marble-survival/src/generation/roster.ts`
- Modify: `tests/foundation/marble-physics.test.cjs`

**Interfaces:**
- Produces on `MarbleCompetitor`: `elevation`, `verticalVelocity`, `grounded`.
- Produces on `MarbleConfig`: `gravityPerTick`, `maxVerticalSpeed`.

- [ ] **Step 1: Write failing tests** asserting fresh marbles start grounded at elevation 0 and vertical state is integer/deterministic.
- [ ] **Step 2: Run Marble foundation tests and confirm RED** because the fields do not exist.
- [ ] **Step 3: Add only the schema/default fields** with zero elevation/velocity and grounded true; do not add ramp behaviour yet.
- [ ] **Step 4: Run tests and build GREEN**.
- [ ] **Step 5: Commit** `feat(marble): add deterministic vertical state contract`.

### Task 3: Add authoritative ramp surfaces and gravity

**Files:**
- Modify: `games/marble-survival/src/state/types.ts`
- Modify: `games/marble-survival/src/physics/solver.ts`
- Modify: `games/marble-survival/src/generation/arena.ts`
- Modify: `tests/foundation/marble-physics.test.cjs`
- Modify: `tests/foundation/marble-config-generation.test.cjs`

**Interfaces:**
- Adds `ArenaRamp` with integer rectangle footprint, `axis`, `startElevation`, `endElevation`.
- Adds `MarbleArena.ramps`.
- Physics derives deterministic surface elevation from marble XY position and applies gravity only while airborne.

- [ ] **Step 1: Write failing ramp test**: a marble traversing a generated gate-gauntlet ramp gains positive elevation deterministically and returns to the deck after leaving it.
- [ ] **Step 2: Write failing replay-equivalence test** for two identical ramp states.
- [ ] **Step 3: Confirm RED in CI**.
- [ ] **Step 4: Implement ramp surface-height lookup and bounded integer gravity/landing** in the fixed-step solver.
- [ ] **Step 5: Add at least one valid deterministic ramp to round 2 generation while preserving declared safe lanes and collider/contact budgets.
- [ ] **Step 6: Run build + Marble foundation suite GREEN**.
- [ ] **Step 7: Commit** `feat(marble): add deterministic ramp and gravity physics`.

### Task 4: Build the first Industrial Factory gauntlet

**Files:**
- Modify: `games/marble-survival/src/state/types.ts`
- Modify: `games/marble-survival/src/generation/arena.ts`
- Modify: `games/marble-survival/public/complete-runtime/renderer3d.js`
- Modify: `games/marble-survival/public/complete-runtime/audio-director.js`
- Modify: `tests/foundation/marble-3d-presentation.test.cjs`
- Modify: `tests/foundation/marble-config-generation.test.cjs`

**Interfaces:**
- Gate Gauntlet becomes the first complete factory set-piece using authority-backed ramp + sweeper machinery and clear mechanical telegraphs.
- Renderer consumes ramp/elevation fields only; it never infers gameplay height.

- [ ] **Step 1: Write failing presentation contract tests** requiring authoritative ramp geometry, factory structural machinery, and marble elevation mapping.
- [ ] **Step 2: Confirm RED**.
- [ ] **Step 3: Render ramps as real inclined geometry and place marbles at authoritative elevation**.
- [ ] **Step 4: Upgrade the existing sweeper into a visually structured factory machine (hub/shaft/support/guarding) without changing its collision footprint**.
- [ ] **Step 5: Add bounded rolling/machinery/ramp audio cues driven by public state/events only**.
- [ ] **Step 6: Run foundation tests + browser evidence GREEN**.
- [ ] **Step 7: Commit** `feat(marble): build authoritative factory gauntlet set-piece`.

### Task 5: Evidence, critique and documentation pass

**Files:**
- Modify: `games/marble-survival/22-SKILL-REVIEW.md`
- Modify: `games/marble-survival/PHYSICS_SYSTEM.md`
- Modify: `games/marble-survival/ARENA_SYSTEM.md`
- Modify: `games/marble-survival/VISUAL_ACCEPTANCE_REPORT.md`
- Modify: `games/marble-survival/PERFORMANCE_REPORT.md`
- Modify: `tests/browser/marble-survival-stream.spec.cjs`

**Interfaces:**
- Browser evidence adds a real high-speed-ramp capture and continues pack/machinery/hazard/final/winner/HUD-hidden captures.

- [ ] **Step 1: Require `04-high-speed-ramp.png` from an actual gate-gauntlet ramp state rather than a cosmetic camera shot**.
- [ ] **Step 2: Run exact-head CI and inspect all uploaded screenshots plus performance JSON**.
- [ ] **Step 3: Critique pass against the 22 skills: physics feel, scale, arena construction, materials, collisions, camera, sound/VFX, repetition, HUD, performance**.
- [ ] **Step 4: Apply only evidence-driven polish and re-run CI**.
- [ ] **Step 5: Update docs truthfully: vertical ramp slice complete; pendulums/conveyors/water/ice/destruction remain incomplete unless separately implemented and evidenced**.
- [ ] **Step 6: Keep PR draft and NOT R5 until required soak/canary/independent-readiness evidence exists**.
