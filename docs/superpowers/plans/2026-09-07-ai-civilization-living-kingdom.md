# AI Civilization Living Kingdom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Game 5's browser-source presentation into a truthful, world-dominant 2.5D miniature kingdom while leaving deterministic authority, economy, persistence, and replay semantics unchanged.

**Architecture:** Keep `civilization-render-v1` additive/backward-compatible. Derive bounded presentation descriptors from existing authoritative tiles/economy, then render them through the existing DOM/CSS browser source. Representative labour is aggregate presentation only, local to real economic structures, with no individual identity, path, transport, or authority.

**Tech Stack:** TypeScript 5.8.3, Node.js 22.16+, browser DOM/CSS, Web Audio API, Node test runner, Playwright, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-07-ai-civilization-living-kingdom-design.md`

## Global Constraints

- Start from verified Game 5 baseline `85dcbf3af3848b7faf2d2578107f1b04560b7e26`; work only on `agent/game-05-living-kingdom`.
- Preserve `stateSchemaVersion: 1` and deterministic version `civilization-r2-v1`; this pass must not alter authoritative rules or save/replay semantics.
- No individual citizen authority, roads/pathfinding, collision, transport, construction progress, new economy rules, renderer migration, external assets, or hidden drama forcing.
- Presentation consumes immutable sanitized snapshots/events only and cannot mutate authority.
- Cosmetic variation must not consume named authoritative RNG streams.
- Maximum world remains 160 tiles; presentation collections/effects must be bounded.
- Low/Balanced/High/Ultra change decorative presentation only, never simulated population or outcomes.
- Reduced-motion/high-contrast/large-text and browser audio restrictions remain supported.
- Do not claim FPS/4K/device/soak results without measured evidence.
- Behaviour changes follow red-green-refactor. CI is the executable environment because the current agent container cannot reach GitHub directly.
- Keep writes reviewable and reversible; do not merge, force-push, or deploy.

---

### Task 1: Prove and fix the missing presentation stylesheet route

**Files:**
- Modify: `tests/phase3/civilization-broadcast-contract.test.cjs`
- Modify: `scripts/serve-civilization-stream.cjs`

**Interfaces:**
- Consumes: current stream self-test report.
- Produces: `routes.presentationStyles` status in `selfTest()` and a served `/ai-civilization/ux-v2.css` route until the new living-kingdom stylesheet replaces it.

- [ ] **Step 1: Write the failing regression**

Extend the self-test assertion:

```js
assert.equal(report.routes.presentationStyles,200);
```

and make `selfTest()` request the stylesheet referenced by the current HTML.

- [ ] **Step 2: Verify RED in GitHub Actions**

Push only the test change to `agent/game-05-living-kingdom` and inspect the exact-head Actions run. Expected failure: stream self-test or Phase 3 broadcast contract reports the referenced stylesheet route is not 200.

- [ ] **Step 3: Implement the minimum static route fix**

Add the referenced stylesheet to the explicit static allowlist; do not replace the allowlist with arbitrary filesystem serving.

- [ ] **Step 4: Verify GREEN**

Inspect the exact-head Actions run. Required: the focused civilization broadcast contract and stream self-test pass. Record unrelated/pre-existing failures separately.

---

### Task 2: Add truthful bounded presentation descriptors to render tiles

**Files:**
- Modify: `tests/phase3/civilization-presentation.test.cjs`
- Modify: `games/ai-civilization/src/presentation/snapshot.ts`
- Modify: `games/ai-civilization/src/manifest.ts` only if presentation version metadata needs an additive bump.

**Interfaces:**
- Consumes: `WorldTile`, existing authoritative building types, economy ledger, population cohorts.
- Produces on `RenderTile`:

```ts
buildingType: BuildingType | null;
visualVariant: 0 | 1 | 2 | 3;
groundDetail: 'none'|'cultivated'|'timber'|'masonry'|'domestic'|'civic';
activity: null | {
  kind: 'settlement'|'farm'|'timber'|'stone'|'market'|'study'|'civic'|'craft'|'defence'|'waterworks'|'domestic';
  label: string;
  resource: ResourceKey | null;
  density: 1 | 2 | 3;
  aggregate: true;
};
```

- [ ] **Step 1: Write failing snapshot tests**

Create a runtime with real buildings, snapshot twice, and assert:

```js
assert.equal(snapshot.world.tiles.some(tile => tile.buildingType==='farm' && tile.activity?.kind==='farm'),true);
assert.equal(snapshot.world.tiles.every(tile => tile.visualVariant>=0 && tile.visualVariant<=3),true);
assert.equal(snapshot.world.tiles.every(tile => !tile.activity || tile.activity.aggregate===true),true);
assert.deepEqual(createCivilizationRenderSnapshot(runtime.state,events),snapshot);
assert.equal(checksum(runtime.state),before);
```

Also assert no activity label contains `deliver`, `carry`, `path`, or `assigned citizen`.

- [ ] **Step 2: Verify RED in exact-head CI**

Expected failure: new additive render fields are absent.

- [ ] **Step 3: Implement deterministic descriptor derivation**

Use pure lookup tables and a stable integer hash from tile index/building type for `visualVariant`; do not use `Math.random`, current time, RNG, or mutation. Map activity only to actual current building mechanics.

- [ ] **Step 4: Verify GREEN and regression safety**

Require Phase 1–3 civilization tests to pass in CI and checksum-neutral snapshot assertions to remain green.

---

### Task 3: Replace abstract tiles with building-specific miniature world markup

**Files:**
- Modify: `tests/phase3/civilization-broadcast-contract.test.cjs`
- Modify: `public/ai-civilization/app.js`
- Create: `public/ai-civilization/living-kingdom.css`
- Modify: `public/ai-civilization/index.html`
- Modify: `scripts/serve-civilization-stream.cjs`

**Interfaces:**
- Consumes: additive `RenderTile` fields from Task 2.
- Produces: `.tile-world`, `.terrain-surface`, `.building-miniature[data-type]`, bounded `.cohort-activity`, and the new served stylesheet route.

- [ ] **Step 1: Write failing static/browser contract assertions**

Require HTML/JS/CSS to expose semantic building hooks and the new stylesheet, for example:

```js
assert.match(html,/living-kingdom\.css/);
assert.match(js,/building-miniature/);
assert.match(js,/dataset\.buildingType/);
assert.match(css,/\.building-miniature\[data-type="farm"\]/);
assert.match(css,/\.building-miniature\[data-type="house"\]/);
assert.match(css,/\.building-miniature\[data-type="workshop"\]/);
```

Require self-test route `presentationStyles` to resolve the new stylesheet.

- [ ] **Step 2: Verify RED**

Expected failure: semantic miniature markup and living stylesheet do not exist.

- [ ] **Step 3: Implement bounded DOM layers**

For each tile create terrain, optional building miniature, optional aggregate cohort activity, capital/hazard/focus cues, and accessible tooltip text. Never create transport lines or cross-tile worker paths.

- [ ] **Step 4: Implement visual constitution in `living-kingdom.css`**

Use CSS shapes/pseudo-elements for all actual building types, contact shadows, restrained terrain patterns, coherent light direction, and normal-view silhouette priority. No external URLs/assets.

- [ ] **Step 5: Verify GREEN**

Require static contracts, stream self-test, and existing privacy/no-external-asset checks to pass.

---

### Task 4: Make the world dominant and add a truthful contextual inspector

**Files:**
- Modify: `tests/phase3/civilization-broadcast-contract.test.cjs`
- Modify: `tests/browser/civilization-broadcast.spec.cjs`
- Modify: `public/ai-civilization/index.html`
- Modify: `public/ai-civilization/app.js`
- Modify: `public/ai-civilization/living-kingdom.css`

**Interfaces:**
- Consumes: tile snapshot descriptors.
- Produces: local-only selected tile index and `#tile-inspector` UI; selection never enters the simulation API.

