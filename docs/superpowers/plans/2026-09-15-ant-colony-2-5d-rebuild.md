# AI Ant Colony 2.5D Living World Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing deterministic Ant Colony browser presentation into a living 2.5D surface/underground ecosystem while preserving simulation authority, viewer-integrity rules, persistence, and long-session behavior.

**Architecture:** Keep `games/ai-ant-colony/src/**` authoritative. Extend only the downstream public presentation contract where necessary. The browser renderer becomes a layered world renderer with deterministic presentation-derived animation, semantic camera direction, bounded VFX/audio, LOD, compact HUD, and scenario evidence. No visual system may mutate simulation state.

**Tech Stack:** TypeScript 5.8, Node 22, existing fixed-step Ant simulation, HTML/CSS/Canvas 2D presentation (upgrade in-place first to minimize dependency risk), Playwright browser verification.

**Spec:** `games/ai-ant-colony/VISUAL_REBUILD_AUDIT.md` plus the user-provided 43-section implementation brief.

## Global Constraints

- Only Ant Colony-specific paths may change: `games/ai-ant-colony/**`, `public/ai-ant-colony/**`, Ant-specific tests/scripts/evidence, and this plan.
- `games/eko-street-run/**` is read-only.
- Infinite Tower Climb remains untouched.
- Simulation state remains authoritative and deterministic.
- Presentation randomness must be derived from stable IDs/tick/state; it must never alter simulation outcomes.
- Viewer influence must remain bounded and non-guaranteeing.
- Target 90% living world / 10% informational UI.
- No fabricated screenshots or completion claims.

---

### Task 1: Presentation-world foundation

**Files:**
- Modify: `public/ai-ant-colony/app.js`
- Modify: `public/ai-ant-colony/styles.css`
- Test: `tests/phase3/ant-colony-browser.test.cjs` or nearest existing Ant browser contract test

**Interfaces:**
- Consumes immutable public snapshot currently assigned to `window.__ANT_PUBLIC_STATE__`.
- Produces deterministic helpers for day-phase, soil strata, role silhouette, motion heading, LOD and bounded environmental particles.

- [ ] Add tests that assert the browser bundle contains explicit living-world presentation primitives and does not write to authoritative state.
- [ ] Verify tests fail against the pre-rebuild renderer.
- [ ] Implement layered sky/surface/soil/deep-earth rendering, strata, roots, stones, moisture and depth vignette.
- [ ] Add stable day/night/season palette derivation from existing environment state without changing simulation.
- [ ] Run Ant browser/unit tests and build.
- [ ] Commit `feat(ant): establish 2.5d ecosystem renderer`.

### Task 2: Ant, queen and brood rendering

**Files:**
- Modify: `public/ai-ant-colony/app.js`
- Test: Ant presentation/browser tests

**Interfaces:**
- Consumes `snapshot.ants`, `snapshot.queen`, `snapshot.colony.brood`, world geometry and tick.
- Produces natural ant silhouettes with six legs, antennae, role morphology, deterministic heading/walk cycle, near/mid/far LOD; in-world queen and brood-stage presentation.

- [ ] Add failing assertions for six-legged/antenna morphology, role-dependent sizing, queen attendants and brood-stage visuals.
- [ ] Implement deterministic previous-position heading cache and bounded gait animation.
- [ ] Implement role morphology without arcade color coding as the primary cue.
- [ ] Implement queen breathing/egg cluster/attendant staging and danger emphasis.
- [ ] Implement egg/larva/pupa visual stages derived from brood count/tick where stage counts are unavailable, clearly presentation-only.
- [ ] Run tests/build and commit `feat(ant): add animated ant queen and brood rendering`.

### Task 3: Excavation, chambers and foraging storytelling

**Files:**
- Modify: `public/ai-ant-colony/app.js`
- Test: Ant presentation/browser tests

**Interfaces:**
- Consumes tile mutations, dig tasks, carried food, food field, pheromone arrays and recent events.
- Produces interpolated dig edges, dirt/dust particles, chamber identity, carried food sprites and contextual pheromone routes.

- [ ] Add failing tests for excavation VFX, chamber presentation and contextual pheromone mode.
- [ ] Implement bounded active-digger dust and dirt-carry behavior without inventing authoritative dig outcomes.
- [ ] Infer chamber presentation zones from nest geometry and authoritative occupancy; never write chamber types back into simulation.
- [ ] Improve food-source rendering and carried-food choreography.
- [ ] Replace permanent pheromone-dot blanket with contextual trails based on camera/event context plus optional observer mode.
- [ ] Run tests/build and commit `feat(ant): visualize excavation chambers and foraging`.

### Task 4: Surface ecosystem, predators, weather and combat

**Files:**
- Modify: `public/ai-ant-colony/app.js`
- Test: Ant presentation/browser tests

