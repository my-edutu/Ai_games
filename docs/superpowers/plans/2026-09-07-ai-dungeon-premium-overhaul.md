# AI Dungeon Premium Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development. Every behaviour change follows red-green-refactor; every completion claim requires fresh verification evidence.

**Goal:** Upgrade Game 9 from a functional deterministic broadcast prototype into a more believable, readable and production-reviewable autonomous dungeon while preserving authoritative determinism, autonomous continuity, audience safety and low-end support.

**Architecture:** Keep `DungeonRuntime` and `stepDungeonRules` as the only gameplay authority. Add one pure spatial-visibility module consumed by observation, combat validation and public snapshots; presentation remains a read-only Canvas/Web Audio adapter. Visual quality tiers change only cosmetic work. No new runtime dependency is required.

**Tech Stack:** Node.js 22.16, TypeScript 5.8, CommonJS build, Node test runner, HTML5 Canvas, Web Audio, Playwright Chromium.

**Spec:** `docs/superpowers/specs/2026-08-17-ai-dungeon-endless-adventure-design.md` plus the 2026-09-07 Game 9 premium-overhaul mandate supplied by the repository owner.

## Global constraints

- Work only on Game 9 and shared code that is strictly necessary for Game 9.
- Start from `feat/game-09-ai-dungeon` commit `f031514c014c229adc3a3085cb6209b3461d9f85`.
- Preserve fixed-step authority, named seeded randomness, stable ordering and replay truth.
- Presentation, camera, interpolation, particles, audio and quality settings cannot mutate gameplay state.
- Do not reveal hidden enemies/objectives through the AI observation or public spectator snapshot.
- Ranged damage must respect actual dungeon occlusion.
- Low quality may reduce decoration but never remove objective, enemy, telegraph, health, danger, caption or intent meaning.
- No force-push, merge, deployment or external-service change.
- R5 and `productionReady:true` remain blocked without exact-candidate external evidence, 72-hour endurance and seven-day canary.

---

### Task 1: Prove and repair browser-source asset integrity

**Files:**
- Modify: `tests/phase3/dungeon-broadcast.test.cjs`
- Modify: `tests/browser/dungeon-stream.spec.cjs`
- Modify: `scripts/serve-dungeon-stream.cjs`

**Interfaces:**
- Consumes: `/dungeon/index.html` references `/dungeon/ux-v2.css`.
- Produces: stream host serves every HTML-declared Game 9 asset and self-test verifies the asset set.

- [ ] **Step 1: Add the failing asset-integrity tests.**

Add assertions equivalent to:

```js
const server=fs.readFileSync(path.join(__dirname,'../../scripts/serve-dungeon-stream.cjs'),'utf8');
assert.match(server,/['"]ux-v2\.css['"]/);
assert.match(server,/\/dungeon\/ux-v2\.css/);
```

In Playwright, request the stylesheet and require HTTP 200:

```js
const response=await page.request.get(`${base}/dungeon/ux-v2.css`);
expect(response.status()).toBe(200);
```

- [ ] **Step 2: Run Phase 3 / browser CI and observe RED.**

Expected current failure: the stream host does not expose `/dungeon/ux-v2.css`.

- [ ] **Step 3: Make the minimal server fix.**

Include `ux-v2.css` in the asset manifest and route table:

```js
const APP_STYLES=['styles.css','ux-v2.css'];
function assets(){return['index.html',...APP_STYLES,...APP_SCRIPTS].map(name=>path.join(PUBLIC_ROOT,name))}
```

and map `/dungeon/ux-v2.css` to `ux-v2.css`.

- [ ] **Step 4: Re-run focused checks and observe GREEN.**

Run `npm run test:dungeon:phase3`, `npm run dungeon:stream:self-test`, and the Dungeon Playwright spec.

---

### Task 2: Enforce wall-aware perception and combat

