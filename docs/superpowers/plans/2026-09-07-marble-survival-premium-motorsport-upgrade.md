# Marble Survival Tournament Premium Motorsport Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Game 7 so the live browser/OBS output is driven by the real deterministic MarbleRuntime and presents a physically believable premium miniature-motorsport tournament without changing tournament truth by visual quality.

**Architecture:** Keep the existing fixed-point TypeScript authority and Canvas 2D renderer. The Node broadcast host loads the compiled Game 7 authority from `dist/`, advances exact fixed ticks with bounded catch-up, publishes an allowlisted public snapshot, and forwards semantic events to presentation. Winner-critical changes are versioned as `marble-physics-v2`; presentation, replay, camera, audio and quality settings never mutate authority.

**Tech Stack:** TypeScript 5.8/CommonJS, Node.js 22+, Node test runner, Canvas 2D/Web Audio browser surface, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-07-marble-survival-premium-motorsport-upgrade-design.md`

## Global Constraints

- Preserve standard tournament quotas exactly: `32 → 16 → 8 → 4 → 2 → 1`.
- `MarbleRuntime` is the sole owner of live gameplay state.
- Authority remains fixed-step; render FPS and quality presets cannot alter checksums or winner.
- Use a new deterministic version for winner-critical physics/rules changes; do not silently restore v1 snapshots into v2.
- Do not introduce Three.js/WebGL or new provider/payment dependencies in this upgrade.
- Use Canvas 2D first and make Low/Balanced/High/Ultra presentation-only.
- Same-tick finish/elimination ordering must be explicit and deterministic.
- Visible moving geometry must match authoritative collision transforms.
- Replay must use presentation snapshots/events and cannot pause or mutate live authority.
- R5 production-ready remains false without genuine external evidence.

---

## File Structure

### Authoritative game
- `games/marble-survival/src/state/types.ts` — v2 state/contact/public transform types.
- `games/marble-survival/src/runtime/run.ts` — sole lifecycle/tick owner and bounded marble policy entrypoint.
- `games/marble-survival/src/physics/solver.ts` — fixed-step collision and moving-obstacle relative-velocity response.
- `games/marble-survival/src/rules/tournament.ts` — crossing cohorts, qualification/elimination adjudication and valid champion resolution.
- `games/marble-survival/src/persistence/snapshot.ts` — v2 snapshot version checks and typed v1 incompatibility.

### Presentation contracts
- `games/marble-survival/src/presentation/snapshot.ts` — allowlisted public snapshot derived from authoritative state.
- `games/marble-survival/src/presentation/camera.ts` — pure semantic-event/render-state camera directive.
- `games/marble-survival/src/presentation/replay.ts` — bounded presentation-only replay buffer.
- `games/marble-survival/src/index.ts` — exports new public presentation helpers.

### Broadcast host and UI
- `games/marble-survival/scripts/serve-complete-runtime.cjs` — loads compiled `MarbleRuntime`, fixed-rate scheduler, public snapshot/events/health endpoints, static host.
- `games/marble-survival/public/complete-runtime/index.html` — spectator-first hierarchy and operator-free public fields.
- `games/marble-survival/public/complete-runtime/app.js` — Canvas 2D premium renderer, real moving transforms, camera/replay/audio cues.
- `games/marble-survival/public/complete-runtime/styles.css` — structural responsive layout.
- `games/marble-survival/public/complete-runtime/ux-v2.css` — replaced by the premium motorsport visual layer.

### Tests and automation
- `games/marble-survival/tests/upgrade/game7-authority-host.test.cjs`
- `games/marble-survival/tests/upgrade/game7-tournament-v2.test.cjs`
- `games/marble-survival/tests/upgrade/game7-physics-v2.test.cjs`
- `games/marble-survival/tests/upgrade/game7-presentation.test.cjs`
- `.github/workflows/game7-premium-upgrade.yml`
- `package.json`

---

### Task 1: Establish a self-contained Game 7 upgrade CI baseline

**Files:**
- Create: `.github/workflows/game7-premium-upgrade.yml`
- Modify: `package.json`

**Interfaces:**
- Produces npm scripts `marble:upgrade:test`, `marble:stream`, and `marble:stream:self-test` used by all later tasks.

- [ ] **Step 1: Add an upgrade workflow that runs only on the isolated branch**

```yaml
name: Game 7 Premium Motorsport Upgrade
on:
  push:
    branches: [feat/game7-premium-motorsport-upgrade]
  pull_request:
    paths:
      - 'games/marble-survival/**'
      - 'tests/foundation/marble-*.test.cjs'
      - '.github/workflows/game7-premium-upgrade.yml'
