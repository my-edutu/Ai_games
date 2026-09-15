# Performance Report

## Designed-in controls
- shared WebGL sphere/box/cylinder meshes rather than per-object geometry allocation;
- quality-specific DPR caps;
- bounded deterministic VFX pool/draw cap;
- presentation interpolation decoupled from the authority tick;
- fixed authoritative collision/contact budgets remain unchanged;
- WebGL context loss falls back instead of presenting stale state.

## Known inefficiency
During this first rebuild slice, the legacy Canvas fallback and the WebGL renderer both maintain presentation loops and snapshot polling after WebGL becomes ready. The Canvas is visually hidden but its loop still consumes CPU. This should be consolidated after runtime evidence proves the WebGL path stable.

## Evidence status
Measured FPS, draw-call counts, memory use, long-session stability and 32-marble stress data are **NOT YET VERIFIED** for this rebuild branch. CI/browser evidence must populate these before production-readiness claims.

## Acceptance targets for measurement
- stable 1080p broadcast rendering without unbounded memory growth;
- no overlapping WebGL snapshot requests;
- no NaN/Infinity in authority state;
- bounded particle counts;
- quality presets visibly reduce render cost;
- context loss degrades to the fallback renderer safely.