**Files:**
- Create: `games/ai-dungeon-endless-adventure/src/spatial/visibility.ts`
- Modify: `games/ai-dungeon-endless-adventure/src/ai/observation.ts`
- Modify: `games/ai-dungeon-endless-adventure/src/ai/policy.ts`
- Modify: `games/ai-dungeon-endless-adventure/src/rules/step.ts`
- Modify: `games/ai-dungeon-endless-adventure/src/presentation/snapshot.ts`
- Modify: `tests/phase2/dungeon-gameplay.test.cjs`
- Modify: `tests/phase3/dungeon-broadcast.test.cjs`

**Interfaces:**
- Produces: `dungeonDistance(a,b,width)`, `hasDungeonLineOfSight(tiles,width,height,from,to,maxDistance?)`, and `visibleDungeonCells(tiles,width,height,origin,radius)`.
- Observation, combat and spectator visibility consume the same wall-aware rule.

- [ ] **Step 1: Add RED tests for occlusion.**

Use a controlled straight corridor with a wall between Astra and a target. Require:

```js
assert.equal(buildDungeonObservation(state).visibleEnemies.some(e=>e.id==='behind-wall'),false);
assert.equal(buildDungeonRenderSnapshot(state).entities.some(e=>e.id==='behind-wall'),false);
```

Require a hero ranged attack against that enemy to leave HP unchanged and emit `action.rejected`. Require an Ember Seer with a blocked ray not to damage Astra.

- [ ] **Step 2: Implement the pure visibility module.**

Use integer grid ray traversal. The origin and target may be visible/walkable; any intermediate wall blocks the ray. Reject out-of-range and out-of-bounds targets. Enumerate visible cells only inside the configured radius.

- [ ] **Step 3: Replace Manhattan-only spectator and AI visibility.**

`buildDungeonObservation`, `refreshedDungeonKnowledge`, and `buildDungeonRenderSnapshot` must use `visibleDungeonCells` rather than revealing every cell in a diamond through walls.

- [ ] **Step 4: Make ranged legality match visible reach.**

Hero ranged targeting and Ember Seer ranged telegraph/contact must require wall-aware line of sight. If a Seer loses sight before its committed shot, cancel the shot and resume movement rather than damaging through geometry.

- [ ] **Step 5: Re-run Phase 2/3 and deterministic campaigns.**

Confirm replay equality remains stable for the new deterministic version and that zero-audience runs continue to progress.

---

### Task 3: Remove omniscient fallback and improve critical-health decisions

**Files:**
- Modify: `games/ai-dungeon-endless-adventure/src/ai/policy.ts`
- Modify: `games/ai-dungeon-endless-adventure/src/runtime/run.ts`
- Modify: `tests/phase2/dungeon-gameplay.test.cjs`

**Interfaces:**
- Consumes: current visible/remembered state and legal local movement only.
- Produces: deterministic emergency actions that do not pathfind to an unobserved sigil/gate.

- [ ] **Step 1: Add RED tests for hidden-target independence.**

Construct two otherwise identical states with the same local observation and different unobserved sigil locations. Require:

```js
assert.deepEqual(fallbackDungeonAction(stateA),fallbackDungeonAction(stateB));
```

- [ ] **Step 2: Add RED test for critical recovery.**

With Astra at <=40% HP, at least one potion, and an adjacent enemy, require the normal policy to choose `heal` before another committed melee attack.

- [ ] **Step 3: Implement bounded fallback.**

Priority: resolve active relic choice; wait outside running; heal at critical health; attack a visible adjacent threat; interact/descend only when standing on the known objective; otherwise choose a deterministic immediately walkable neighbor preferring cells not present in the recent-cell tail; guard if none.

- [ ] **Step 4: Keep public intent truthful.**

Normal policy explanations continue to describe recorded state only; fallback increments fallback/replan counters and must not claim an objective was found.

- [ ] **Step 5: Re-run Phase 2 campaign and replay checks.**

Compare same-seed checksums within the new deterministic version and inspect fallback/stagnation rates.

---

### Task 4: Upgrade the representative dungeon scene without changing authority