permissions:
  contents: read
jobs:
  game7-upgrade:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: node --test tests/foundation/marble-*.test.cjs
```

- [ ] **Step 2: Add exact npm entrypoints**

```json
"marble:upgrade:test": "npm run build && node --test tests/foundation/marble-*.test.cjs games/marble-survival/tests/upgrade/*.test.cjs",
"marble:stream": "npm run build && node games/marble-survival/scripts/serve-complete-runtime.cjs",
"marble:stream:self-test": "npm run build && node games/marble-survival/scripts/serve-complete-runtime.cjs --self-test"
```

- [ ] **Step 3: Push and verify baseline workflow**

Expected: repository build and foundation marble tests execute on Node 22. Record exact failures rather than assuming the old PR evidence is valid.

- [ ] **Step 4: Commit**

```bash
git commit -am "ci(game7): establish premium upgrade verification"
```

---

### Task 2: Make the browser host run the real MarbleRuntime

**Files:**
- Create: `games/marble-survival/src/presentation/snapshot.ts`
- Create: `games/marble-survival/tests/upgrade/game7-authority-host.test.cjs`
- Modify: `games/marble-survival/src/index.ts`
- Modify: `games/marble-survival/scripts/serve-complete-runtime.cjs`
- Modify: `.github/workflows/game7-premium-upgrade.yml`

**Interfaces:**
- Produces `createMarblePublicSnapshot(state, events?)`.
- Host runtime exposes `authority: MarbleRuntime`, `advanceDue(nowMs)`, `currentSnapshot()`, `events`, and `health()`.
- `/api/snapshot` returns only the allowlisted snapshot; no root seed, tournament seed, RNG, operator token or raw config.

- [ ] **Step 1: Write failing authority-host tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { createRuntime } = require('../../scripts/serve-complete-runtime.cjs');

test('broadcast host advances MarbleRuntime and never a parallel campaign clock', () => {
  const host = createRuntime({ seed: 'authority-host', nowMs: 0 });
  assert.equal(host.authority.state.tick, 0);
  host.advanceDue(1000 / 60);
  assert.equal(host.authority.state.tick, 1);
  assert.equal('campaign' in host, false);
});

test('different render polling schedules cannot change authority', () => {
  const a = createRuntime({ seed: 'render-independent', nowMs: 0 });
  const b = createRuntime({ seed: 'render-independent', nowMs: 0 });
  for (let frame = 1; frame <= 600; frame++) a.advanceDue(frame * (1000 / 60));
  for (let frame = 1; frame <= 300; frame++) b.advanceDue(frame * (1000 / 30));
  assert.equal(a.authority.state.tick, b.authority.state.tick);
  assert.equal(a.checksum(), b.checksum());
});
```

Also assert that serialized public snapshot excludes `rootSeed`, `tournamentSeed`, `rng`, and `config`.

- [ ] **Step 2: Run CI and confirm RED**

Run: `npm run marble:upgrade:test`
Expected: FAIL because `createRuntime` does not expose `authority/advanceDue` and the public snapshot helper does not exist.

- [ ] **Step 3: Implement `createMarblePublicSnapshot`**

Return a frozen JSON-safe object containing:

```ts
{
  schemaVersion: 2,
  run: { id, index, lifecycle },
  round: { id, name, index, total: 5, quota, remaining },
  tick,
  tournamentTick,
  arena: {
    id, archetype, width, height, finishY,
    obstacles, bumpers, hazards, windZones,
    sweepers: [{ id, x, y, width, height, axis, velocityX, velocityY }]
  },
  marbles: [{ id, displayName, number, palette, pattern, icon, archetype, x, y, vx, vy, status, progressPermille, intent, confidence, qualified }],
  leaderboard,
  champion,
  recordCategory
}
```

