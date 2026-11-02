# Autonomous Snake — Transformation-Focused Gauntlet Execution Plan

> **For agentic workers:** implement substantial **experience milestones** on existing draft PR #52, not a sequence of micro-success claims. Read the [new acceptance charter](../../reviews/snake-gauntlet/TRANSFORMATION_GAUNTLET.md) and existing approved [3D spec](../specs/2026-10-30-autonomous-snake-3d-gauntlet.md) first. Use focused TDD and genuine independent visual critique when possible. Keep a milestone active across multiple sessions until it visibly transforms the **whole scene**.

**Goal:** a living, rich, cohesive 3D Autonomous Snake game whose world, hero, animation, materials, game feel and smoothness demonstrate a clear qualitative leap in actual runtime gameplay.

**Architecture:** Keep all deterministic Node/TypeScript simulation and immutable /snapshot authority; the existing Three.js 0.186.0 ES module presentation owns only the 3D world, serpent, renderer, cameras, audio, safe fallbacks and responsive HUD. Coordinate high-level world, character, material, light and presentation changes into a true vertical milestone; assess the integrated render, not only isolated unit models.

**Tech Stack:** existing Node/TypeScript, Three.js, WebGL2, Playwright, CSS and local procedural assets. No external unapproved copyrighted game assets.

**Spec:** `docs/reviews/snake-gauntlet/TRANSFORMATION_GAUNTLET.md`; original behavioral constraints `docs/superpowers/specs/2026-10-30-autonomous-snake-3d-gauntlet.md`.

## Global constraints

- Modify existing draft PR #52 branch only; no merge or deployment.
- Keep authoritative fixed-step AI/simulation, scoring, seed/replay, private information boundaries and snapshot schema unchanged.
- Preserve portal discontinuity, fruit, hazards, goal, accessibility, reduced motion, audio mute, recovery and connected/2D fallback.
- Existing desktop acceptance gate **≥17 actual GPU-render submissions** in the original measurement interval remains unchanged; on supported documented real hardware seek sustained ≥30 delivered FPS with p95 evidence.
- Preserve 1080p composition and legible phone portrait/landscape. Never substitute generated mockups for actual current browser frames.
- Compare all meaningful art changes against **real** latest whole-scene baseline and official Snake Pass, with ASTRO BOT secondary. Independent critics only if genuine tools are connected.
- Report failures and incomplete milestones faithfully. A green Node suite is a regression gate, not a visual achievement.

## Review focus

Real autoplay stream with 40+ length body/portal fragments; unusual aspect ratios; active danger near fruit; close-up camera crossing environment edges; fallback/reconnect during animation; low-end GPU and resource soak. Preserve scene truth and readable consequences in every case.

## T0 — Establish the current full-game before baseline

**Files:** `public/snake-stream/progress/status.json`, `docs/reviews/snake-gauntlet/TRANSFORMATION_GAUNTLET.md`, authentic unretouched evidence under the existing progress/evidence convention. Tests and capture fixtures live in `tests/browser/snake*.spec.cjs`.

- [ ] Obtain one fixed real game seed/snapshot with meaningful path, food, hazard, portal and grown snake where possible. Do not fake events. Record full 1920×1080 board overview, character follow/detail, 390×844 phone and 45–90s actual gameplay, including result/restart in a separate recorded real scenario if necessary.
- [ ] Save exact source SHA, rendering buffer, actual submitted/real-device frame cadence, GPU p50/p95, assets/geometry and direct/overview budgets; compare to official reference at similar framing.
- [ ] Run a fresh independent whole-game critic with anonymized current and reference media if available. Record baseline 0–5 rubric with concrete biggest environmental/hero/motion/material/UX defects. Mark `BASELINE_LOCKED` only after the evidence is actually retrievable.

## T1 — Rebuild a distinctly richer whole garden, first hero vertical slice

**Files:** `public/snake-stream/world.mjs` plus focused subordinate environment/material modules if justified, `renderer.mjs` for art-directed lighting only as needed, `camera.mjs` for honest scene framing and relevant scene/browser tests.