**Files:**
- Modify: `public/ai-dungeon/app-core.js`
- Modify: `public/ai-dungeon/app-art.js`
- Modify: `public/ai-dungeon/app-scene.js`
- Modify: `public/ai-dungeon/app-main.js`
- Modify: `public/ai-dungeon/ux-v2.css`
- Modify: `tests/phase3/dungeon-broadcast.test.cjs`
- Modify: `tests/browser/dungeon-stream.spec.cjs`

**Interfaces:**
- Consumes: immutable `DungeonPresentationFrame` only.
- Produces: presentation-only `quality=low|balanced|high|ultra|auto`, ancient-ruin material treatment, stable hero/enemy interpolation, clearer source lighting and readable hazard/telegraph silhouettes.

- [ ] **Step 1: Add RED presentation contract tests.**

Require `QUALITY_PRESETS`, `data-quality`, stable low-tier limits, and browser preservation of tick/objective/captions under `?quality=low&reducedMotion=1`.

- [ ] **Step 2: Implement quality presets.**

Low caps DPR/effects and disables decorative shadow/texture work; Balanced is default; High and Ultra increase only presentation density/resolution. Auto chooses conservatively from viewport/device pixel ratio and never changes gameplay data.

- [ ] **Step 3: Establish ancient-underground material hierarchy.**

Render walls as layered stone blocks with contact shadow/bevel, floors as restrained worn slabs, objectives as localized light sources, and selectively add moss/damp/bronze accents derived from stable cell hashes. Do not add textures/assets or random authoritative state.

- [ ] **Step 4: Add visual movement continuity.**

Interpolate hero/enemy render positions between the prior and latest public snapshots. Reduced-motion snaps directly to authoritative positions. Never feed interpolated coordinates back into AI, collision or snapshots.

- [ ] **Step 5: Improve camera/readability.**

Keep Astra and immediate threats framed; limit smoothing; reduce route-line dominance; preserve telegraphs on every quality tier; keep dungeon area dominant over HUD.

- [ ] **Step 6: Capture browser evidence.**

Use desktop 1920x1080, phone landscape 640x360, clean feed, reduced motion, and low-quality screenshots. Check console/page errors and horizontal overflow.

---

### Task 5: Truthful versioning, documentation and release evidence

**Files:**
- Modify: `games/ai-dungeon-endless-adventure/src/manifest.ts`
- Modify: `games/ai-dungeon-endless-adventure/README.md`
- Create: `docs/reviews/2026-09-07-ai-dungeon-premium-review.md`

**Interfaces:**
- Produces: exact review record tied to branch/commit, commands, CI run, artifacts, remaining defects and R5 blockers.

- [ ] **Step 1: Increment only affected versions.**

Because perception/combat/fallback outcomes change, increment `deterministicVersion` from `dungeon-rules-v3` to `dungeon-rules-v4`. Because browser presentation changes, increment `presentationVersion` from `dungeon-presentation-v1` to `dungeon-presentation-v2`. Keep generator version unchanged unless generator code changes.

- [ ] **Step 2: Correct stale README claims.**

Replace the obsolete “Phases 4–6 planned / R3” text with a truthful statement that Phase 4–6 software exists, the current overhaul branch is under verification, and production readiness remains false until R5 evidence exists.

- [ ] **Step 3: Run full fresh verification.**

Required commands/gates: `npm test`, dungeon stream self-test, Dungeon browser spec, Phase 5 chaos, Phase 6 candidate validation, authoritative nondeterminism scan, and CI on the exact branch SHA.

- [ ] **Step 4: Inspect generated screenshots, not only test exit codes.**

Record actual capture resolution and note visual defects that remain. Do not call screenshots proof of 30/60 FPS or physical low-end performance.

- [ ] **Step 5: Record final truthful status.**

Report implemented changes, exact commit, CI run, passed/failed jobs, artifacts, remaining P2/P3 defects and unverified physical-device/endurance/canary evidence. Do not claim R5 or universal 4K performance.