Moving sweeper transforms are derived from the same deterministic transform helper used by physics in Task 4; until that helper exists, use the existing triangle-wave transform with zero exported velocity and keep the test scoped to authority ownership.

- [ ] **Step 4: Replace the synthetic server state**

`createRuntime()` must instantiate `MarbleRuntime.create(...)`. Scheduler state stores `lastSchedulerMs`, `accumulatorMs`, `maxCatchUpTicks = 8`; `advanceDue(nowMs)` computes due fixed ticks and invokes `authority.step()` one tick at a time. Never change the authority delta.

Remove `runCampaign`, synthetic `near-miss`, `tick >= 180` round advancement, and presentation-owned champion progression.

- [ ] **Step 5: Keep HTTP endpoints presentation-only**

- `/api/snapshot` -> `createMarblePublicSnapshot(authority.state)`
- `/api/events` -> bounded drained/forwarded semantic events
- `/api/health` -> scheduler debt + authority lifecycle
- `/api/operator` -> pause/resume/restart request at the host boundary; restart calls `authority.restart()`

Viewer influence remains temporarily disabled/degraded until Task 5 if the old separate queue cannot safely schedule authority commands.

- [ ] **Step 6: Run GREEN checks**

Run: `npm run marble:upgrade:test && npm run marble:stream:self-test`
Expected: PASS; same seed/checksum after equivalent logical time at 30/60 render polling.

- [ ] **Step 7: Commit**

```bash
git commit -am "fix(game7): unify broadcast with authoritative runtime"
```

---

### Task 3: Version and fix finish/elimination adjudication

**Files:**
- Modify: `games/marble-survival/src/state/types.ts`
- Modify: `games/marble-survival/src/runtime/run.ts`
- Modify: `games/marble-survival/src/rules/tournament.ts`
- Modify: `games/marble-survival/src/persistence/snapshot.ts`
- Create: `games/marble-survival/tests/upgrade/game7-tournament-v2.test.cjs`

**Interfaces:**
- State `determinismVersion` becomes `'marble-physics-v2'`.
- `MarbleRoundResult.resolution` adds `'integrity'` only if a round cannot produce a valid qualifier set.
- Finishing cohort sorting uses exported pure helper `compareFinishCrossings(a,b)` where crossing data is `{ marbleId, numerator, denominator }` and stable ID is the final exact-tie rule.

- [ ] **Step 1: Write failing same-tick crossing tests**

Construct two marbles whose previous/current Y positions cross `finishY` during the same tick at different fractions. Assert the earlier fraction gets rank 1 even if it has the larger marble ID. Add an exact-fraction tie asserting smaller stable ID wins.

- [ ] **Step 2: Write failing all-fall and invalid-final tests**

Create an active round where all remaining marbles enter a hazard in one tick. Assert lifecycle does not remain indefinitely active with zero potential qualifiers. In the championship assert no `champion` result can reference an eliminated/nonexistent marble.

- [ ] **Step 3: Run RED tests**

Run: `npm run marble:upgrade:test`
Expected: finish ranking and all-fall tests fail under v1 logic.

- [ ] **Step 4: Track previous transforms during rule adjudication**

Before physics integration, preserve previous position per active marble for the completed tick. This may be a local map in `MarbleRuntime.step()`/physics result rather than persisted state if snapshot compatibility is cleaner.

- [ ] **Step 5: Collect finish and elimination cohorts before mutating bracket arrays**

In `applyTournamentRules`, first collect candidate crossing/hazard events for all active marbles. Sort finish crossings by fixed rational comparison:

```ts
const leftScaled = left.numerator * right.denominator;
const rightScaled = right.numerator * left.denominator;
return leftScaled - rightScaled || left.marbleId - right.marbleId;
```

Use safe integers and declared bounds.

- [ ] **Step 6: Resolve all-fall and quota edge cases explicitly**

