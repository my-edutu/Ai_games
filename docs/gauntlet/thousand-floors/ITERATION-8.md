# Game 4 — Iteration 8: authored paving and gameplay-scale material finish

31 October 2026. Continues the existing PR #55 and **the unchanged fixed ASTRO BOT reference**. Original campaign, authoritative route collision, 43-bone cast, saves and recorded benchmark remain unchanged. No architectural replatforming or third-party reference assets.

## Real observed baseline and first build

The actual iteration-7 screenshots showed all ten districts using a similar clean, nearly white square-tile landing top, even after distinct under-platform supports. The explorer was small and distant architecture remained blocky. This iteration targets landing identity first, as a clearly independently judgeable gap.

**Source 480ed03 (build 1):** A new purely visual `platform-surface.js` adds ten named motifs: garden filigree, water currents, copper mechanisms, frost facets, coral whorls, canopy veins, foundry hatches, surveyor dials, astral stars and crown sunbursts. Each mesh fits the authoritative platform width/depth and uses the existing palette materials and static batches. No elevation change to the gameplay surface, new path, modeled support, authoritative event or extra texture allocation.

Focused checks after the build: **48/48 passed**. The [actual-game WebGL runner](https://github.com/my-edutu/Ai_games/actions/runs/41171538178) completed successfully, captured four desktop districts and portrait, and retained the [actual capture bundle](https://github.com/my-edutu/Ai_games/actions/runs/41171538178/artifacts/13031328311) for seven days. The real floor-006 shot shows framed inlays and motifs, while the center and next landing remain readable. The reviewer is the author, not an independent critic.

### Largest returned gap

The colored inlays improved the landing identity but the remaining flagstone was still a rigid bright white 4x4 grid, inconsistent with the surrounding worn architecture. The character and platform geometry also remain more primitive than the official ASTRO BOT bar. The visual self-critic returned the repeated tile surface for another targeted build, without changing the benchmark.

## Build 2: authored tile grammar and worn material response

**Source 61ba5ec:** `materials.js` adds ten analytically different paving seam topologies rather than recoloring the same grid. Garden and canopy masonry warp; aqueduct, copperworks, foundry and crown use different courses; frost tilts its joint network; coral curves its seams; observatory uses a dial; astral uses diagonals. Each stone gets deterministic bounded patina, incised darker grout and corresponding bump/roughness channels. This reuses the existing `tile.map` and `tile.bumpMap` rather than allocating further textures or changing simulation RNG.

Fresh targeted checks: **50/50 Game 4 Node tests passed**, including two new deterministic topology/contrast tests; `npm run build`, `npm run floors:build` and `git diff --check` passed. A texture-only diagnostic sheet showed the patterns but is **not actual game evidence**. The exact-source workflow is [here](https://github.com/my-edutu/Ai_games/actions/runs/41172411299); the exact-source run **completed successfully**, with 50/50 focused Node and 8/8 real Chromium checks. [Final actual WebGL captures](https://github.com/my-edutu/Ai_games/actions/runs/41172411299/artifacts/13031476963) cover floor 006, 102, 403 and 902 at 1280×720 plus floor 006 portrait at 390×844. The final screenshot has visible darker, less uniform masonry seams and distinct pad motifs. These are actual WebGL game captures, not a composited concept image. Error arrays are empty. A software-renderer max frame gap reached 2,483ms, not a hardware FPS result.

## Preservation and limitations

- No change to render snapshot, fixed-step simulation, worker save schema, collision geometry, hazards, rewards or replay semantics.
- Ten bounded inlay types; no bridges falsely implying walkable traversal. Their center remains free for route arrows/hazards and key character actions.
- Unmodified follow camera protects the previously verified next-landing envelope, but leaves the explorer small in some scenes. The review gap remains.
- Failed/incomplete checks: the local full-catalogue `npm test` attempt reached 175 passing subtests but exceeded the runner timeout; it is not a passing complete run and may involve costly unrelated game suites. Reproduce in CI, do not infer.
- The connected independent worker and ultracode path remained unavailable; this iteration has **no independent critic or blind A/B benchmark win**.
- Real-hardware frame rate, uninterrupted high-tier motion, long production soak and original two audit findings still require separate assessment.

**Verdict after final real-game inspection:** more distinctive landing borders and stonework, but the authored square platform footprints, distant scenery and conservative small character scale remain far below the visual bar. The before/after samples use the same seed/floor/viewports but different simulation ticks; they are not a controlled blind A/B test. No independent critic or reference win is claimed. Next critical gap is scene composition and apparent protagonist scale without sacrificing hazard and landing visibility.
