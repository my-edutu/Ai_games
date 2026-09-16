# AI Ant Colony 22-Skill Premium Improvement Sweep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current technically strong Ant Colony browser presentation into a reliable, premium living-world broadcast by resolving every concrete finding surfaced by the Eko 22-skill review while preserving deterministic simulation authority.

**Architecture:** Keep `games/ai-ant-colony/src/**` authoritative gameplay unchanged unless a later failing simulation test proves a gameplay defect. All visual improvements consume the existing privacy-safe public snapshot. Establish a shared browser render-contract first, then improve world anchoring/ecology, creature interaction/combat, camera continuity, spatial audio, and deterministic evidence capture. Every visual subsystem remains bounded and deterministic.

**Tech Stack:** TypeScript deterministic simulation, browser JavaScript, Canvas2D, WebGL2 instancing, Web Audio API, Playwright, Node test runner, GitHub Actions.

**Spec:** `games/ai-ant-colony/EKO_22_SKILL_REVIEW.md`

## Global Constraints

- `games/eko-street-run/**` is READ-ONLY.
- Do not make AI Ant Colony depend on unfinished Eko systems.
- Presentation may never mutate authoritative Ant Colony state.
- No `Math.random` in deterministic presentation systems.
- Viewer interaction remains bounded and cannot force terminal outcomes.
- New arrays/maps/particles/ambient organisms/shot history must have hard caps.
- Real browser screenshots are mandatory before visual acceptance.
- PARTIAL/PENDING items remain truthful until verified by CI/browser evidence.

---

### Task 1: Shared Render Metrics Contract and Browser Reliability

**Files:**
- Create: `public/ai-ant-colony/render-contract.js`
- Modify: `public/ai-ant-colony/index.html`
- Modify: `public/ai-ant-colony/entity-renderer.js`
- Modify: `public/ai-ant-colony/world-renderer.js`
- Modify: `public/ai-ant-colony/organic-presenter.js`
- Modify: `public/ai-ant-colony/director.js`
- Modify: `public/ai-ant-colony/app.js`
- Modify: `scripts/serve-ant-colony-stream.cjs`
- Test: `tests/phase3/ant-colony-premium-pass.test.cjs`

**Interfaces:**
- Produces: `window.AntRenderContract.ensureAntRenderMetrics()` returning a stable shared metrics object.
- Consumes: no gameplay authority; presentation-only global metrics.

- [ ] Verify the new premium test fails because `render-contract.js` does not exist and metrics initialization is order-dependent.
- [ ] Add `ensureAntRenderMetrics()` with initialized `frameSamples`, `effectFpsSamples`, LOD, particle, excavation, WebGL, DPR, shot, organic, ecology and combat fields.
- [ ] Load `render-contract.js` before every renderer/director script and serve it from the Ant stream host.
- [ ] Replace ad-hoc `window.__ANT_RENDER_METRICS__ ||= {}` initializers with the shared ensure function and preserve existing metrics rather than replacing them.
- [ ] Run focused phase-3 tests and browser desktop/performance tests; expect the previous `undefined.push` crash and zero-frame-sample failure to disappear.

### Task 2: World-Anchored Macro Nature and Living Surface Ecology

**Files:**
- Modify: `public/ai-ant-colony/organic-presenter.js`
- Test: `tests/phase3/ant-colony-premium-pass.test.cjs`
- Test: `tests/browser/ant-colony-stream.spec.cjs`

**Interfaces:**
- Produces: deterministic world-space surface stems, stones, leaf litter, foreground roots, ambient insects and rain/storm worms.
- Consumes: `snapshot.world`, `snapshot.environment`, camera transform only.

- [ ] Verify premium test fails because surface dressing uses viewport width instead of world coordinates.
- [ ] Add `worldSurfacePoint(snapshot, transform, worldX, yOffset)` and convert every surface decoration seed into `worldX = hash01(seed) * snapshot.world.width` before projection.
- [ ] Add `MAX_AMBIENT_INSECTS = 18`, `MAX_AMBIENT_WORMS = 8`, and `drawAmbientEcosystem()` with deterministic culling and reduced-motion behavior.
- [ ] Expose `ambientInsects` and `ambientWorms` render metrics; never mutate simulation state.
- [ ] Capture overview/weather screenshots and confirm vegetation remains attached to the terrain through camera changes.

### Task 3: Creature Interaction Animation and Swarm Combat Readability

**Files:**
- Modify: `public/ai-ant-colony/entity-renderer.js`
- Test: `tests/phase3/ant-colony-premium-pass.test.cjs`
- Test: `tests/browser/ant-colony-stream.spec.cjs`

**Interfaces:**
- Produces: `interactionPose(ant,snapshot,now)`, `drawInteractionDetails(...)`, `combatSlot(...)`, `predatorReaction(...)`, `drawCombatChoreography(...)`.
- Consumes: only current public ant/predator/task/event state.

