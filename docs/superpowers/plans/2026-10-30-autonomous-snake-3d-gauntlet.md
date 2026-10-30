# Autonomous Snake 3D Gauntlet Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for scoped implementation and independent review. The user's Gauntlet instruction overrides fixed review-round limits and additional approval gates.

**Goal:** Deliver a fully 3D autonomous Snake presentation with inspectable improvement evidence against Snake Pass.

**Architecture:** Keep existing deterministic snapshot endpoint and fixed-step simulation. A Three.js client composes separate character/environment modules and a modern broadcast shell, with a 2D fallback and bounded semantic audio. The existing server serves only explicitly allowed modules and pinned vendor files.

**Tech Stack:** Existing Node/TypeScript simulation, Three.js 0.186.0, browser ES modules, CSS, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-30-autonomous-snake-3d-gauntlet.md`

## Global Constraints

- Preserve authoritative simulation, snapshot schema, replay and influence behavior.
- Only modify Snake-owned presentation, its server routes, focused tests and Gauntlet evidence/docs.
- Shared files have a single owner; parallel builders own disjoint modules.
- Compare real rendered artifacts; record failures and gaps honestly. No fabricated production claims.
- Keep all dependencies local and pinned; no remote script or image requests in gameplay.

## Review Focus

1. Teleport and restart interpolation: no geometry bridges across distant cells.
2. Rendering failure: safe fallback visible while simulation ticks continue.
3. Mobile aspect ratios: no overflow; head, food, hazards and main metrics remain readable.
4. Long-running lifecycle: geometry, voices and event effects remain bounded after restart.
5. Controls: reduced motion, muted audio, view choice and clean feed preserve gameplay and accessibility.

## Tasks and ownership

### Task 1: Character craft

Owner: character builder. Create `public/snake-stream/serpent.mjs` only.

Interface: `createSerpent(THREE)` returns `{ group, update(paths, options), dispose(), stats() }`. `paths` is an array of contiguous arrays of `{x,z}` points ordered head to tail; all coordinates are in board world units. `options` includes `{time, delta, reducedMotion, danger, eating, direction:{x,z}}`. First path starts at the head. Body tube radius roughly 0.32 grid units; head 0.8 units long, top at roughly y=0.85; body rests at y=0.40. It must handle initial short snakes, growth, portal-split bodies and restart without per-frame resource leaks.

- [ ] Create an expressive original finished snake using smooth anatomy, continuous curved body, material variation, eyes, mouth, tongue and bounded idle/reactive animation.
- [ ] Use independent visual review of actual character captures and fix the largest gap.

### Task 2: Scene craft

Owner: environment builder. Create `public/snake-stream/world.mjs` only.

Interface: `createWorld(THREE, {width,height})` returns `{group, update(snapshot, options), dispose(), stats()}`. Board cell centers are `x = cell % width - (width-1)/2`, `z = floor(cell/width) - (height-1)/2`, board top is y=0. The root owns scene lights, renderer and camera. `options` includes `{time,delta,reducedMotion}`. The world owns board, scenery, food, hazards, obstacles and portals; it never owns snake/camera/authority. Rebuild static world only on dimensions change; update entity positions from snapshot. Distinct hazard active/telegraph shapes and paired portals must remain readable.

- [ ] Build a richly authored verdant ruins diorama, clear field, layered terrain, original plant forms, aged stone details, water/atmosphere and readable gameplay props.
- [ ] Inspect actual wide/mobile captures and iterate under an independent critic.

### Task 3: Broadcast shell

Owner: HUD builder. Own `public/snake-stream/index.html`, `public/snake-stream/styles.css` and `public/snake-stream/ux-v2.css` only. Preserve existing IDs and data-control attributes for compatibility. Use `app.js` as a module; add view control `data-control="camera"` and a progress-page link. No new external fonts or images. Main game remains the dominant view.

- [ ] Create a distinct finished broadcast layout with compact hierarchy, responsive behavior, meaningful loading/result/recovery and keyboard-accessible controls.
- [ ] Preserve testable existing controls and primary/secondary/record/intent/caption IDs.
- [ ] Inspect desktop, landscape and portrait captures under an independent critic.

### Task 4: Runtime integration and evidence

Owner: lead. Own `app.js`, `renderer.mjs`, pure interpolation module `motion.mjs`, audio/fallback modules, server routes, tests and progress page.

- [ ] Capture unchanged baseline and confirm existing simulation tests.
- [ ] Write focused failing tests for continuity, restart and route-serving behavior before implementation.
- [ ] Integrate WebGL, character/environment factories, bounded render state, camera and fallback.
- [ ] Serve pinned Three.js modules through explicit routes; retain self-test integrity guarantees.
- [ ] Build live `/progress` page with timestamps, captures, critic verdicts and open gaps.
- [ ] Validate in real browser: normal/late runs, restart, mobile sizes, controls, failure/reconnect, frame/resource measurements.
- [ ] Dispatch fresh critics against actual outputs, feed gaps to builders, repeat, and obtain whole-game/code review.
- [ ] Commit and publish a reviewable feature branch/PR with truthful evidence and remaining limitations.
