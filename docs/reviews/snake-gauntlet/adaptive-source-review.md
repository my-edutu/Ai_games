# Adaptive resolution — independent source review

Date: 2026-10-30. Reviewer: `snake_cache_critic`.

Scope: renderer and timing-test diff since `c953c64d21059fe6eb2dc9f7cb094655ddaba48e`. No repository edits, browser run, or duplicate test execution.

- Renderer SHA-256: `d76be84af00f56cd1ec037aa906f084bbdf1a5e1f9a61c5f14a8ab04c6fca260`.
- Timing test SHA-256: `be280c141bb1c0c3ae738b3e0e8fa697cb92b19b8201ff1cda108152409e8d74`.

## Disposition

**No actionable source correctness regression was established within the requested one-adjustment policy.** The implementation genuinely lowers raster resolution after sustained slow presentation intervals. It does not detect tests/CI, omit objects, skip draw calls, alter authoritative state/cadence, or relax a performance assertion.

The square-root calculation expresses a pixel-area hypothesis. It does not establish the resulting FPS; current output and the unchanged performance gate still require real CI evidence.

## Timing and visibility

The first three draws are excluded from adaptation, then the median of eight measured draw intervals is used. One isolated long interval cannot by itself force the median above the 36 ms threshold. Fast windows are discarded and measurement continues, so a device that becomes slow before adjustment can still respond later. Forced-low quality remains eligible.

The production visibility-resume reset clears `lastTime`, the partial sample window, and frame-time history, then restarts the three-draw warm-up. The hidden interval therefore does not enter the adaptation median or resumed frame-time percentiles. An already chosen scale is deliberately retained: reset does not restore native resolution or enable repeated quality oscillation.

The existing per-draw measured interval remains unclipped in diagnostics; only the presentation-animation delta is capped, as before. Large genuine visible stalls are not erased from frame-time statistics.

## Cache, resize, and shadows

The chosen pixel ratio is bounded above by current ratio, device ratio, and 0.75. Its lower bound is at most 0.4 and never exceeds the current/device ratio. It therefore cannot accidentally increase resolution during a slow-frame response or force supersampling on a device whose current/native ratio is below 0.4.

`applyQuality()` invalidates static color/depth state and marks resize dirty. The immediate `resize()` completes that change before this same draw proceeds to composition. The resulting drawing-buffer size causes both cache targets to be disposed/recreated together, with their texture uniforms updated. Projection continues to use the CSS aspect ratio. The resize flag is consumed immediately, so adaptation does not deliberately trigger another cache rebuild on the following frame.

Balanced-to-low transition still changes the shadow map from 2048 to 1024, disposes the old map, and sets `shadowMap.needsUpdate`. Refining an already-low pixel ratio leaves the existing 1024 map valid; static shadows depend on the unchanged light/world projection rather than screen pixel ratio. World replacement still explicitly dirties shadows. No lost-shadow-map path was introduced in the reviewed change.

Every valid draw still reaches the existing motion/world updates and `renderPresentation()`. Static/dynamic layers, the direct-camera path, render-state restoration, and resource disposal are unchanged.

## Important one-shot limitation

`scaleAdjusted` is never re-armed by a later resize, camera change, or visibility resume. If a modest first reduction is sufficient in a small overview, a later much larger canvas or a costly detail view may remain too slow at that ratio. This is consistent with the requested stable one-adjustment design; it should not be described as continuous adaptation to every future workload.

If later-large-viewport recovery becomes an acceptance requirement, re-arm measurement only after a material viewport/workload change with a fresh warm-up, rather than adjusting on every draw. No such extension is necessary to justify this bounded first pass.

For scale context, the prior desktop artifact's 1842×842 CSS canvas would become roughly 736×336 drawing-buffer pixels at a 0.4 ratio. That is an allocation/resolution calculation, not a speed estimate. Actual next captures must show that the head, food, hazards, portals, and path remain readable at the selected resolution.

## Test coverage assessment

The four new/updated tests meaningfully cover hidden-resume exclusion, isolated-stall resistance, sustained slowdown, forced-low eligibility, stable one-time adjustment, and retention of every draw submission in the harness. The lead reports the intended red/green sequence; this reviewer did not rerun it.

The harness intentionally disables cache support, uses empty scene factories, fixes device pixel ratio at one, and does not deliver resize callbacks. Its draw-count assertions verify calls to the no-GPU renderer, not completed GPU work. It cannot establish adaptive cache rebuilding, real shadow validity, large/high-DPI viewport legibility, GL cleanliness, or actual FPS. Those remain the purpose of the existing real-browser lifecycle and pacing checks on the new renderer.

This review does not cover the queued water, face, or camera changes and does not change the earlier recorded performance failure into a pass.