After applying confirmed qualifications/eliminations:
- if quota reached -> resolve quota;
- if qualified + active can exactly/insufficiently fill quota -> deterministically rank the same-tick boundary cohort using pre-elimination progress and stable ID;
- if zero valid competitors remain in championship and no valid qualifier exists -> produce a technical/integrity result and quarantine/fresh-run boundary, not a fabricated champion.

- [ ] **Step 7: Change snapshot/state deterministic version to v2**

`createMarbleSnapshot` writes `marble-physics-v2`. `restoreMarbleSnapshot` rejects v1 with `MarbleSnapshotError('version', ...)`; do not migrate silently.

- [ ] **Step 8: Run GREEN + legacy regression checks**

Run: `npm run marble:upgrade:test`
Expected: v2 edge tests and existing foundation tests pass.

- [ ] **Step 9: Commit**

```bash
git commit -am "fix(game7): make tournament adjudication deterministic"
```

---

### Task 4: Make moving-obstacle and recovery physics physically causal

**Files:**
- Create: `games/marble-survival/src/physics/moving-collider.ts`
- Modify: `games/marble-survival/src/physics/solver.ts`
- Modify: `games/marble-survival/src/rules/tournament.ts`
- Modify: `games/marble-survival/src/presentation/snapshot.ts`
- Modify: `games/marble-survival/src/index.ts`
- Create: `games/marble-survival/tests/upgrade/game7-physics-v2.test.cjs`

**Interfaces:**
- Export `sweeperTransform(sweeper, tick, substepNumerator = 0, substepDenominator = 1)` returning `{ x, y, width, height, velocityX, velocityY }`.
- Physics uses the same function as the public snapshot.

- [ ] **Step 1: Write failing transform agreement test**

Assert `createMarblePublicSnapshot(state).arena.sweepers[0]` matches `sweeperTransform(state.arena.sweepers[0], state.tick)` exactly.

- [ ] **Step 2: Write failing moving-wall impulse test**

Place a stationary marble in the path of a sweeper that is moving toward it. After one physics step assert the marble receives velocity in the sweeper movement direction and the speed remains under configured bounds.

- [ ] **Step 3: Write failing shield recovery test**

Give a marble one shield and place it at a hazard boundary. Assert one charge is consumed, exactly one `shield-recovery` event emits, the marble remains within physical bounds, and recovery cannot move it across the finish/checkpoint merely through positional correction.

- [ ] **Step 4: Run RED tests**

Run: `npm run marble:upgrade:test`
Expected: moving transform/impulse and shield behavior fail.

- [ ] **Step 5: Implement deterministic moving-collider transform/velocity**

Use triangle-wave position at tick/substep and the difference between deterministic adjacent sample positions to derive integer velocity. Physics resolves relative normal velocity as `marble.velocity - collider.velocity` and adds the collider velocity back after restitution response.

- [ ] **Step 6: Evaluate moving transforms per substep**

Do not calculate one sweeper rectangle for the whole tick when using multiple substeps. Recompute the transform for each bounded substep.

- [ ] **Step 7: Replace shield teleport with bounded recovery impulse**

Consume the shield, cancel only the hazard elimination, clamp the marble back to the nearest safe side by at most a small penetration tolerance, then apply a bounded impulse away from the hazard. Do not advance Y toward the finish as a generic recovery operation.

- [ ] **Step 8: Run GREEN and dense-contact regression**

Run: `npm run marble:upgrade:test`
Expected: moving collider, recovery, thin-obstacle, pair-order, speed/contact cap tests pass.

- [ ] **Step 9: Commit**

```bash
git commit -am "fix(game7): add causal moving obstacle physics"
```

---

### Task 5: Build the premium motorsport public snapshot, camera and replay contracts

**Files:**
- Create: `games/marble-survival/src/presentation/camera.ts`
- Create: `games/marble-survival/src/presentation/replay.ts`
- Modify: `games/marble-survival/src/presentation/snapshot.ts`
- Modify: `games/marble-survival/src/index.ts`
- Create: `games/marble-survival/tests/upgrade/game7-presentation.test.cjs`