- [ ] Write a concise shot-by-shot stage brief for one complete garden sector: foreground mossy ruins and worn terrain, mid-ground differentiated vegetation/architecture and readable objective, distant natural coastline/forest/water, cohesive warm/cool light and atmosphere. Reuse no copyrighted textures or models.
- [ ] Implement the full integrated shot across 3D world geometry and materials (not an isolated decorative rock). Preserve the *exact playable cell positions, hazards, fruit, portal timing and obstacle data*. Add focused failing geometry/material/lifecycle/legibility tests before code.
- [ ] Capture real WebGL BEFORE/AFTER identical public snapshots at overview, detail and portrait. Critic must be able to explain in plain language why the *whole scene* is substantially better; reject and continue T1 if only a tiny texture patch or near-identical scene.
- [ ] Measure unchanged full scene performance, memory and resource counts. Integrate necessary rendering architecture changes so new scene does not hide the performance defect.

## T2 — Replace the incomplete hero look with cohesive anatomy and expressive movement

**Files:** `serpent.mjs`, `motion.mjs`, camera coordination and model+browser tests.

- [ ] Inspect real motion frames; produce an animation sheet for idle, acceleration/turn, danger attention, anticipation/contact/growth, portal separation, result/restart and reduced-motion counterpart.
- [ ] Build coherent head/eye/jaw/neck/body/tail transitions, meaningful banking/compression/follow-through, grounded contact and accurate mouth/eating behavior; add articulation/pose tests before code.
- [ ] Show two comparable **real** multi-second character videos and full-scene gameplay clips. Reject any pass that hides seams in a close-up or sacrifices full-board comprehension.
- [ ] Verify no authoritative path mutation, phantom portal bridges, unbounded buffers, GL errors or LOD visual popping; evaluate frame cost together with T1 scene.

## T3 — Transform event readability and cinematic spectator experience

**Files:** `app.js`, `view-copy.mjs`, `camera.mjs`, local audio, accessible HUD CSS and relevant tests.

- [ ] Build semantically truthful collection, near miss, record/result/restart and recovery choreography with clear sense of time and action; preserve public-only AI intent, not privileged future route.
- [ ] Ensure goal, protagonist, food, hazards and milestone stay understandable within ten seconds at 1080p and phone; camera transitions preserve exact full-board overview access and no motion-sickness oscillation.
- [ ] Run actual seeded live scenarios and record before/after footage plus mute/reduced-motion/clean-feed/2D-fallback checks; do not claim success from UI mockups.

## T4 — Integrate and qualify the substantially transformed game

**Files:** performance-critical `renderer.mjs` / `world.mjs` / `serpent.mjs`, test fixtures, docs/progress.

- [ ] Profile the actual complete T1–T3 scene with GPU/CPU/composition splits. Re-architect dominant full-frame costs without dropping essential 3D geometry, art or information; document real-device reference setup.
- [ ] Pass at least three independent existing strict ≥17-submission samples, all functional browser checks and full catalogue regression, with a repeatable target-hardware sustained ≥30 displayed FPS and p95/budget evidence (where target hardware exists). No manipulating tests or counting RAF callbacks.
- [ ] Perform resource/recovery/restart soak, deterministic replay integrity and sustained livestream checks.
- [ ] Run fresh whole-game, blind reference-based visual and motion critiques across all four pillars. If the game doesn't look/feel/play obviously better, return to T1/T2/T3 rather than declaring the Gauntlet complete.
- [ ] Only after evidence passes all exit criteria, mark `GAUNTLET ACHIEVED`. Otherwise keep the draft open, link evidence, note the largest remaining full-scene defect and continue.

## Milestone reporting contract

Each build session updates **one continuing transformation milestone** (status `BUILDING`, `VISUAL_REVIEW`, `PROVISIONAL_PERFORMANCE`, `REJECTED`, `ACCEPTED`) with exact commits and before/after footage. Small code/test fixes are nested work and carry **no victory language**. The outcome metric is coherent experiential transformation, not number of Gauntlet rounds, commit count, test count, GPU draws or changed pixels.

**Current initial state:** T0 not yet frozen as a coordinated matched package; T1 is the next production transformation and shall integrate believable environment+materials instead of another single-object texture change. The current R56 source had a failed desktop strict test (12 submissions over 1001.8ms; required 17). This remains a blocker to final acceptance. Do not merge or deploy.
