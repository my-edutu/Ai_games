# AI Dungeon Gauntlet — Round 023: Warden-Specific Authored Silhouette

**Date:** 2026-10-31. **PR:** [#49](https://github.com/my-edutu/Ai_games/pull/49), OPEN and DRAFT. **Starting head:** `17b2b594a13162c378d5adf44490f6cc9b2443b6`. **Goal:** improve the *actual* running 3D boss, not a mockup.

## Proven gap and benchmark

The real Chromium 1440×832 Round 19/20 matched WebGL comparison (seed `visual-room-art-18`, 18 authority ticks) still shows small, generic character silhouettes, unlike Diablo IV's individually recognisable elite/monster shapes. The current code independently confirms that `model-assets.js` maps **both revenant and Warden to the same enemy swordsman GLB**: the boss differs chiefly by size and colour. *Diablo IV* gameplay remains the primary **aspirational comparison**, *No Rest for the Wicked* for room composition, and *Path of Exile 2* for combat legibility. No reference artwork was imported, traced or shipped.

## Independent bounded increment

1. **Test-first:** `tests/foundation/dungeon-warden-regalia.test.cjs` was authored and run against a missing plan module, yielding expected RED (three failing cases). Test-first commit `3f327a0` precedes implementation.
2. **Pure cosmetic design plan:** `warden-regalia-plan.js` describes exactly **24 original ornamental boss shapes**: paired sweeping horns and pauldrons, contrasting rims, back spines, collars, breastplate, an ember core and waist armor. Frozen static plan, no RNG, no authority inputs or client network.
3. **Actual authored GLB:** `model-assets.js` attaches this geometry to the existing Warden GLB's isolated read-only visual pivot (and only that kind), preserving the local skeletal mixer and source textures. Four PBR materials, four shared elementary geometries and two bounded horn tubes per boss; **24 meshes maximum per boss**. Warden's procedural fallback already has a distinct outline and is unchanged.
4. **Resource ownership:** all six per-boss geometries and four owned materials dispose on character teardown and world regeneration. `authored3D.authoredBosses` and `authored3D.bossRegaliaParts` expose exact read-only counts.
5. **Strict CSP and browser proof:** the new same-origin module route is explicitly whitelisted; the dedicated Chromium suite now includes a test that finds a **real authoritative encounter** in a bounded 700-tick seed campaign, waits for decoded GLBs and the 24 Warden parts, and captures `artifacts/dungeon-warden-regalia-round23-world-only.png`. It never hand-moves actors or uses mock screenshots.

## Observed validation, honest limits

- **Local isolated pure-planner tests:** 2/2 PASS after the planner was written (original RED observed before creation). Third integration/static-contract test requires the full repository files; the connected coding workbench tunnel is unavailable, so a complete local Node/TypeScript/Playwright run was **NOT** obtained in this iteration.
- **Exact-head GitHub Actions:** dedicated software/browser, integrated catalogue tests and the deterministic 24×900 campaign are required for acceptance. Do not count a queued/in-progress job as success. New real WebGL screenshot/artifact is **not yet inspected**; no proven visual win or performance uplift is asserted.
- **Authority/replay:** game rules, units, action selection, damage, floors, seeded streams, saves, checksum, API schemas and authoritative replay code are **unchanged**. Purely ornamental geometry consumes the existing read-only render state. Replay equivalence still needs an executed exact-head campaign to be claimed.
- **Performance bound:** +24 Three.js meshes per authored Warden, 4 PBR materials and 6 owned geometries; an observed FPS/p95/GPU-memory delta is **NOT MEASURED**. The WebGL test retains a loose 1,600-draw-call guard and emits the actual draw-call count for review.
- **Art provenance:** original procedural shape definitions in repo code; the existing CC0 source GLB is retained unmodified.
- **Separate critic/ultracode:** NOT AVAILABLE; tunnel connection was offline. No fresh independent blind A/B, no reference preference result.

## Harsh quality verdict

This is an original, bounded identity accent on an existing low-detail humanoid, **not** an artist-quality creature sculpt, advanced skin/cloth shading or motion-captured combat. Static regalia follows the cosmetic root rather than each animated bone, so shoulder/cuirass clipping during high-amplitude clips must be inspected. The photographed scene is still dark and boxy, and neither Diablo IV art parity nor production readiness is remotely demonstrated. A failure of browser checks or visually obscured hero combat must be fixed or reverted before marking the round accepted.

**Next highest blocker:** inspect the new genuine Warden encounter capture and dynamic combat clip for attachment/animation clipping and occlusion; then create higher-fidelity *original* hero/enemy character models with distinct anatomy and skeletal motion, plus richer nonrectangular dungeon architecture. Keep PR #49 draft; do not merge.

**Rollback:** revert only the Round 23 cohesive regalia files/model hookup/tests and route. No migration or authoritative rollback is required.
