# Eko Run Phase 2 Precision Movement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify Eko Run's deterministic mechanics-only platformer controller: acceleration/deceleration, jump buffering/coyote time/variable release, air control, slide, vault, steps/slopes, collision, landing compression, stumble/recovery, death/restart, and frame-schedule-independent replay.

**Architecture:** Keep the fixed 60 Hz TypeScript simulation authoritative. Extend the existing command/state contracts with bounded controller intent and movement timers; implement a kinematic swept-AABB controller against deterministic graybox route geometry; expose only immutable render state and semantic movement events. Presentation remains absent from the mechanics gate.

**Tech Stack:** Node.js >=22, TypeScript 5.8.3, Node test runner, existing Eko replay/checksum infrastructure, GitHub Actions for RED/GREEN evidence.

**Spec:** `docs/superpowers/plans/2026-09-14-eko-run-master-plan.md`, `games/eko-street-run/docs/EKO_EXPERIENCE_STANDARD.md`, `games/eko-street-run/AGENTS.md`.

## Global Constraints

- Authoritative simulation remains fixed at exactly 60 Hz; render schedules never change gameplay state.
- Existing Phase 1 replay, snapshot, checksum, command ordering, immutable render snapshot, and headless-route guarantees remain valid.
- Physics uses deterministic kinematic rules; no browser/Three.js/physics-engine callback may mutate authority.
- Player collision geometry is independent of future costume geometry and presentation quality.
- Every new timer is integer-tick based and bounded.
- Quantized authoritative positions/velocities remain finite and invariant checked.
- Movement must remain controllable with theme, character art, VFX, audio, camera shake, and HUD removed.
- TDD evidence is required: Phase 2 behavior tests are committed first and observed failing for missing mechanics before production implementation.
- A high experience score cannot override a stop-ship finding.

---

### Task 1: Phase 2 controller contracts and RED test corpus

**Files:**
- Create: `games/eko-street-run/phases/PHASE-02-PRECISION-MOVEMENT.md`
- Create: `tests/phase2/eko-run-movement.test.cjs`
- Create: `tests/phase2/eko-run-collision.test.cjs`
- Create: `tests/phase2/eko-run-recovery.test.cjs`
- Create: `tests/phase2/eko-run-render-schedule.test.cjs`
- Modify later after RED proof: `games/eko-street-run/src/state/types.ts`
- Modify later after RED proof: `games/eko-street-run/src/config/default-config.ts`
- Modify later after RED proof: `games/eko-street-run/src/runtime/commands.ts`

**Interfaces:**
- Controller command remains `type: "move"` for Phase 1 compatibility and extends payload to `{ axis, jumpPressed?, jumpReleased?, slide?, vault? }`.
- Restart is a separate `type: "restart"` command with an empty payload.
- Movement states become `grounded | rising | falling | sliding | vaulting | stumbling | dead`.
- Graybox route geometry exposes stable collider IDs and deterministic rectangles/slope segments.

- [ ] **Step 1: Write failing movement tests**

```js
const input = (state, tick, sequence, payload) => ({
  schemaVersion: 1,
  runId: state.runId,
  targetTick: tick,
  priority: 10,
  sourceId: 'player',
  sourceSequence: sequence,
  type: 'move',
  payload: { axis: 0, ...payload },
});

test('jump buffer triggers on the first legal landing tick', () => {
  // Put the player just above ground while falling, press jump before contact,
  // step until landing, then assert the buffered jump immediately transitions
  // to rising with positive vertical velocity.
});

test('coyote jump remains legal for the configured grace ticks and then expires', () => {
  // Walk off an edge, jump inside grace -> rising; repeat outside grace -> falling.
});

test('releasing jump early produces a lower apex than holding jump', () => {
  // Compare identical seeds/inputs except jump release timing.
});
```

- [ ] **Step 2: Write failing collision/recovery/render-schedule tests**

```js
test('fast horizontal motion cannot tunnel through a tall solid', () => {});
test('ceiling contact cancels upward velocity without penetration', () => {});
test('step height at or below the configured maximum is climbed while a taller step blocks', () => {});
test('slope traversal preserves grounded contact without vertical jitter', () => {});
test('slide uses the lower collider and returns to standing only with clearance', () => {});
test('vault crosses only an eligible low obstacle and cannot vault a tall wall', () => {});
test('large fall causes bounded stumble then deterministic recovery', () => {});
test('falling through the kill plane fails the run and restart restores the checkpoint', () => {});
test('30/60/120 render sampling schedules produce the same authoritative checksums', () => {});
```

- [ ] **Step 3: Commit tests only and verify RED in GitHub Actions**

Run through CI: `npm run build && node --test tests/phase2/eko-run-*.test.cjs`

Expected: FAIL because Phase 2 controller contracts/functions/states do not exist yet. The failure must be caused by missing Phase 2 behavior, not syntax or fixture errors.

