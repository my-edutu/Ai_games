# Tower transformation T02 — Sunken Ruins monumental sanctuary

**Branch:** codex/infinite-tower-climb-3d-gauntlet, draft PR #58. **Parent:** 4b30ec16892997eb42ec8721657a2987468546e0 (already includes concurrently completed G52 canyon vista work). **Status: initial source complete, exact-commit GPU and independent visual verdict pending.**

## Why this is a transformation sprint, not Gauntlet micro-fix #52

Viewed the actual source-pinned first-Ruins climbing image from G51 [Tower Ledge artifact 13081864500](https://github.com/my-edutu/Ai_games/actions/runs/41302747433/artifacts/13081864500) at 960×600 and 390×844, plus its individual real-tick frames. The protagonist remains small against a largely uninterrupted pylon wall, repetitive straight platform edges and a largely empty, pale background. The current frame technically meets contact and capture regressions but does not evoke the environmental scale or inhabited architecture of **Jusant**, or the striking moment-to-moment visual hierarchy of **ASTRO BOT — Rising Heat**. Two-tick foot corrections affecting hundreds of pixels do not change that experience.

This close-scale flagship complement to G52's geologic vistas addresses a major experience-level failure: *the tower still looks like an uninhabited block assembly rather than a vast climbable location*. The new Ruins sanctuary introduces genuine 3D through-arches of different heights/depths, weathered carved stone, recessed intrados, architectural keystones and corbels, attached vegetation and two physically positioned subdued cascade sheets. They reuse the existing floor-owned material/geometry-batching lifetime, retain shadow/draw budgets, and are visually behind authoritative 22.4–27.18 radius platforms. The source-gated close-scale environment remains Ruins; this does NOT claim the other four biomes are transformed.

## Test-first proof / implementation

RED: new source-bound art-safety tests failed **0/2** on the exact original source (missing hollow monumental arch primitive and missing runtime sanctuary landmarks).

GREEN on the exact local G51 source plus the sanctuary addition, before integrating the concurrently added canyon vista: **2/2** new, **12/12** combined new+existing world geometry, and **157/157 Tower phase-3 logical tests**. The merged branch version retains the vista and must pass its own post-commit CI before any merged-tree pass is claimed. `npm run build` PASS. `node scripts/serve-tower-stream.cjs --self-test` returned `ok:true`, authorityStable, privacy-safe, replay/recovery/restart observed. The existing world's 100-submission budget, 23.4 maximum non-ambient radius, 350k triangle budget, deterministic platform bounds, moving hazards and 15-floor exact-once resource retirement remain passing. Two-cascade geometry and plants are original programmatic art; original sourced texture and existing shader are reused; no protected commercial imagery is used.

No authoritative simulation, AI, combat hitboxes, collision, RNG, replay, real route geometry, payments, HUD text or game outcome changed. High/low quality and reduced-motion paths still use the same bounded scene, although native FPS remains unverified.

## Transformation acceptance is separate from test success

**Safety and technical scope:** PASS in local CPU tests. **Visible before/after quality:** PENDING actual new GPU capture; retain source-pinned G51 image as baseline. **Commercial and independent quality:** FAIL / OPEN. **Device FPS, accessible UI and long-run soak:** FAIL / OPEN. Local Chromium navigation to the running stream host returned `ERR_BLOCKED_BY_ADMINISTRATOR`; this is a *verification blocker*, not a browser PASS. Coding-worker tunnel disconnected (`NOT_FOUND`); fresh builder/critic and Ultracode unavailable. This is explicitly **SELF-REVIEW**, not independent approval.

For visual judgment, compare matching live source snapshots at 960×600/390×844 with all textures decoded, inspect the first authentic jump and full-speed climb/guardian sequences. Grade presence of meaningful architectural scale, attractive depth and material contrast, a readable hero/route, and freedom from clutter or washed-out lighting. A large pixel difference alone is insufficient. If the result remains prototype-like, mark TRANSFORMATION FAIL and revise the scene or build an authored GLB asset pipeline—not another decorative shim.

## Automatically suggested next transformation

After downloading and inspecting the exact-T01 GPU evidence, improve the **entire animated climb** as one coherent contact → pull → mantle → boot-load → stable landing sequence lasting across real consecutive authoritative states, not one knee frame; combine with camera staging and impact/ambience. Then judge normal-speed footage against official Jusant/ASTRO BOT and obtain intended-device FPS and stability proof. Keep this PR draft; no merge/force-push/deployment.

## Concurrency and review caution

A separate developer advanced PR #58 with a three-layer geologic canyon vista in `world.mjs` during this iteration. The sanctuary edit was explicitly re-applied onto that **newer head** rather than replacing its file or reverting its geometry, diagnostics, tests, or resource ownership. The sanctuary remains a foreground/background architectural layer independent of the far canyon. The merged output, CI resource envelope and actual visuals remain unverified at commit time. If the integrated image is cluttered or slow, the correct outcome is a FAIL and a larger art-direction revision, not a green contract masquerading as 90% quality.