**Interfaces:**
- `selectMarbleCamera(snapshot, recentEvents, previousDirective?)` -> `{ mode, targetIds, focusX, focusY, zoomPermille, minHoldTicks }`.
- `MarbleReplayBuffer(capacity)` -> `push(snapshot, events)`, `frames()`, `clear()`; stores cloned public data only.

- [ ] **Step 1: Write failing privacy/camera/replay tests**

Assert:
- public snapshot contains moving transforms but no seeds/RNG/config/operator data;
- decisive finish event selects `finish` over contact noise;
- championship result selects `victory`;
- replay buffer mutation cannot change authoritative state;
- replay capacity is bounded.

- [ ] **Step 2: Run RED tests**

Run: `npm run marble:upgrade:test`
Expected: camera/replay helpers missing.

- [ ] **Step 3: Implement pure camera selection**

Priority: victory/result > finish/final qualification > danger/elimination > meaningful pack > overview. Use deterministic event/state inputs, stable target ordering, and minimum hold ticks; camera output is presentation-only.

- [ ] **Step 4: Implement bounded replay buffer**

Clone/freeze public snapshots/events at insertion; evict oldest above capacity. Never store `MarbleRuntime` or `MarbleState` references.

- [ ] **Step 5: Add material/identity presentation keys**

Derive a stable presentation-only material key from existing archetype/identity data without using new authoritative randomness. Keep radius and gameplay traits unchanged.

- [ ] **Step 6: Run GREEN tests**

Run: `npm run marble:upgrade:test`
Expected: privacy, camera, replay bounds and authority isolation pass.

- [ ] **Step 7: Commit**

```bash
git commit -am "feat(game7): add spectator presentation contracts"
```

---

### Task 6: Replace neon dashboard visuals with Precision Miniature Motorsport

**Files:**
- Modify: `games/marble-survival/public/complete-runtime/index.html`
- Modify: `games/marble-survival/public/complete-runtime/app.js`
- Modify: `games/marble-survival/public/complete-runtime/styles.css`
- Modify: `games/marble-survival/public/complete-runtime/ux-v2.css`
- Modify: `games/marble-survival/scripts/serve-complete-runtime.cjs`
- Modify: `games/marble-survival/tests/upgrade/game7-presentation.test.cjs`

**Interfaces:**
- Browser renders only `/api/snapshot` and `/api/events` data.
- URL `?quality=low|balanced|high|ultra` controls presentation only.
- `?clean=1` removes nonessential HUD while retaining outcome-critical in-arena cues.

- [ ] **Step 1: Add failing static/UI contract tests**

Read HTML/CSS/JS and assert:
- public HUD no longer contains `Tick`, `Camera`, `Feed`, or public checksum copy;
- app exposes four quality presets;
- app does not contain synthetic `tick >= 180`, synthetic `near-miss`, or visual-only rotating sweeper logic;
- CSS includes reduced-motion rules;
- HTML includes survivor/quota and leaderboard/qualification semantics.

- [ ] **Step 2: Run RED tests**

Run: `npm run marble:upgrade:test`
Expected: old dashboard strings/rotating sweeper behavior fail.

- [ ] **Step 3: Redesign layout**

Top rail: tournament/round + `N remain → Q qualify`.
Right compact rail: contenders/qualification cutoff.
Bottom: bounded semantic event line.
Audience vote panel collapses unless an eligible window is actually available.
Remove tick/camera/feed/checksum from normal public presentation.

- [ ] **Step 4: Implement premium Canvas world rendering**

Use cached or deterministic drawing for:
- warm ivory track/floor;
- charcoal structural base;
- rails/thickness/support shadows;
- brushed-metal moving mechanisms with visible pivots/supports;
- hazard/caution/qualification functional surfaces;
- quiet background with no neon grid.

Render translating sweepers from authoritative `x/y/width/height`; do not rotate them unless authority supplies angular state.

- [ ] **Step 5: Implement physical marble rendering**

Draw contact shadow, radial material body, identity pattern/emblem, displacement-derived orientation, controlled specular highlight, and status cue. Do not use glow as default material treatment.

- [ ] **Step 6: Implement quality presets**

