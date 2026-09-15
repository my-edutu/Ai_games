# AI Maze Escape 2.5D Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild AI Maze Escape as a real WebGL2 2.5D autonomous exploration broadcast without changing authoritative game outcomes.

**Architecture:** Preserve `games/ai-maze-escape/src/**` as authority. Extend `public/ai-maze-escape/**` so the existing sanitized snapshot is adapted into deterministic 3D presentation geometry, camera, lighting/fog and compact broadcast UI.

**Tech Stack:** Node.js repository tests, browser JavaScript, WebGL2, CSS, Playwright/Chromium CI.

**Spec:** `docs/superpowers/specs/2026-09-15-ai-maze-2-5d-rebuild-design.md`

## Global Constraints
- Work only on AI Maze Escape and maze-specific tests/docs.
- `games/eko-street-run/**` is read-only.
- Infinite Tower Climb and AI Ant Colony are read-only.
- Do not add ambient randomness to authoritative or presentation state.
- Do not expose hidden maze state to the browser.
- Preserve current stream host, accessibility controls, clean-feed mode and responsive browser-source behavior.
- Do not claim completion without CI and real browser screenshot evidence.

---

### Task 1: Lock the visual contract
**Files:**
- Create: `tests/phase3/maze-2-5d-visual-contract.test.cjs`
- Modify: none

**Interfaces:**
- Consumes: current public frontend files.
- Produces: test contract requiring WebGL2, physical world renderer, explorer/fog/interactables, deterministic presentation and 2.5D DOM marker.

- [x] Write failing tests for the 2.5D contract.
- [x] Push branch and verify the new tests fail against the flat Canvas renderer while prior tests pass.
- [x] Preserve the failing CI evidence.

### Task 2: Replace flat grid rendering with real 3D world geometry
**Files:**
- Modify: `public/ai-maze-escape/app.js`
- Test: `tests/phase3/maze-2-5d-visual-contract.test.cjs`

**Interfaces:**
- Consumes: `frame.snapshot`, `frame.camera`, `frame.audio` from `/maze/state`.
- Produces: `MazeWorldRenderer`, `buildMazeWorld`, `drawWallPrism`, physical world geometry and `window.__MAZE_RENDER_STATS__`.

- [x] Request a WebGL2 context with depth testing.
- [x] Add perspective/look-at matrix math and world projection.
- [x] Convert public maze cells into floor and wall prisms.
- [x] Add deterministic hybrid ruin/facility room archetypes and props.
- [x] Keep topology and presentation authority separated.
- [ ] Run CI and verify the visual contract is green.

### Task 3: Add character, interactables, fog and camera
**Files:**
- Modify: `public/ai-maze-escape/app.js`

**Interfaces:**
- Consumes: public explorer/current cell, doors, keys, traps, threats, exit, planned route and confidence.
- Produces: `drawExplorer`, `drawDoor`, `drawKey`, `drawTrap`, `drawExit`, `drawFogVolume`, `cameraLookAhead`.

- [x] Replace explorer dot with multipart 3D character.
- [x] Add physical doors, keys, traps, threats and exit structure.
- [x] Represent unknown public frontiers with fog volumes.
- [x] Add smooth camera tracking and public-route look-ahead.
- [x] Add shader lighting and distance fog.
- [ ] Verify browser render has no page/console errors.

### Task 4: Rebuild broadcast composition
**Files:**
- Modify: `public/ai-maze-escape/index.html`
- Modify: `public/ai-maze-escape/ux-v2.css`

**Interfaces:**
- Consumes: existing HUD element IDs used by `app.js` and browser tests.
- Produces: world-dominant 2.5D stage, compact HUD and clean-feed compatibility.

- [x] Add `data-world-mode="2.5d"` marker and 2.5D accessibility wording.
- [x] Reduce HUD width to approximately 12.5vw / 205–242px desktop.
- [x] Preserve responsive landscape/portrait layouts and reduced-motion rules.
- [x] Preserve clean-feed mode.
- [ ] Verify 1920×1080, 844×390 and 1280×720 clean-feed browser captures.

### Task 5: Visual evidence and three-pass quality loop
**Files:**
- Update: `games/ai-maze-escape/VISUAL_ACCEPTANCE_REPORT.md`
- Update: `games/ai-maze-escape/PERFORMANCE_REPORT.md`

**Interfaces:**
- Consumes: CI browser artifacts and renderer stats.
- Produces: evidence-backed acceptance matrix and critique/fix record.

- [ ] Download actual CI browser screenshots.
- [ ] Review normal desktop, phone landscape and clean-feed output.
- [ ] Critique architecture depth, character readability, fog, lighting, camera, HUD and repetition.
- [ ] Apply second-pass fixes.
- [ ] Re-run CI and inspect fresh screenshots.
- [ ] Apply final polish if evidence still looks flat/debug-like.

### Task 6: Final isolation and review
**Files:**
- Compare branch against `main`.

- [ ] Verify no Eko, Tower or Ant Colony files changed.
- [ ] Run final CI on branch head.
- [ ] Update acceptance/performance reports with actual evidence.
- [ ] Request code review and open a PR to `main` only after verification.
