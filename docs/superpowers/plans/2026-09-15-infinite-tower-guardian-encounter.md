# Infinite Tower Guardian Encounter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn guardian floors into deterministic, readable multi-phase encounters that the autonomous climber can intentionally fight and viewers can understand without changing Tower's replay/authority model.

**Architecture:** Keep `TowerEnemy` schema unchanged and derive guardian phase from existing `health/maxHealth`, so saves/replays do not need migrations. Combat owns deterministic telegraph timing and bounded projectile patterns; AI owns guardian approach/attack decisions; presentation derives phase from snapshot health and renders telegraph/pattern cues. Existing projectile caps, event sequencing, replay checksums and authoritative RNG remain the safety boundary.

**Tech Stack:** TypeScript authoritative simulation, Node test runner/CommonJS compiled tests, seeded RNG, HTML Canvas 2D renderer, Playwright browser evidence.

**Spec:** `games/infinite-tower-climb/TWENTY_TWO_SKILL_REVIEW.md`

## Global Constraints

- `games/eko-street-run/**` remains READ-ONLY.
- No Eko assets, physics, branches, phase files or unfinished implementation may be copied into Tower.
- Guardian behavior must remain deterministic for the same state/action/RNG input.
- No new unbounded arrays or timers; `maxProjectiles` remains the hard projectile ceiling.
- Telegraphs must precede attacks; phase escalation may increase pressure but must not remove reaction time.
- Autonomous play must remain viable without audience input or remote services.
- Presentation is read-only and may not feed state back into authority.
- Existing replay, nondeterminism, chaos, release-validation and browser evidence gates remain mandatory.

---

### Task 1: Deterministic Guardian Attack Phases

**Files:**
- Create: `tests/phase2/tower-guardian-combat.test.cjs`
- Modify: `games/infinite-tower-climb/src/combat/step.ts`

**Interfaces:**
- Consumes: existing `TowerEnemy.health`, `TowerEnemy.maxHealth`, `TowerEnemy.telegraphUntilTick`, `TowerEnemy.cooldown`, `TowerState.config.maxProjectiles`.
- Produces: exported `guardianPhase(enemy): 1|2|3`, deterministic guardian telegraph/attack events, and bounded single/fork/trident projectile patterns.

- [ ] **Step 1: Write the failing combat tests**

Create `tests/phase2/tower-guardian-combat.test.cjs` with tests that construct a guardian from a launch-floor-10 runtime and assert:

```js
const test=require('node:test');
const assert=require('node:assert/strict');
const{NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const{TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const{stepTowerCombat,guardianPhase}=require('../../dist/games/infinite-tower-climb/src/combat/step.js');

function guardianState(seed='guardian-phases'){
  const r=TowerRuntime.create({launchFloor:10,maxProjectiles:12},seed);
  const s=structuredClone(r.state);
  const g=s.enemies.find(e=>e.kind==='guardian');
  assert.ok(g);
  s.player.position={x:g.position.x-90000,y:g.position.y};
  s.player.invulnerableTicks=0;
  g.cooldown=0;
  g.telegraphUntilTick=0;
  return{s,g};
}

const idle={move:0,jump:false,dash:false,attack:false,ability:false};

test('guardian phase is derived deterministically from health thirds',()=>{
  const{s,g}=guardianState();
  g.health=g.maxHealth;assert.equal(guardianPhase(g),1);
  g.health=Math.floor(g.maxHealth*2/3);assert.equal(guardianPhase(g),2);
  g.health=Math.max(1,Math.floor(g.maxHealth/3));assert.equal(guardianPhase(g),3);
});

test('guardian telegraphs before firing and phase three emits a bounded trident',()=>{
  let{s,g}=guardianState('guardian-trident');
  g.health=Math.max(1,Math.floor(g.maxHealth/3));
  const first=stepTowerCombat(s,idle,NamedRng.fromSeed('guardian-trident'));
  assert.equal(first.events.some(e=>e.type==='guardian-telegraph'&&e.data?.phase===3&&e.data?.pattern==='trident'),true);
  assert.equal(first.state.projectiles.length,0);
  s=first.state;g=s.enemies.find(e=>e.kind==='guardian');
  s.tick=g.telegraphUntilTick;
  const fired=stepTowerCombat(s,idle,NamedRng.fromSeed('guardian-trident'));
  assert.equal(fired.events.some(e=>e.type==='guardian-attack'&&e.data?.phase===3&&e.data?.pattern==='trident'),true);
  assert.equal(fired.state.projectiles.filter(p=>p.owner==='enemy').length,3);
  assert.ok(fired.state.projectiles.length<=fired.state.config.maxProjectiles);
  assert.deepEqual(fired.state.projectiles.map(p=>p.velocity.y).sort((a,b)=>a-b),[-1600,0,1600]);
});

test('guardian phase attack is byte-deterministic for identical inputs',()=>{
  const a=guardianState('guardian-determinism').s,b=structuredClone(a),ra=NamedRng.fromSeed('guardian-determinism'),rb=NamedRng.fromSeed('guardian-determinism');
  const one=stepTowerCombat(a,idle,ra),two=stepTowerCombat(b,idle,rb);
  assert.deepEqual(one,two);
});
```

- [ ] **Step 2: Run the tests to verify RED**

Run through the repository CI build/test gate. Expected: FAIL because `guardianPhase` and guardian-specific `guardian-telegraph` / `guardian-attack` behavior do not exist yet.

- [ ] **Step 3: Implement the minimal deterministic phase system**