Low: DPR 1, 30 FPS presentation target, cached/simple shadows, minimal effects.
Balanced: 60 FPS target, moderate DPR/contact shading.
High/Ultra: richer presentation only.
Do not send quality to the authority API or alter runtime config.

- [ ] **Step 7: Implement semantic procedural audio**

Use Web Audio only after user gesture. Map event/contact severity to capped oscillator/noise cues, enforce cooldown and voice limit, and keep critical meaning visual.

- [ ] **Step 8: Run GREEN static/server tests**

Run: `npm run marble:upgrade:test && npm run marble:stream:self-test`
Expected: browser-source contracts and server self-test pass.

- [ ] **Step 9: Commit**

```bash
git commit -am "feat(game7): deliver premium miniature motorsport broadcast"
```

---

### Task 7: Harden performance, recovery and CI evidence

**Files:**
- Modify: `.github/workflows/game7-premium-upgrade.yml`
- Modify: `games/marble-survival/scripts/serve-complete-runtime.cjs`
- Modify: `games/marble-survival/tests/upgrade/*.test.cjs`
- Modify: `games/marble-survival/README.md`
- Modify: `games/marble-survival/AUDIO_VISUAL.md`
- Modify: `games/marble-survival/TECHNICAL_ARCHITECTURE.md`
- Modify: `games/marble-survival/TESTING_STRATEGY.md`
- Modify: `games/marble-survival/PRODUCTION_READINESS.md`

**Interfaces:**
- CI runs build, foundation tests, all upgrade tests, stream self-test, and static nondeterminism/privacy scans.
- Health endpoint reports scheduler debt/degraded state without exposing private authority data.

- [ ] **Step 1: Add regression campaigns**

Add tests that execute repeated tournaments/seeds and assert:
- no invalid champion;
- exact standard quota sequence;
- same checksum for equivalent logical inputs independent of render polling;
- bounded pending events/replay buffers;
- restore does not duplicate result events;
- no quality preset enters authority state/config.

- [ ] **Step 2: Add CI gates**

Workflow commands:

```bash
npm ci
npm run build
npm run marble:upgrade:test
npm run marble:stream:self-test
```

Static scan rejects `Math.random`, `Date.now`, `performance.now`, `randomUUID` inside `games/marble-survival/src/` authoritative modules except explicitly presentation-only paths.

- [ ] **Step 3: Update documentation truthfully**

Document v2 authority, premium art direction, moving-collider truth, browser host architecture, exact commands and known unverified performance/R5 evidence. Remove/qualify stale claims that depended on the absent `complete/game7.cjs` bundle.

- [ ] **Step 4: Run complete fresh verification**

Require fresh CI for the exact branch head. Record job names, statuses and failing logs if any. Do not claim performance FPS or R5 without measured/external evidence.

- [ ] **Step 5: Perform specification and quality review**

Compare final diff against the design spec. Block P0/P1 findings, including any remaining alternate tournament authority, iteration-order winner selection, visual/collider mismatch, or quality-dependent authority.

- [ ] **Step 6: Commit**

```bash
git commit -am "test(game7): harden premium upgrade release gates"
```

---

## Final Verification Checklist

- [ ] `npm run build` passes on the exact final commit.
- [ ] Foundation marble tests pass unchanged or with explicitly versioned expectation updates.
- [ ] All Game 7 upgrade tests pass.
- [ ] Browser-source self-test passes using compiled TypeScript authority.
- [ ] CI is attached to the exact final branch head.
- [ ] Standard campaign remains 32→16→8→4→2→1.
- [ ] Same-tick finish and elimination tests prove explicit ordering.
- [ ] Moving sweeper render transform equals physics/public transform.
- [ ] Replay, camera, audio and quality settings cannot mutate authority.
- [ ] Public snapshot excludes seeds, RNG, operator/provider/private data.
- [ ] Public HUD prioritizes arena, survivor/quota, danger and cutoff instead of diagnostics.
- [ ] Reduced-motion and clean-feed behavior remain present.
- [ ] Documentation separates verified code behavior from unmeasured FPS, soak, canary, security/accessibility and production capacity evidence.
- [ ] No R5/production-ready claim is made from code completion alone.
