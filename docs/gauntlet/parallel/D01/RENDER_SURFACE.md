# D01 — Retain the real Dungeon WebGL drawing surface

Status: production-path correction candidate, **not a demonstrated FPS win**. The original PR #49 remains draft; this review increment is intentionally isolated from parallel camera, art, gameplay, UI and boss work.

## Reproduced source mismatch

Three.js 0.186.0 WebGLRenderer.setSize(width,height) writes canvas.width=Math.floor(width*DPR) and canvas.height=Math.floor(height*DPR). The Dungeon loop previously compared canvas.width/height to Math.round(width*DPR). At a 1440x900 CSS stage and DPR=0.708 (a possible software-WebGL 650k-pixel budget), the true width becomes 1019 while the old check expects 1020. Every animation callback therefore re-entered setSize even though CSS dimensions and DPR were unchanged. Canvas dimension assignments may reset drawing surfaces and invalidate browser composition/capture. This is a deterministic code defect, not measured hardware FPS evidence.

## Implementation / owned files

- postfx-budget.js: pure planRenderSurfaceChange(previous,cssW,cssH,DPR), preserving strict invalid-input skip, floor-consistent physical pixels and a stable no-change decision.
- app.js: retained CSS/DPR state; setPixelRatio only on real DPR changes, setSize only on CSS changes; update composer and camera when relevant; expose read-only setSizeCalls, dprChanges, transitions and backingPixels.
- existing foundation/browser tests: arithmetic regression, CSS/DPR edge cases and running Three.js scene check with real autonomous state.
- Authority, RNG, damage, hazards, save/replay, camera policy, model art, lighting, sound and HUD are untouched.

One caveat: Three.js setPixelRatio internally invokes setSize. The exposed setSizeCalls counts only **explicit** application calls; DPR changes are measured separately. 'BackingPixels' is drawing-buffer size, not GPU memory usage.

## Runtime acceptance / pending evidence

Use existing `npm run dungeon:test` and `npm run dungeon:visual` with exact tested SHA. Browser test D01 must show a stable setSizeCalls count across at least five genuine WebGL frames at a stable CSS viewport, actual rendered units/triangles and advancing run/tick. Mobile stage resizes remain legal and expected.

For a performance claim, compare prior PR parent SHA against this commit on identical software-WebGL and hardware-GPU devices, 1440x900 and 390x844, same seeded authority, three runs each, warm-up excluded, recording on/off. Report source rAF p50/p95/p99/worst, CPU script/layout, synchronous render wall, draw calls/triangles, true physical pixels, screenshot fidelity, unchanged replay checksums, and decoded video frame differences. Do not call encoder timestamps gameplay FPS. Record Warden warning and genuine hazard, ordinary combat, floor change and defeat/restart; analyze actual sequence before quality verdict.

No merge or production deployment authorized. The pinned M1 baseline 281735d0910c6b2443648af976003d50412ee324 is unchanged.