---

### Task 2: Deterministic run/jump controller

**Files:**
- Modify: `games/eko-street-run/src/config/default-config.ts`
- Modify: `games/eko-street-run/src/state/types.ts`
- Modify: `games/eko-street-run/src/state/create-state.ts`
- Modify: `games/eko-street-run/src/runtime/commands.ts`
- Replace/extend: `games/eko-street-run/src/physics/kinematic.ts`
- Modify: `games/eko-street-run/src/runtime/simulation.ts`
- Modify: `games/eko-street-run/src/presentation/snapshot.ts`
- Modify: `games/eko-street-run/src/index.ts`

**Interfaces:**
- `PlayerControlIntent`: normalized axis plus edge-triggered jump/release/slide/vault booleans.
- `MovementTuning`: movement constants in config with integer tick windows.
- `stepPlayerKinematic(player, route, intent, config, tick)` returns `{ player, contacts }` without side effects.

- [ ] **Step 1: Add controller tuning and bounded state fields**

Use explicit fields including `groundAcceleration`, `groundDeceleration`, `airAcceleration`, `gravity`, `jumpSpeed`, `maxFallSpeed`, `coyoteTicks`, `jumpBufferTicks`, `jumpReleaseVelocityFactor`, `landingCompressionTicks`, player standing/slide dimensions, `maxStepHeight`, and `killPlaneY`.

- [ ] **Step 2: Implement horizontal acceleration/deceleration and air control**

```ts
const targetSpeed = intent.axis * config.maxSpeed;
const accel = player.grounded
  ? (intent.axis === 0 ? config.groundDeceleration : config.groundAcceleration)
  : config.airAcceleration;
velocityX = approach(player.velocity.x, targetSpeed, accel * FIXED_DT_SECONDS);
```

- [ ] **Step 3: Implement coyote time, jump buffering, and variable jump release**

Store grace/buffer counters as integer ticks. Jump consumes exactly one buffered request when grounded or within coyote grace. Early release while rising multiplies positive `velocityY` by the configured factor once.

- [ ] **Step 4: Run focused movement tests and Phase 1 regressions**

Run: `npm run build && node --test tests/phase2/eko-run-movement.test.cjs tests/foundation/eko-run-*.test.cjs`

Expected: PASS, with Phase 1 command forms `{ type: 'move', payload: { axis } }` still legal.

---

### Task 3: Swept collision, steps, slopes, slide and vault

**Files:**
- Modify: `games/eko-street-run/src/state/types.ts`
- Modify: `games/eko-street-run/src/rules/route.ts`
- Modify: `games/eko-street-run/src/physics/kinematic.ts`
- Create: `games/eko-street-run/src/physics/geometry.ts`
- Test: `tests/phase2/eko-run-collision.test.cjs`

**Interfaces:**
- `RouteColliderRect { id, minX, maxX, minY, maxY, kind }`.
- `RouteSlope { id, minX, maxX, startY, endY }`.
- `resolveHorizontalSweep(...)` prevents tunnelling through outcome-critical solids.
- `sampleSupportSurface(...)` returns deterministic floor candidate and normal/height.
- Vault is a bounded controller state targeting one eligible obstacle ID; it is never automatic.

- [ ] **Step 1: Add deterministic graybox geometry**

Foundation route stays flat-compatible. A Phase 2 graybox route includes an edge gap, low step, tall wall, ceiling, slope, eligible low vault block, and moving test obstacle with stable IDs.

- [ ] **Step 2: Implement swept horizontal/vertical collision**

Sort contact candidates by time-of-impact then collider ID. Clamp to skin distance, zero blocked velocity, and never iterate an unbounded solver loop.

- [ ] **Step 3: Implement step/slope support**

A support rise `<= maxStepHeight` may snap upward while grounded and moving; larger rises block. Slope support derives a deterministic Y from X and preserves ground contact without oscillating state.

- [ ] **Step 4: Implement slide and vault**

Slide lowers collision height for a bounded tick duration and cannot stand into a ceiling. Vault requires explicit `vault: true`, grounded state, forward intent, and an obstacle at or below `maxVaultHeight`; its deterministic arc has a fixed start/target/tick count and rejects tall/blocked targets.

- [ ] **Step 5: Run collision corpus**

Run: `npm run build && node --test tests/phase2/eko-run-collision.test.cjs`

Expected: PASS for ceiling, fast wall, steps, slope, slide clearance, vault eligibility, and moving obstacle contact.

---

### Task 4: Landing, stumble, failure and restart

**Files:**
- Modify: `games/eko-street-run/src/state/types.ts`
- Modify: `games/eko-street-run/src/physics/kinematic.ts`
- Modify: `games/eko-street-run/src/runtime/simulation.ts`
- Modify: `games/eko-street-run/src/state/create-state.ts`
- Test: `tests/phase2/eko-run-recovery.test.cjs`

