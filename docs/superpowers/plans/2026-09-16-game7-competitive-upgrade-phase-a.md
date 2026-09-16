# Game 7 Competitive Upgrade Phase A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Game 7 from a fast deterministic prototype into a credible miniature-motorsport tournament by fixing championship generation, establishing minute-scale round pacing, and adding measurable gameplay telemetry gates.

**Architecture:** Preserve `MarbleRuntime` as the sole deterministic authority. Gameplay changes are versioned and test-first. Arena generation remains constructive and validated; pacing changes alter authoritative movement parameters rather than slowing presentation or inserting fake waits. Telemetry is derived from completed authoritative runs and must never mutate game state.

**Tech Stack:** TypeScript, Node 22, deterministic fixed-step MarbleRuntime, Node test runner, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-07-marble-survival-premium-motorsport-upgrade-design.md`

## Global Constraints

- Exact tournament bracket remains `32 → 16 → 8 → 4 → 2 → 1`.
- Presentation quality presets cannot change authoritative outcomes.
- Winner-critical changes require a determinism version boundary and fresh snapshots.
- No fake presentation delays may be used to manufacture pacing.
- Generated arenas must validate without silently relying on fallback in normal seeds.
- R5 remains blocked until real soak/canary and independent production evidence exists.

---

### Task 1: Championship Generator Repair

**Files:**
- Modify: `games/marble-survival/src/generation/arena.ts`
- Modify: `tests/foundation/marble-config-generation.test.cjs`

**Interfaces:**
- Consumes: `generateMarbleArena(config, 4, rng)` and `validateMarbleArena`.
- Produces: a deterministic championship arena whose declared safe lanes remain physically clear and whose `fallbackUsed` is `false` across a bounded seed corpus.

- [ ] **Step 1: Write failing championship corpus test** requiring 64 championship seeds to validate with `fallbackUsed === false` and retain mirrored final-course identity.
- [ ] **Step 2: Run `npm run marble:upgrade:test` and confirm failure on the existing final generator.**
- [ ] **Step 3: Move championship structures away from mandatory safe-lane clearance and add bounded final-specific dynamic geometry without blocking both legal routes.**
- [ ] **Step 4: Run the focused suite and confirm all championship seeds validate.**
- [ ] **Step 5: Commit as `fix(game7): repair championship arena generation`.**

### Task 2: Versioned Tournament Pacing

**Files:**
- Modify: `games/marble-survival/src/config/schema.ts`
- Modify: `games/marble-survival/src/generation/roster.ts`
- Modify: `games/marble-survival/src/runtime/run.ts`
- Modify: `tests/foundation/marble-config-generation.test.cjs`
- Create: `games/marble-survival/tests/upgrade/game7-pacing-v3.test.cjs`

**Interfaces:**
- Consumes: Marble config, roster traits, fixed-step movement.
- Produces: `marble-physics-v3` defaults with authoritative round durations targeted at 35–110 seconds and tournament durations targeted at 6–14 minutes under representative seeds.

- [ ] **Step 1: Add RED tests asserting the new determinism version and measured duration floor/ceiling across a small representative seed set.**
- [ ] **Step 2: Confirm current defaults fail the duration floor.**
- [ ] **Step 3: Re-scale default velocity/acceleration and roster trait ranges together so personalities retain speed differences while movement occurs at human-readable race pace. Increase round timeout only as needed for the new physical scale.**
- [ ] **Step 4: Run deterministic twin-runtime, restore and tournament tests to ensure the new pacing remains replayable.**
- [ ] **Step 5: Commit as `feat(game7): introduce versioned broadcast race pacing`.**

### Task 3: Gameplay Telemetry Balancer

**Files:**
- Create: `games/marble-survival/scripts/profile-gameplay-campaign.cjs`
- Create: `games/marble-survival/tests/upgrade/game7-gameplay-telemetry.test.cjs`
- Modify: `.github/workflows/game7-premium-upgrade.yml`

**Interfaces:**
- Consumes: production `MarbleRuntime` only.
- Produces: JSON evidence containing tournament duration, round durations, fallback usage, qualification resolution mode, champion distribution, contact counts and influence usage.

- [ ] **Step 1: Add RED contract test for deterministic telemetry schema and zero authority mutation.**
- [ ] **Step 2: Implement bounded campaign profiler with named seeds and no ambient randomness.**
- [ ] **Step 3: Add CI gate rejecting championship fallback recurrence and obviously sub-target tournament pacing.**
- [ ] **Step 4: Run CI and retain the resulting telemetry artifact.**
- [ ] **Step 5: Commit as `test(game7): gate pacing and championship generation with campaign telemetry`.**

### Task 4: Specialist Review Skills

**Files:**
- Create: `skills/procedural-race-architect/SKILL.md`
- Create: `skills/competitive-ai-personality/SKILL.md`
- Create: `skills/miniature-world-art-director/SKILL.md`
- Create: `skills/broadcast-camera-director/SKILL.md`
- Create: `skills/gameplay-telemetry-balancer/SKILL.md`
- Modify: `skills/README.md`

**Interfaces:**
- Produces reusable review gates for race grammar, AI personality, world art, broadcast camera and telemetry balancing.

- [ ] **Step 1: Author trigger-only frontmatter and non-negotiable invariants using repository skill vocabulary.**
- [ ] **Step 2: Require measurable outputs rather than taste-only approval.**
- [ ] **Step 3: Add the five skills to the catalogue and invocation guidance.**
- [ ] **Step 4: Commit as `docs(skills): add competitive marble game review disciplines`.**

## Self-review

- Spec coverage: Phase A covers the two measured P1 blockers and installs repeatable review disciplines for the next AI/world/camera phases.
- Deferred intentionally: true Z-axis physics, full utility AI, themed world production, procedural audio and additional viewer influence families each require their own independent design/implementation plan after Phase A is measured.
- Placeholder scan: no implementation placeholder is accepted as a completion criterion.
- Type consistency: no new authority type is required for Task 1; Task 2 explicitly requires a determinism-version boundary before changed physical defaults can be considered compatible.