- [ ] **Step 1: Write failing tests for inspector and hierarchy**

Require `#tile-inspector`; require interactive tile elements to support keyboard focus; in browser test select a real building tile and assert inspector text includes its actual building/activity but does not use unsupported transport language.

- [ ] **Step 2: Verify RED**

Expected failure: no inspector or interactive world selection exists.

- [ ] **Step 3: Implement local selection**

Keep `state.selectedTileIndex` in browser presentation state. Clicking, Enter, or Space selects a tile. On each snapshot, re-resolve the selection; if invalid, fall back to focus/capital. Show terrain, ownership, building, aggregate activity, resource association, and threat/capital truth only.

- [ ] **Step 4: Reorder responsive hierarchy**

Desktop: world dominates and realm becomes a restrained rail. Mobile: plan/danger → world → inspector/essentials → secondary panels. Preserve captions and clean-frame constraints.

- [ ] **Step 5: Verify GREEN**

Require desktop and mobile Playwright layout tests to remain overflow-safe and inspector interaction to work by pointer and keyboard.

---

### Task 5: Add Low/Balanced/High/Ultra presentation presets without changing simulation

**Files:**
- Modify: `tests/phase3/civilization-broadcast-contract.test.cjs`
- Modify: `tests/browser/civilization-broadcast.spec.cjs`
- Modify: `public/ai-civilization/index.html`
- Modify: `public/ai-civilization/app.js`
- Modify: `public/ai-civilization/living-kingdom.css`