In `combat/step.ts`:
- Export `guardianPhase(enemy)` derived from `health/maxHealth` with no mutable phase field.
- Generalize projectile spawning to accept optional vertical velocity while preserving `velocityY=0` for existing shots.
- Use guardian phase to select:
  - Phase 1: one straight bolt, telegraph 10 ticks, cooldown 32, patrol speed 1500.
  - Phase 2: two-shot fork with `vy=-1200,+1200`, telegraph 9 ticks, cooldown 28, patrol speed 1800.
  - Phase 3: three-shot trident with `vy=-1600,0,+1600`, telegraph 8 ticks, cooldown 24, patrol speed 2100.
- Emit `guardian-telegraph` when a guardian arms an attack and `guardian-attack` when the pattern fires. Preserve `enemy-telegraph` for compatibility with existing audio/event consumers.
- Before each projectile spawn, honor `maxProjectiles`; partial pattern emission is allowed at the cap but total active projectiles must never exceed the cap.

- [ ] **Step 4: Run the combat tests and full build/test gate**

Expected: guardian tests PASS, all existing combat/campaign/determinism tests remain PASS.

- [ ] **Step 5: Commit**

Commit message: `feat(tower): add deterministic guardian attack phases`

---

### Task 2: Guardian-Aware Autonomous Policy

**Files:**
- Modify: `tests/phase2/tower-ai.test.cjs`
- Modify: `games/infinite-tower-climb/src/ai/policy.ts`

**Interfaces:**
- Consumes: existing `TowerObservation.enemies`, projectiles, player cooldowns, `pulse-shot` upgrade state.
- Produces: `engaging-guardian` intent and legal approach/attack behavior while preserving projectile/hazard evasion priority.

- [ ] **Step 1: Write failing guardian policy tests**

Append tests that place a guardian on the current floor outside melee reach but within encounter range and assert the policy moves toward it with `intent.mode==='engaging-guardian'`. Add a second case with an incoming enemy projectile and assert `evading-projectile` still wins over guardian engagement.

- [ ] **Step 2: Run through build/test to verify RED**

Expected: FAIL because guardian outside melee reach currently falls back to traversal logic and there is no `engaging-guardian` mode.

- [ ] **Step 3: Implement guardian-aware decisions**

In `ai/policy.ts`:
- Extend `TowerIntent.mode` with `engaging-guardian`.
- After projectile and hazard avoidance, locate an active current-floor guardian within a generous vertical encounter band.
- If guardian is inside melee reach, attack and face/move toward it.
- If outside melee reach, approach it; if `pulse-shot` is installed and ability cooldown is zero, fire the ability while approaching.
- Keep projectile/hazard evasion before guardian logic so phase escalation remains survivable.

- [ ] **Step 4: Run AI tests and campaign test**

Expected: new guardian policy tests PASS and autonomous campaign still clears content without technical outcomes.

- [ ] **Step 5: Commit**

Commit message: `feat(tower): make autonomous AI intentionally engage guardians`

---

### Task 3: Guardian Phase Presentation and Evidence

**Files:**
- Modify: `games/infinite-tower-climb/src/presentation/audio.ts`
- Modify: `public/infinite-tower-climb/app.js`
- Modify: `tests/phase3/tower-visual-rebuild.test.cjs`
- Modify: `tests/browser/tower-stream.spec.cjs`

**Interfaces:**
- Consumes: existing guardian `health/maxHealth/telegraph`, `guardian-telegraph` and `guardian-attack` events.
- Produces: visible phase identity, attack-lane cues, captions/audio warnings, and browser diagnostics `guardianPhase` / `guardianTelegraphVisible`.

- [ ] **Step 1: Write failing presentation tests**

Add source-contract assertions for `guardianPhaseVisual`, `drawGuardianAttackLanes`, `guardianPhase`, and `guardianTelegraphVisible`. Strengthen the guardian Playwright evidence test to require a visible guardian plus phase diagnostics and a visible telegraph cue when the evidence scenario is prepared in telegraph state.

- [ ] **Step 2: Run build/test to verify RED**

Expected: FAIL because phase-specific visual helpers/diagnostics do not exist.

- [ ] **Step 3: Implement presentation**

- Derive visual phase from guardian health thirds.
- Phase 1 keeps current core color/shape; Phase 2 adds twin side-core energy and stronger outline; Phase 3 adds three-lane attack indicators and a more urgent pulsing halo.
- Draw telegraph lanes only while `telegraph===true`; never imply an attack lane after the telegraph ends.
- Add `guardianPhase` and `guardianTelegraphVisible` to bounded render diagnostics.
- Map `guardian-telegraph` to a high-priority warning caption/cue in `audio.ts`; keep muted mode caption-complete.

- [ ] **Step 4: Run full CI/browser evidence**

Expected: all source tests, Tower self-test, nondeterminism scan, chaos/release validation, portrait/high-floor evidence, and guardian browser evidence PASS.

- [ ] **Step 5: Inspect screenshots manually**

Inspect at minimum guardian, hazard, jump, portrait and high-floor captures. Reject the pass if telegraph lanes obscure the player, the guardian dominates the whole frame, or compressed/mobile readability regresses.

- [ ] **Step 6: Commit**

Commit message: `feat(tower): present guardian phases and attack telegraphs`

---

## Self-Review

- Spec coverage: addresses difficulty/failure balancing, platformer experience, autonomous-agent design, deterministic simulation, game physics/combat readability, game audio, game-feel/VFX, livestream HUD, viewer retention, performance bounds and simulation QA.
- Placeholder scan: no deferred implementation placeholders; authored music/SFX and long soak remain explicitly outside this guardian plan.
- Type consistency: phase is derived from existing `TowerEnemy`; no schema migration. New AI mode is local to `TowerIntent`. New diagnostics are presentation-only.