**Interfaces:**
- `landingCompressionTicksRemaining` is a bounded feedback state that does not delay legal control.
- A landing above `stumbleFallSpeed` enters bounded `stumbling`; recovery returns control automatically.
- Crossing `killPlaneY` sets lifecycle `failed`, player state `dead`, and emits a typed semantic failure event.
- `restart` is legal only from `failed`; it restores the latest checkpoint spawn with zero velocity/timers and retains run identity/version/record history.

- [ ] **Step 1: Implement landing severity and recovery**

Landing compression is presentation-relevant state only; ordinary landings remain immediately controllable. Large falls enter a short deterministic stumble whose duration is capped.

- [ ] **Step 2: Implement death/restart transition**

Technical/integrity failure remains separate from gameplay failure. Restart cannot bypass command ordering/idempotency.

- [ ] **Step 3: Run recovery and replay tests**

Run: `npm run build && node --test tests/phase2/eko-run-recovery.test.cjs tests/foundation/eko-run-replay.test.cjs tests/foundation/eko-run-determinism.test.cjs`

Expected: PASS with deterministic checksums through fail/restart sequences.

---

### Task 5: Frame-schedule independence, performance and evidence

**Files:**
- Modify: `package.json`
- Create: `scripts/run-eko-run-phase2-evidence.cjs`
- Create: `evidence/eko-run/phase2/PHASE-02-RESULTS.md`
- Test: `tests/phase2/eko-run-render-schedule.test.cjs`
- Test: all `tests/phase2/eko-run-*.test.cjs`

**Interfaces:**
- `npm run test:eko:phase2` builds and runs Phase 1 + Phase 2 Eko tests.
- Evidence runner records exact seed, tick count, checkpoints, final checksum, p50/p95/p99/worst tick time, movement invariants, and render-schedule equivalence.

- [ ] **Step 1: Prove 30/60/120 presentation schedules cannot change authority**

Run the same normalized input stream for the same authoritative tick count while sampling render snapshots at 30, 60 and 120 Hz. Assert identical checkpoint/final checksums and terminal state.

- [ ] **Step 2: Add performance evidence**

Budget for Phase 2 mechanics-only runner: p99 authoritative tick `< 4 ms`, worst tick `< 16.67 ms` on GitHub CI reference environment, zero non-finite state, zero penetration beyond declared skin tolerance, bounded timers/contacts.

- [ ] **Step 3: Run full catalogue regression**

Run: `npm test`

Expected: zero failures across the catalogue plus the new Eko Phase 2 suite.

---

### Task 6: Three-pass 22-skill review and improvement loop

**Files:**
- Create: `evidence/eko-run/phase2/PHASE-02-REVIEW-1.md`
- Create: `evidence/eko-run/phase2/PHASE-02-REVIEW-2.md`
- Create: `evidence/eko-run/phase2/PHASE-02-REVIEW-3.md`
- Modify as findings require: Phase 2 production/test files
- Modify: `games/eko-street-run/phases/PHASE-02-PRECISION-MOVEMENT.md`
- Modify: `games/eko-street-run/REQUIREMENT_TRACEABILITY.md`

**Review panel:** all 22 Eko Run skills are applied. Phase 2 load-bearing reviewers are `game-physics`, `platformer-experience-review`, `deterministic-simulation`, `game-feel-vfx`, `difficulty-failure-balancing`, `performance-optimization`, and `simulation-qa`; the remaining skills challenge future compatibility, stream comprehension, safety, reliability, economy/audience isolation, analytics, and readiness claims.

- [ ] **Pass 1 — specification and stop-ship review**

Use required finding contract: `Moment → Expected → Observed → Why → Severity → Exact improvement → Verification test`. Fix every P0/P1 and every platformer stop-ship finding. Add regression tests for each material defect.

- [ ] **Pass 2 — adversarial critique**

Try to break edge jumps, jump-buffer timing, ceiling/step/slope transitions, slide clearance, vault eligibility, moving contacts, restart, conflicting commands, deterministic replay, and tick budgets. Fix material findings and rerun the full Eko suite.

- [ ] **Pass 3 — polish-without-cheating review**

Re-score mechanics-only movement, control predictability, recovery, spectator legibility of state, accessibility implications, performance consistency, and future Phase 3 animation hooks. No VFX/camera/art may be used to hide a controller defect. Fix remaining load-bearing findings and rerun full catalogue CI.

- [ ] **Phase gate**

Phase 2 may be marked `VERIFIED — mechanics-only precision movement scope` only when all three review passes have no unresolved stop-ship/P1 finding, deterministic evidence is fresh on the exact candidate SHA, and full catalogue CI passes. Phase 3 begins from the merged `main` commit, not from an unmerged Phase 2 side branch.
