# THOUSAND: cast and stage implementation plan

> For agentic workers: use executing-plans and test-driven-development. Continue the user's authorized Gauntlet execution; do not merge the draft.

**Goal:** Improve the actual explorer/companion performance and the ten districts' playable-platform silhouettes without compromising safe landing or replay.

**Architecture:** Keep the existing Three.js scene, rigid-weight skeletal cast, immutable worker snapshots and fixed camera. Add bounded presentation-only character performance and district-specific structures below the unchanged contact surface; retain material batching. No new runtime dependency.

**Tech stack:** Three.js 0.186.0, TypeScript campaign, native JS, Node tests and Chromium/Playwright.

**Spec:** docs/superpowers/specs/2026-10-30-thousand-floors-gauntlet.md.

## Scope and decisions

The user delegates approach and decomposition. Alternatives considered: another overlay reskin (does not address cast/world gaps), replacing the full renderer (unnecessary risk), or improving visible cast and architectural forms within the existing runtime (chosen). No character likenesses or game assets from the references. No change to authority, checkpoints, route geometry or save formats.

Baseline source: 95bb6391b647e8b4ab64c15ef4f5aae67dd168f1, restored from its exact CI source/dependency artifact into an isolated container checkout. Worker-service read failed with offline tunnel; no native ultracode workflow tool is exposed. Implementer and review are sequential self-review, explicitly not independent fresh agents. The main benchmark cannot pass on this evidence alone.

## Global constraints

- ASTRO BOT Spring-Loaded Run and Rising Heat remain fixed references; Luigi's Mansion 3 and Returnal tower staging remain secondary.
- No changes to authoritative simulation, collision footprint, hazard state or persisted progress.
- Full contact rectangle stays at y=0; all new platform structure is strictly below it and inside its horizontal footprint.
- Character remains within existing conservative framing envelope; fingers/scarf/companion reset between states, and all procedural motion samples deterministically.
- Reduced motion removes ambient bob/flap/breathing but keeps distinct semantic poses.
- Added art uses a finite set of geometries/textures with explicit lifecycle; no timer, remote calls, or particle queue.

## Review focus

Look at jump-to-land resets, recovered-state stale poses, landing visibility in portrait, metallic readability in dark districts, and resource counts across ten districts. Passing tests are not a visual verdict. Fixed clip sources/timestamps are in reference-evidence.md; a new blind external study is not claimed.

## Task 1 — expressive complete cast

Files: public/ai-vs-1000-floors/character-performance.js (new pure pose modulation), character.js, scene.js; tests/foundation/thousand-floors-cast.test.cjs.
Interface: samplePerformance(action, time, reduced, motion) returns finite bounded gaze, breathing, finger, scarf, face and companion parameters. createCharacter API stays root/animate/dispose.
- [ ] Add failing tests: deterministic input, finite invalid-input fallback, action distinctions, reduced ambient motion, articulated digits/scarf/jaw/companion parts, no stale state on action changes, bounded geometry and disposal.
- [ ] Implement performance module, articulated glove digits, segmented scarf, facial expression, surface microdetail and semantic companion reactions. Feed look direction/reward age from existing snapshots only.
- [ ] Run focused tests, actual-game capture and inspect ordinary/jump/wait/landing/celebration poses. Fix findings before moving on.

## Task 2 — differentiated platform architecture

Files: public/ai-vs-1000-floors/platform-architecture.js (new), environment.js, static server allowlist; tests/foundation/thousand-floors-platform-art.test.cjs.
Interface: createPlatformArchitecture(platform, materials, districtIndex, variant) returns local-space Group below y=-.12. Source layout never mutated; materials remain palette-owned.
- [ ] Add failing tests: ten distinct geometry signatures, fixed footprint, below-contact bounds, finite vertex data, hard triangle budget, deterministic builds, missing/invalid district fallback, explicit server routes.
- [ ] Replace repeated understructure with bounded district-specific colonnades, ribs, bracing, root/astral/crown forms. Reuse palette materials and static batching.
- [ ] Run focused, campaign/camera and actual-game checks; inspect desktop/portrait and four districts. Confirm route arrows/hazards remain visible.

## Task 3 — evidence, iteration and integration

Files: tests/browser/thousand-floors.spec.cjs, scripts/capture-thousand-floors.cjs, docs/gauntlet/thousand-floors/ITERATION-7.md, PROGRESS.md, public/ai-vs-1000-floors/progress.json, evidence.
- [ ] Expand real-game coverage for Journey, modal shortcuts and clean-feed restore.
- [ ] Run npm test, npm run floors:build, focused test:floors and actual browser suite; record exact source and environment.
- [ ] Capture real worker-driven motion/stills; create separate labeled cast inspection material only if necessary (never substitute it for gameplay).
- [ ] Self-review specification then visual quality, fix material regressions, publish coherent commit to existing branch using expected-head compare-and-swap.
- [ ] Update live progress page with images, notes, test scope and open gaps. Do not claim benchmark victory, production readiness, independent review, or background execution.
