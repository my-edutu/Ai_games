# Round 36 · reuse index-buffer topology for moving serpent (candidate; 2026-10-31)

**Fixed quality bar:** official Sumo Digital *Snake Pass* character/gameplay and world stills; ASTRO BOT is secondary environment craft. **Whole-game verdict: LOSE/OPEN.** This is a bounded GPU-upload optimization, not a new character or art win.

## Independently judgeable unmet slice

Round35 exact-current focused [41240251761](https://github.com/my-edutu/Ai_games/actions/runs/41240251761) passed **24/25** real Chromium/WebGL checks; sole strict failure was **10 actual draw submissions in ~1s versus ≥17**; 61 animation callbacks do not count as submitted or display-present frames. The historical R32 test fix is now confirmed in real browser. General 41240251775 remained running at preparation. The static 3D world is cached in overview, but the live serpent writes and schedules an index-buffer GPU upload on *every* submitted frame even when contiguous body rings and portal cut locations are unchanged. This is unnecessary streaming memory traffic while already below the strict rendering gate.

## Implementation hypothesis / exact-source control

Only `public/snake-stream/serpent.mjs` is changed. The 3D body still rebuilds **all positions, normals, UVs and logical indices** from the current public motion; it now requests an **index GPU upload only if** index count, radial LOD or every explicit portal-fragment break ring differs from the last uploaded topology. A preallocated bounded array tracks portal breaks. No allocations per stable frame and no topology hashing collisions. Rendered body bytes, cap, portal segmentation, head, AI/score, snapshots, captions, reduced motion, fallbacks, recovery and draw counts are unchanged. `indexUploadRequests` / `indexReuseFrames` are explicit *CPU-side request diagnostics*, not GPU-timed, RAF, GPU-present or real displayed FPS.

The Node model test compares **real source** against the exact SHA-verified predecessor `feb317e2c4f8465ff77f33f4d400a4292a795330`, checking byte-identical live positions/normals/UVs/indices for moving body, bent paths, broken portals, restart, reduced-motion and both LODs, plus true per-frame index-attribute versions. The browser test injects only the exact predecessor serpent source against the same frozen **synthetic** public frame and requires bit-identical 960×640 real Chromium/WebGL overview and detail PNGs. Actual screenshots, strict pacing, complete focused suite, general CI and causal GPU improvement are **PENDING** at candidate commit. No independent artist/critic was available; code self-review cannot stand in for fresh-context criticism.

## Adversarial engineering self-review

If the break-ring signature misses *any* portal segment, same index count could still connect the wrong fragments. Version-only proof is insufficient without byte-identical old/new indices across forced topology changes; that is why the model test checks both. Timing may remain below 17 due to water, dynamic shading, CPU SwiftShader and runner noise; no frame rate should be claimed from upload counts alone. Visual stills will by design not add level richness or character expressiveness. If the new exact-source capture differs, reject the change. A change to body subdivision or index format must invalidate this optimization deliberately.

**Pending gates:** original Snake Pass/ASTRO BOT whole-game art and motion, independent critic, ≥17 sustained actual submissions, real device display-present cadence, device/soak/R5. **Draft PR only; do not merge or deploy.**