- [ ] Verify premium test fails because near ants expose only gait plus carried objects and combat is a line between entities.
- [ ] Add deterministic task-specific near-ant poses for `fight`, `dig`, `carry`, `nurse`, `forage`, and bounded idle `groom`; add antenna sweep and contact-oriented foreleg/mandible changes.
- [ ] Add `MAX_COMBAT_CONTACTS` and deterministic radial contact slots around each predator.
- [ ] Replace long combat connector lines with bounded lunge/bite/contact cues and predator recoil derived from real fighters/recent hit events.
- [ ] Track interaction-pose and combat-contact metrics and keep all effects bounded.
- [ ] Capture combat/foraging/excavation/brood screenshots and reject the pass if intelligence is still invisible without HUD text.

### Task 4: Cinematic Camera Continuity

**Files:**
- Modify: `public/ai-ant-colony/director.js`
- Test: `tests/phase3/ant-colony-premium-pass.test.cjs`

**Interfaces:**
- Produces: bounded shot history, repetition penalty, lead-room adjustment, existing urgent-shot precedence.
- Consumes: existing shot candidates and public snapshot.

- [ ] Verify premium test fails because there is no shot history or continuity grammar.
- [ ] Add `MAX_SHOT_HISTORY`, bounded `shotHistory`, `rememberShot()`, and `continuityPenalty()`.
- [ ] Add `leadRoom()` so moving/causal subjects have contextual space while safe world bounds remain enforced.
- [ ] Never delay queen danger or other urgent crisis shots for stylistic continuity.
- [ ] Verify reduced motion still caps zoom/motion and repeated overview/predator oscillation is suppressed.

### Task 5: Surface/Underground Spatial Audio

**Files:**
- Modify: `public/ai-ant-colony/soundscape.js`
- Test: `tests/phase3/ant-colony-premium-pass.test.cjs`

**Interfaces:**
- Produces: `acousticZone(snapshot)` and `spatialMix(snapshot)` with bounded filter/gain transitions.
- Consumes: current documentary shot plus public environment state.

- [ ] Verify premium test fails because ambience has no explicit acoustic-space model.
- [ ] Add a Biquad low-pass/master filter chain without increasing `MAX_AUDIO_VOICES=6`.
- [ ] Map brood/queen/excavation shots toward muffled underground acoustics and foraging/predator/surface views toward brighter surface acoustics.
- [ ] Keep semantic event cues, mute behavior, captions, voice stealing and visibility suspension intact.
- [ ] Expose `acousticZone` in render metrics for evidence.

### Task 6: Authoritative Scenario Evidence Reliability

**Files:**
- Modify: `scripts/serve-ant-colony-stream.cjs`
- Modify: `tests/browser/ant-colony-stream.spec.cjs` only if the harness contract requires target identity metadata, not to weaken assertions.

**Interfaces:**
- Produces: evidence-mode-only deterministic target-isolated scenario search; normal stream mode continues returning 404 for evidence routes.
- Consumes: real `AntColonyRuntime`, `createAntRenderSnapshot`, existing evidence predicates.

- [ ] Reproduce the existing scenario `.matched === false` failure.
- [ ] Search each target from a fresh deterministic target-specific Ant runtime with bounded attempts/ticks.
- [ ] When a target matches, make that genuine runtime/session the active evidence session so subsequent browser polling sees the same state.
- [ ] Never fabricate snapshots or directly mutate gameplay state to create a target.
- [ ] Verify all eight scenario captures are generated from authoritative states.

### Task 7: 22-Skill Review, Evidence, Docs and Isolation Gate

**Files:**
- Modify: `games/ai-ant-colony/EKO_22_SKILL_REVIEW.md`
- Modify: `games/ai-ant-colony/VISUAL_ACCEPTANCE_REPORT.md`
- Modify: `games/ai-ant-colony/PERFORMANCE_REPORT.md`
- Modify other existing Ant presentation docs only when evidence materially changes them.

**Interfaces:**
- Consumes: CI results, Playwright performance JSON, scenario manifest and real screenshots.
- Produces: truthful per-skill findings/status and release blockers.

- [ ] Re-run all 22 Eko skills and record at least one concrete Ant-specific observation for each skill.
- [ ] Run full build/tests, Ant stream self-test, determinism scan, 5,000-tick soak, Phase 5/6 evidence and browser tests.
- [ ] Download and inspect real desktop, phone, clean-feed, brood, foraging, excavation, predator, combat, night and weather screenshots.
- [ ] Continue implementation if any skill still finds a concrete high-impact defect that can be fixed without violating project scope.
- [ ] Compare branch changes against the pre-sweep base and prove no `games/eko-street-run/**` or unrelated-game file was modified.
- [ ] Use `superpowers:verification-before-completion` before any COMPLETE claim and separate VERIFIED COMPLETE, PARTIAL and external/unverified release gates.
