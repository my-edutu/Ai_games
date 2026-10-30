# Static 3D scenery cache — builder handoff

## Status

The authorized implementation is complete in **public/snake-stream/renderer.mjs only**. The final file has 351 lines and SHA-256 `ac983a03fe9b60c2a1f6e3ff5ddf544e62e783a8db1f81f89817a7db82bd950e`. Syntax validation passed with `node --check public/snake-stream/renderer.mjs` (exit 0).

**Actual cached output, color/depth equivalence, resize behavior, context-loss recovery, and the 17 FPS requirement are not validated.** Local browser attempts were stopped at the root agent's request after shared CPU/memory pressure blocked even the unchanged baseline's first draws. No visual or performance pass is claimed.

The root agent reported a **515/515 full Node suite pass before this cache change**. That remains pre-cache evidence; it must not be presented as validation of this final renderer.

All of this profiler's browser and harness processes are closed. A final process inventory found zero matching owned harnesses and zero owned browser children. Other agents' processes were not stopped. The local preview server was restarted on port 4173 when an initial attempt found it unavailable; its tool session was 19023.

## Implemented behavior

- Only meshes explicitly tagged `userData.staticWorld` enter the static cache. The world builder currently uses this tag for its merged immutable scenery.
- Static meshes retain default layer 0 and also receive a static layer. Animated meshes retain layer 0 and also receive a dynamic layer. Lights participate in all required layers. Ordinary full-scene rendering remains available.
- An unchanged, settled overview renders the static 3D scenery into one offscreen color/depth target. The target is produced from the actual scene geometry, lighting, materials and static shadow map; it is not imported background artwork.
- Each subsequent overview frame first clears/composites the cached static color and its actual depth, then genuinely renders the snake, contact shadows, snapshot props, water and effects. Dynamic animation/update code continues to run on every draw.
- Follow and detail cameras, and camera easing back toward overview, use the ordinary full-scene path. Only a residual offset below 0.00001 world units is snapped to its destination to obtain an exact stable overview pose.
- The cache key includes board dimensions, quality, drawing-buffer size, camera world and projection matrices, fog distances, and tone-mapping exposure. World replacement, resize, quality changes and pending static-shadow updates invalidate it.
- `renderer.info.autoReset` is disabled and reset once per presented frame so reported draw calls and triangles include every actual pass, including cache rebuilds. The cache cannot make the renderer stats count only the final dynamic pass while omitting rebuilding work.
- Public renderer stats add `staticCache`: supported, active, hits, builds, width, height and selected sample count.

## Color, depth, fog and clearing decisions

The installed Three.js 0.186 renderer disables tone mapping for an ordinary offscreen target. Accordingly the cache stores **linear HDR RGBA16F** color, avoiding highlight clipping before final tone mapping. The composite applies the existing ACES tone mapping and SRGB output conversion.

The independent source review found a real ordering issue in the first candidate: pinned Three applies fog after tone mapping/output conversion in the direct Standard-material path. The final candidate therefore temporarily disables fog while generating static HDR color, restores scene fog before dynamic rendering, and applies equivalent final-space fog in the composite after output conversion. Positive view depth is reconstructed as `near * far / (far - depth * (far - near))`; the fog color is converted from linear to SRGB. The critic confirmed this matches the pinned Three fog uniform conversion for this renderer's fixed SRGB output.

The cached depth texture is copied into the default depth buffer using `gl_FragDepth`, depth testing enabled, `AlwaysDepth`, and depth writes enabled. This is intended to keep dynamic objects behind ruins and contact shadows against the board faithful. Actual image verification remains outstanding.

The composite scene has the existing background color and clears normally. For the dynamic pass, `scene.background` is temporarily null and `autoClear` is false. This is necessary because a Three Color background forces a clear even when autoClear is false. A `finally` block restores render target, camera layers, scene background, fog and autoClear after either success or failure.

## Capability and resource handling

- Caching is enabled only when `EXT_color_buffer_float` is available; otherwise the renderer uses the existing ordinary 3D path.
- MSAA samples are selected from the intersection of supported RGBA16F and DEPTH_COMPONENT24 sample counts, capped at four, with zero-sample fallback. This replaces the initial assumption that the generic maximum sample count supported the selected color format.
- At most one static target is retained. A size change disposes the previous target before allocating its replacement. Renderer disposal releases the target, depth attachment through Three's render-target disposal, composite material, composite geometry and composite scene references.
- Existing context-loss notification and application fallback behavior were left in place. The cache's exception cleanup restores render state for the existing fallback handler.
- The additional GPU allocation scales with drawing-buffer area and selected MSAA samples. Resource counts and long-run behavior have not yet been measured for this candidate.

## Source review

