# AI Ant Colony 2.5D Visual Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing Ant Colony browser presentation from a dashboard-framed 2D visualization into a living, performance-bounded 2.5D ecosystem while preserving the deterministic authoritative simulation.

**Architecture:** Keep `AntColonyRuntime` and all rules/state as authority. Extend the immutable render projection with safe temporal/queen presentation data, then rebuild only the Ant Colony public renderer into a layered terrain/entity/camera/VFX/audio system. Browser interpolation, LOD, chamber identity and cinematic framing remain presentation-only and reconstructible from accepted render snapshots.

**Tech Stack:** TypeScript 5.8, Node 22, Node test runner, dependency-free browser JavaScript, Canvas 2D, optional WebGL2 instancing with Canvas fallback, Web Audio API, Playwright/Chromium, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-15-ant-colony-2-5d-visual-rebuild-design.md`

## Global Constraints

- Work only on Ant Colony-owned code/public assets/tests/evidence/docs plus narrowly Ant-specific workflow/host hooks when required.
- `games/eko-street-run/**` is read-only.
- Infinite Tower and every other game are read-only.
- Authoritative simulation, deterministic outcomes, replay checksums, persistence and audience boundaries must remain unchanged.
- Presentation consumes immutable render snapshots and cannot write authority.
- No `Math.random`, wall-clock value or browser frame delta may enter authoritative state.
- Viewer influence cannot guarantee survival, extinction, victory, queen death or predator kills.
- Browser resources, particles, event histories, audio voices and camera queues must be bounded.
- Clean feed, reduced motion, high contrast, captions and common OBS 16:9 sizing must remain functional.
- No completion claim without fresh CI/browser evidence.

---

### Task 1: Establish baseline evidence and the visual-rebuild RED gate

**Files:**
- Create: `tests/phase3/ant-colony-visual-rebuild.test.cjs`
- Read only: `public/ai-ant-colony/*`, `games/ai-ant-colony/src/presentation/*`

**Interfaces:**
- Consumes: existing `AntColonyRuntime`, `createAntRenderSnapshot`, current public assets.
- Produces: a failing executable contract for presentation-v2 requirements without changing production behavior.

- [ ] **Step 1: Capture untouched baseline**

Use the docs-only branch candidate through the existing `Autonomous Games CI` browser test. Preserve the resulting Ant Colony artifact as the BEFORE evidence and record exact candidate/run ID in `VISUAL_ACCEPTANCE_REPORT.md` later.

- [ ] **Step 2: Write the failing visual contract**

Require all of the following before implementation exists:

```js
assert.equal(typeof snapshot.environment.dayProgress, 'number');
assert.equal(typeof snapshot.environment.seasonProgress, 'number');
assert.equal(typeof snapshot.queen.eggsLaid, 'number');
assert.match(html, /id="ecosystem-stage"/);
assert.match(html, /id="terrain-canvas"/);
assert.match(html, /id="entity-canvas"/);
assert.match(app, /webgl2/);
assert.match(app, /drawNearAnt|renderNearAnt/);
assert.match(app, /excavation/i);
assert.match(app, /dayProgress/);
assert.match(app, /seasonProgress/);
assert.doesNotMatch(app, /Math\.random/);
```

Also assert compact HUD/observer-panel/clean-feed markers and that the Ant stream host serves all new assets.

- [ ] **Step 3: Run/commit RED**

Push only the new failing test. The dedicated/full CI must fail for missing visual-v2 features rather than syntax/setup errors. Record the failing run ID.

---

### Task 2: Extend the immutable presentation projection

**Files:**
- Modify: `games/ai-ant-colony/src/presentation/snapshot.ts`
- Modify: `tests/phase3/ant-colony-visual-rebuild.test.cjs`
- Test/regression: `tests/phase3/ant-colony-presentation.test.cjs`

**Interfaces:**
- Consumes: authoritative `state.tick`, `config.dayLengthTicks`, `config.seasonLengthTicks`, `queen.eggsLaid`.
- Produces: immutable `environment.dayProgress`, `environment.seasonProgress`, and `queen.eggsLaid` on the existing public snapshot.

- [ ] **Step 1: Keep the RED test focused**

Verify the new fields are absent/failing on the previous candidate and that privacy assertions still forbid `seed`/`config` leakage.

- [ ] **Step 2: Implement minimal safe derivation**

```ts
dayProgress: (state.tick % state.config.dayLengthTicks) / state.config.dayLengthTicks,
seasonProgress: (state.tick % state.config.seasonLengthTicks) / state.config.seasonLengthTicks,
```

Expose only `queen.eggsLaid`; do not expose private config/seed/rule internals.

- [ ] **Step 3: Verify GREEN**

Run Ant presentation tests plus the visual-rebuild test. Confirm state checksum is unchanged before/after snapshot creation and deep-freeze/privacy tests remain green.

- [ ] **Step 4: Commit**

`feat(ant): extend ecosystem render snapshot`

---

### Task 3: Rebuild the broadcast shell around the world, not dashboards

**Files:**
- Modify: `public/ai-ant-colony/index.html`
- Modify: `public/ai-ant-colony/styles.css`
- Modify/retire: `public/ai-ant-colony/ux-v2.css`
- Modify: `scripts/serve-ant-colony-stream.cjs`
- Test: `tests/phase3/ant-colony-visual-rebuild.test.cjs`

**Interfaces:**
- Consumes: `/ant/state` payload.
- Produces: full-frame `#ecosystem-stage`, terrain/entity/effects canvases, compact HUD, captions, optional observer/operator surfaces.

- [ ] **Step 1: Add RED layout assertions**

Assert there are no permanent left/right dashboard columns; world stage occupies the viewport; compact HUD contains population/food/brood/queen/threat/day/season/weather; observer detail is optional; clean feed hides nonessential overlays.

- [ ] **Step 2: Implement the shell**

Use stacked canvases inside a full-bleed 16:9-friendly stage:

```html
<section id="ecosystem-stage">
  <canvas id="terrain-canvas"></canvas>
  <canvas id="entity-canvas"></canvas>
  <canvas id="effects-canvas"></canvas>
</section>
```

Retain accessible labels/captions and operator controls outside the primary spectacle hierarchy.

- [ ] **Step 3: Update static host allowlist/self-test**

The host must serve all Ant-owned browser assets and verify non-empty bounded sources. Do not alter another game's host.

- [ ] **Step 4: Verify/commit**

`feat(ant): rebuild compact livestream shell`

---

### Task 4: Build the 2.5D terrain and underground colony renderer

**Files:**
- Create: `public/ai-ant-colony/world-renderer.js`
- Modify: `public/ai-ant-colony/app.js`
- Modify: `scripts/serve-ant-colony-stream.cjs`
- Test: `tests/phase3/ant-colony-visual-rebuild.test.cjs`

**Interfaces:**
- Consumes: immutable snapshot `world`, environment progress/weather, colony resources and recent events.
- Produces: layered surface/soil/tunnel/chamber rendering and stable presentation-only layout descriptors.

- [ ] **Step 1: Add RED source/contract tests**

Require distinct rendering paths for surface foreground, surface gameplay, soil strata, roots/rocks/moisture, carved tunnels/chambers and deep background. Require bounded deterministic presentation decoration derived from `runToken`/cell IDs rather than `Math.random`.

- [ ] **Step 2: Implement depth layers**

Draw sky/light gradient, surface silhouette, vegetation/debris foreground, topsoil/loam/clay/deep-soil bands, parallax roots, embedded stones/water, vignette/depth haze and organic tunnel masks.

- [ ] **Step 3: Derive chamber presentation identity**

Generate presentation-only queen/nursery/storage/staging/expansion descriptors from existing chamber geometry plus brood/food/threat/dig state. Never write the identities back to authority.

- [ ] **Step 4: Verify/commit**

`feat(ant): establish 2.5d ecosystem renderer`

---

### Task 5: Render ants, roles, queen and brood as biological entities

**Files:**
- Create: `public/ai-ant-colony/entity-renderer.js`
- Modify: `public/ai-ant-colony/app.js`
- Modify: `scripts/serve-ant-colony-stream.cjs`
- Test: `tests/phase3/ant-colony-visual-rebuild.test.cjs`

**Interfaces:**
- Consumes: snapshot ants/predators/queen/brood counts and world positions.
- Produces: near/mid/far ant LOD, natural role differentiation, queen/attendant animation, visible brood stages.

- [ ] **Step 1: Add RED LOD/role assertions**

Require six legs, antennae and three main body sections in near representation, stable role morphology, queen morphology, brood stage visuals and explicit LOD thresholds.

- [ ] **Step 2: Implement optional WebGL2 instancing**

Use `entity-canvas.getContext('webgl2')` when available for batched mid/far ant rendering. Build bounded buffers sized to current public entity count. Fall back to Canvas 2D without changing game truth.

- [ ] **Step 3: Implement near biological silhouettes**

Near-camera ants use procedural articulated Canvas silhouettes with head/thorax/abdomen, six legs, antennae, role morphology, orientation derived from movement history, gait phase, carried food/soil and shadows.

- [ ] **Step 4: Implement queen/brood**

Queen uses elongated abdomen, subtle breathing and truthful danger emphasis. Derive nearby attendants from actual nearby ants. Draw egg/larva/pupa as distinct forms and nurse tending only when nurse/brood state supports it.

- [ ] **Step 5: Verify/commit**

`feat(ant): add animated ant and brood rendering`

---

### Task 6: Make excavation, foraging, pheromones, threats and combat visible

**Files:**
- Modify: `public/ai-ant-colony/world-renderer.js`
- Modify: `public/ai-ant-colony/entity-renderer.js`
- Modify: `public/ai-ant-colony/app.js`
- Test: `tests/phase3/ant-colony-visual-rebuild.test.cjs`

**Interfaces:**
- Consumes: previous/current accepted snapshots, recent semantic events, ants' tasks/carryingFood, predators, pheromone fields.
- Produces: bounded presentation transitions only.

- [ ] **Step 1: Add RED transition tests/source gates**

Require bounded excavation transition cache, carried food, contextual pheromone modes, predator/defense animation and effect cleanup.

- [ ] **Step 2: Excavation interpolation**

Diff public tile arrays. New tunnel/chamber cells receive a short visual dig transition with receding wall, dirt chips/dust and nearby digger emphasis. Cap transition count/lifetime and clear on run change/recovery.

- [ ] **Step 3: Foraging/pheromones**

Show food as physical seeds/organic fragments. Carrying ants visibly transport food. Show food/alarm/excavation pheromones only contextually or in observer mode, with alpha/intensity derived from authoritative values.

- [ ] **Step 4: Predator/combat**

Render beetle/spider silhouettes and biological ant responses—surrounding, bite/grapple cadence, retreat/defense posture—based on actual proximity/task/threat. No fabricated kills.

- [ ] **Step 5: Verify/commit**

`feat(ant): visualize excavation foraging and defense`

---

### Task 7: Add weather, day/night, seasons, camera director, VFX and aggregate audio

**Files:**
- Create: `public/ai-ant-colony/director.js`
- Create: `public/ai-ant-colony/soundscape.js`
- Modify: `public/ai-ant-colony/app.js`
- Modify: `public/ai-ant-colony/world-renderer.js`
- Modify: `scripts/serve-ant-colony-stream.cjs`
- Test: `tests/phase3/ant-colony-visual-rebuild.test.cjs`

**Interfaces:**
- Consumes: environment progress/weather/season, recent events, threat, queen state, ants/predators and existing semantic audio cues.
- Produces: bounded camera shot decisions, environmental lighting/VFX and aggregate audio only.

- [ ] **Step 1: Add RED director/environment tests**

Require shot priority, dwell/cooldown bounds, overview fallback, reduced-motion behavior, weather/day/season lighting functions, bounded VFX pool and bounded sound voices.

- [ ] **Step 2: Implement environmental presentation**

Day progress drives dawn/day/evening/night light; weather drives rain/wetness/heat shimmer/drought treatment; season drives vegetation/leaf/soil palette/density. Changes are visual only.

- [ ] **Step 3: Implement documentary director**

Prioritize queen danger > predator/combat > food discovery/route > excavation/chamber > brood/queen event > population milestone > overview. Enforce minimum dwell and cooldown; smooth pan/zoom; reduced-motion removes shake/rapid changes.

- [ ] **Step 4: Implement VFX/audio**

Pool dirt/dust/rain/impact/milestone effects. Soundscape uses aggregate ambience/digging/rain/threat/milestone layers and existing semantic cues, with voice caps, cooldowns and captions/visual parity.

- [ ] **Step 5: Verify/commit**

`feat(ant): add ecosystem director weather vfx and audio`

---

### Task 8: Add explicit performance, stability and accessibility gates

**Files:**
- Create: `tests/phase3/ant-colony-render-budget.test.cjs`
- Create: `scripts/run-ant-colony-visual-evidence.cjs`
- Modify: `package.json` only if an Ant-specific script is required.
- Modify: Ant-specific workflow/CI hook only if necessary.

**Interfaces:**
- Consumes: public renderer/source and accelerated Ant Colony snapshots.
- Produces: bounded resource/performance report inputs and deterministic visual scenario seeds.

- [ ] **Step 1: RED resource-budget test**

Assert hard caps exist for particles, excavation transitions, camera queue, audio voices, DPR and LOD thresholds; no unbounded renderer history/listeners/timers are created on snapshot updates.

- [ ] **Step 2: Add instrumentation**

Expose a read-only `window.__ANT_RENDER_METRICS__` containing frame samples, active particle count, visible entity counts by LOD, draw-call/batch estimates and resource counts. Never expose private simulation state.

- [ ] **Step 3: Add long-session browser scenario**

Run an accelerated representative session and assert no monotonic growth of renderer-owned collections beyond declared caps; collect frame percentiles when browser timing is available.

- [ ] **Step 4: Accessibility/OBS checks**

Verify 1920×1080, 1280×720 and 640×360; reduced motion; high contrast; muted audio; clean feed; captions; observer toggle; resize cleanup.

- [ ] **Step 5: Verify/commit**

`perf(ant): bound large colony presentation`

---

### Task 9: Capture ten truthful visual scenarios and execute the three-pass quality loop

**Files:**
- Modify/create: Ant Colony Playwright visual test(s) under existing browser-test convention.
- Evidence output: `artifacts/ant-visual-rebuild/` and/or existing CI artifact directory.
- Update: `games/ai-ant-colony/VISUAL_ACCEPTANCE_REPORT.md`

**Interfaces:**
- Consumes: actual browser source served by `ant:stream`.
- Produces: real PNG captures and machine-readable scenario/performance metadata.

- [ ] **Step 1: Capture PASS 1**

Capture at minimum: overview, surface foraging, underground chamber activity, queen chamber, excavation, predator encounter, combat/defense, weather, day/night or seasonal variation, major milestone, plus one HUD-hidden screenshot.

- [ ] **Step 2: Critique PASS 1**

Record concrete defects in flatness, placeholder geometry, ant readability, HUD footprint, tunnel/chamber readability, repetitive camera, lighting, VFX and hierarchy. Convert each load-bearing finding into a failing test where mechanically testable.

- [ ] **Step 3: Fix and capture PASS 2**

Apply only evidence-backed fixes; run focused tests and browser capture again.

- [ ] **Step 4: Polish PASS 3**

Review animation, swarm flow, composition, tunnel edges, camera, light, sound, transitions, visual depth and performance. Fix remaining load-bearing findings and capture final evidence.

- [ ] **Step 5: Screenshot test**

With HUD hidden, reject the build if the screenshot still reads as dots/diagram/dashboard rather than a living ant ecosystem.

---

### Task 10: Documentation, exact-candidate regression verification and handoff

**Files:**
- Update: `games/ai-ant-colony/VISUAL_REBUILD_AUDIT.md`
- Create/update: `games/ai-ant-colony/VISUAL_ARCHITECTURE.md`
- Create/update: `games/ai-ant-colony/ART_DIRECTION.md`
- Create/update: `games/ai-ant-colony/ECOSYSTEM_PRESENTATION.md`
- Create/update: `games/ai-ant-colony/ANT_RENDERING_SYSTEM.md`
- Create/update: `games/ai-ant-colony/CAMERA_DIRECTOR.md`
- Create/update: `games/ai-ant-colony/VFX_AUDIO_SYSTEM.md`
- Create/update: `games/ai-ant-colony/PERFORMANCE_REPORT.md`
- Create/update: `games/ai-ant-colony/VISUAL_ACCEPTANCE_REPORT.md`

**Interfaces:**
- Produces truthful implementation/evidence record; no claims beyond measured scope.

- [ ] **Step 1: Run focused verification**

`npm run build`, `npm run test:ant:phase6`, `npm run ant:stream:self-test`, visual rebuild tests, browser scenarios and Ant long-session evidence.

- [ ] **Step 2: Run full catalogue regression**

Run the existing full CI workflow on the exact candidate. Inspect failed jobs rather than retrying until green.

- [ ] **Step 3: Isolation verification**

Compare branch to base and require zero changed paths under `games/eko-street-run/**`, `games/infinite-tower-climb/**` or other unrelated games.

- [ ] **Step 4: Complete acceptance matrix**

Mark every user checklist item PASS/PARTIAL/MISSING using links/run IDs/screenshots/metrics. Do not promote PARTIAL to COMPLETE.

- [ ] **Step 5: Final branch/PR handoff**

Use the finishing-a-development-branch workflow. Create a reviewable PR only after exact-candidate verification passes; include determinism, performance, browser evidence, rollback and remaining-risk sections.