**Interfaces:**
- Consumes authoritative predators, threat, weather, season, events and surface food/water.
- Produces biome dressing derived from world seed/state, predator silhouettes, wet/dry/frost presentation, defensive staging and restrained combat effects.

- [ ] Add failing tests for predator-specific silhouettes, weather material response and threat behavior cues.
- [ ] Implement stable vegetation/debris/roots/stones based on cell hash so decorations never affect simulation.
- [ ] Implement spider/beetle visual distinction, legs, health/danger reactions and contact effects.
- [ ] Implement rain puddle/wet-soil, heat shimmer/dry-soil, cold/frost and seasonal vegetation/lighting changes.
- [ ] Implement bounded defense/combat dust/impact/death presentation from authoritative proximity/events.
- [ ] Run tests/build and commit `feat(ant): add predators weather and defense presentation`.

### Task 5: Documentary camera, event director and compact HUD

**Files:**
- Modify: `public/ai-ant-colony/app.js`
- Modify: `public/ai-ant-colony/styles.css`
- Modify: `public/ai-ant-colony/ux-v2.css` if active
- Test: Ant browser tests

**Interfaces:**
- Consumes semantic camera state and recent events.
- Produces bounded shot queue, dwell/cooldown rules, eased framing and a compact broadcast overlay with optional observer panel.

- [ ] Add failing tests for event priorities, shot dwell/cooldown and HUD world-area ratio classes.
- [ ] Implement documentary shot selection for queen danger, predator, excavation, brood, food discovery, chamber completion and milestones.
- [ ] Smooth pan/zoom and avoid constant random motion.
- [ ] Collapse permanent sidebars into compact top/bottom overlays; preserve clean feed and accessibility modes.
- [ ] Run browser tests/build and commit `feat(ant): implement ecosystem camera director and compact hud`.

### Task 6: Audio/VFX, scalability and stability

**Files:**
- Modify: `public/ai-ant-colony/app.js`
- Modify: Ant presentation health/performance code only if contract extension is required
- Test: Ant Phase 5/6 and browser tests

**Interfaces:**
- Consumes existing semantic audio cues and world activity.
- Produces aggregate ambience layers, bounded voices/particles, LOD/culling instrumentation and no-unbounded-growth guarantees.

- [ ] Add failing tests for bounded arrays/pools and LOD thresholds.
- [ ] Implement aggregate rain/wind/dig/threat ambience with existing WebAudio primitives; no per-ant clicking.
- [ ] Add near/mid/far ant LOD and offscreen culling without deleting simulation entities.
- [ ] Add renderer metrics and caps for effects/particles/voices.
- [ ] Run Ant Phase 1–6 tests, build and long-run validation; commit `perf(ant): optimize living world renderer`.

### Task 7: Browser evidence and three-pass quality loop

**Files:**
- Modify/Create: Ant-specific Playwright scenario/evidence script(s)
- Create: `games/ai-ant-colony/evidence/visual-rebuild/**` generated only by real browser execution
- Create/update: `games/ai-ant-colony/VISUAL_ARCHITECTURE.md`
- Create/update: `games/ai-ant-colony/ART_DIRECTION.md`
- Create/update: `games/ai-ant-colony/ECOSYSTEM_PRESENTATION.md`
- Create/update: `games/ai-ant-colony/ANT_RENDERING_SYSTEM.md`
- Create/update: `games/ai-ant-colony/CAMERA_DIRECTOR.md`
- Create/update: `games/ai-ant-colony/VFX_AUDIO_SYSTEM.md`
- Create/update: `games/ai-ant-colony/PERFORMANCE_REPORT.md`
- Create/update: `games/ai-ant-colony/VISUAL_ACCEPTANCE_REPORT.md`

**Interfaces:**
- Consumes running Ant stream view and deterministic/synthetic-in-test public snapshots only through existing test harnesses.
- Produces ten required real screenshots and truthful acceptance evidence.

- [ ] Capture baseline before image from untouched renderer if not already produced by CI.
- [ ] Capture overview, foraging, underground chamber, queen, excavation, predator, combat/defense, weather, day/night/season and milestone screenshots.
- [ ] Perform Pass 2 critique against flatness, placeholders, dashboard dominance, readability and AI-UI feel; fix concrete issues and recapture.
- [ ] Perform Pass 3 polish for movement, depth, lighting, VFX, transitions, audio and performance; recapture.
- [ ] Run full Ant test matrix, build, browser verification and long-session validation.
- [ ] Verify git diff contains no Eko or Infinite Tower files.
- [ ] Update acceptance checklist with COMPLETE/PARTIAL/MISSING backed only by evidence.
- [ ] Commit `test(ant): add visual ecosystem verification`.