**Interfaces:**
- Produces browser preference `civilization.quality` with allowed values `low|balanced|high|ultra`, reflected as `body.dataset.quality`.

- [ ] **Step 1: Write failing quality-preset tests**

Assert the control exposes all four values and browser interaction changes only `document.body.dataset.quality`/preference state. Compare `/civilization/state` before and after quality changes to confirm tick-appropriate authoritative fields are not client-mutated; do not assert server ticks stop advancing.

- [ ] **Step 2: Verify RED**

Expected failure: quality control/preset state absent.

- [ ] **Step 3: Implement preference and CSS degradation**

Low removes aggregate figures/secondary texture and reduces shadows; Balanced is default; High/Ultra increase bounded decorative detail. Reduced-motion disables decorative animation at all qualities.

- [ ] **Step 4: Verify GREEN**

Require browser tests and static no-authority-callback checks to pass.

---

### Task 6: Polish bounded semantic audio and event feedback without fake movement cues

**Files:**
- Modify: `tests/phase3/civilization-presentation.test.cjs` if server-side semantic audio contracts change.
- Modify: `public/ai-civilization/app.js`

**Interfaces:**
- Consumes: existing sanitized event `kind` and `sequence`.
- Produces: bounded, short procedural cue envelopes; no persistent unbounded oscillator/listener pool.

- [ ] **Step 1: Add a static/contract regression if production behaviour changes**

Require cue categories to remain event-driven and prohibit `delivery`, `footstep`, or transport audio callbacks without matching semantic events.

- [ ] **Step 2: Verify RED only if new behaviour is introduced**

If the existing semantic cue system is sufficient, keep it and document that no unsupported ambience was added rather than changing code for novelty.

- [ ] **Step 3: Implement the smallest justified polish**

Use distinct short envelopes/material-like frequency ranges for crisis/result/dynasty/great-work/milestone/construction while retaining dedupe, audio preference, caption independence, and browser gesture restrictions.

- [ ] **Step 4: Verify GREEN**

Audio remains optional; snapshot checksum tests and muted-audio tests stay green.

---

### Task 7: Capture automated visual evidence and make it retrievable from CI

**Files:**
- Modify: `tests/browser/civilization-broadcast.spec.cjs`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Produces screenshots under `artifacts/civilization-living-kingdom/` and an Actions artifact named `ai-civilization-living-kingdom-capture`.

- [ ] **Step 1: Extend browser capture cases**

Capture:

1. desktop village/settlement overview;
2. a real farm/workshop/economic-activity tile when available;
3. selected building + contextual inspector;
4. 390×844 mobile hierarchy;
5. densest repeatable scene reached in the bounded test window.

If a requested semantic scene cannot be reached deterministically within the browser test, record it as unavailable rather than faking state.

- [ ] **Step 2: Add CI artifact upload**

Upload the civilization capture directory with `if: always()` and `if-no-files-found: error` after browser verification.

- [ ] **Step 3: Verify exact-head Actions run**

Inspect job result and download the artifact if available. Review screenshots for hierarchy, clipping, building legibility, inspector readability, and excessive effects. Fix load-bearing defects found by real captures.

---

### Task 8: Final regression, evidence review, and scoped delivery

**Files:**
- Create or update: `evidence/ai-civilization/living-kingdom/review.md`
- Update docs only with results actually observed.

**Interfaces:**
- Produces: evidence summary with baseline/head SHAs, exact Actions run, commands represented by CI, test results, screenshots/artifact ID, determinism impact, visual/performance limitations, and rollback path.

- [ ] **Step 1: Run/inspect the exact-head verification set**

Required when available through CI:

```bash
npm test
npm run civilization:stream:self-test
npm run test:browser
```

Do not infer local pass from prior phase documents.

- [ ] **Step 2: Separate failures**

Classify any failure as regression, pre-existing branch divergence issue, infrastructure/tooling issue, or unverified external production evidence.

- [ ] **Step 3: Review specification compliance**

Confirm every new visual statement is backed by current state/economy. Confirm no authoritative file under `rules/`, `runtime/`, `state/`, `persistence/`, or `ai/` changed unless explicitly required and versioned.

- [ ] **Step 4: Review engineering/viewer quality**

Check world dominance, readable silhouettes, bounded DOM/effects, accessibility, mobile layout, reconnect behaviour, privacy, and screenshot evidence. Fix P0/P1 regressions before delivery.

- [ ] **Step 5: Record limitations honestly**

Production hardware FPS, real 4K capture, long-duration soak, multi-day broadcast reliability, and external R5 evidence remain unverified unless actual evidence exists.

- [ ] **Step 6: Finish branch without merging**

Report the branch/head commit and, if appropriate and actually created, a pull request. Do not merge, deploy, or force-push.