The root's independent `snake_cache_critic` reviewed the initial and corrected implementation. Its findings were:

1. The direct/cached fog-order difference required correction; this is applied.
2. Per-format MSAA support should be checked instead of assuming the generic maximum; this is applied.
3. After re-reviewing the corrected 351-line version, the critic reported **no new source defect found**.

This is a source review, not proof of actual cached pixels or runtime throughput. The separate scene builder was asked for a read-only cache review; no browser work was delegated concurrently.

## Exact local validation record

### Completed

- Final `node --check public/snake-stream/renderer.mjs`: exit 0.
- Read-only inspection of the pinned Three implementations for render-target color/tone mapping, fog uniform conversion, shadow layer selection, depth resolves, and Color-background clearing.
- Final owned-process inventory: no remaining snake profiling harnesses or browser children.

### Blocked or incomplete

1. The first cache check could not navigate because the prior preview process was no longer listening on port 4173. Error: `net::ERR_CONNECTION_REFUSED`. That browser closed; the preview server was restarted.
2. A subsequent long check failed to reach meaningful measured output while multiple unrelated full `npm test`/`node --test` suites ran concurrently. Only this profiler's browser PID 55525 was stopped; no cache FPS result was recorded.
3. A bounded 640×480 app check ran the **unchanged before-cache renderer first**. It reached `DOM_READY before`, then timed out waiting for three actual frames after 30,000 ms. It never reached the cache condition. Browser closed.
4. A minimal same-origin 640×480 canvas harness imported the real before-cache renderer, world, serpent and camera with the saved public snapshot at a fixed reduced-motion time. It logged `MODULE_READY` and `RENDERER_READY`, then timed out waiting for DOMContentLoaded after 20,000 ms while the first synchronous real draw was still pending. It did not log `FIRST_DRAW`. It never reached the cache condition. Browser closed.
5. Consequently no new matched cache screenshots, GPU timings, resize results or context-loss results were produced. Missing output files must not be interpreted as passing tests.

At the first resource check, cgroup memory was **8,316,526,592 / 8,589,934,592 bytes**, with 3,979 memory-limit events. A later check showed **8,417,288,192 / 8,589,934,592 bytes**, with **97,213 memory-limit events**. The recorded OOM-kill count was zero. Process listings showed additional unrelated full suites, builds, `npm ci`, and several Chromium processes beginning during the attempted window. These observations explain why the window was unsuitable for performance attribution; they do not prove that the cache is free of runtime defects.

## Evidence and reproduction files

- `/tmp/snake-renderer-before-cache.mjs`: exact pre-cache renderer, SHA-256 `ef7d7dd94df3faa79bf0f90d09b8b04ad3e48117f991c26b798896705ee5a988`.
- `/tmp/snake-cache-source/`: earlier frozen baseline modules used by the full performance harness.
- `/tmp/snake-cache-check.cjs`: real-draw/GPU performance harness, with a 17 FPS assertion and maximum-gap assertion; currently uses earlier frozen non-renderer modules for comparison.
- `/tmp/snake-cache-smoke.cjs`: full-app before/after small-view capture plus intended resize/context-loss checks.
- `/tmp/snake-cache-direct.cjs`: minimal real-renderer, fixed-state/time before/after capture plus intended reuse/resize/context-loss-callback checks; it snapshots current non-renderer modules at launch.
- `/tmp/snake-render-profile.md`: prior GPU diagnosis and static material-merge A/B. Its passing GL/error observations and 2.29→3.88 FPS improvement belong to the **pre-cache** renderer and are not cache verification.
- Public fixture: `docs/reviews/snake-gauntlet/round-4-public-frame.json`.

## Next verification on an isolated runner

1. Capture the same unobscured public scene/time through the pre-cache and final renderer. Compare floor/foliage color, distant fog, serpent/ruin occlusion, contact shadows, hazards, portal props and animated water.
2. Confirm the cache is active and reused during stable overview while each measured frame still submits real dynamic 3D geometry. Confirm camera transitions use the ordinary rendering path and overview reuse resumes only when settled.
3. Exercise resize and balanced-to-low quality transition; require GL error 0, correct cache rebuild dimensions and bounded target/texture counts. Exercise world replacement, follow/detail, and context loss through the actual application fallback.
4. Measure warmed-up actual draw cadence and GPU work on the full scene. Preserve the existing minimum **17 FPS** and maximum frame gap **below 250 ms**. Do not replace this with an independent RAF callback counter or hide the world for the gate.
5. Run the focused existing browser quality/resize/shadow/fallback checks and distinguish their results from the pre-cache 515/515 Node result.

The root agent is responsible for the draft update, independent review and separate-runner verification route. This builder makes no visual-equivalence, recovered-frame-rate, or release-readiness claim.
