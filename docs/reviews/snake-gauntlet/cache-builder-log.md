# Measured adaptive render scale — latest renderer handoff

## Status and scope

The bounded adaptive-scale change is complete in **public/snake-stream/renderer.mjs only**. Current source: **417 lines**, SHA-256 **`d76be84af00f56cd1ec037aa906f084bbdf1a5e1f9a61c5f14a8ab04c6fca260`**; renderer delta **42 insertions / 17 deletions**. Root owns the timing-test changes and all CI work. Other builders' camera, world and serpent edits were not modified by this task.

**No local GPU attempt was made.** The next isolated CI run must establish actual FPS, maximum frame gap, cache rebuild behavior and the visual resolution tradeoff. The minimum 17 FPS and maximum gap below 250 ms are unchanged. No objects are hidden, no draws are skipped, and no 2D path is substituted by this change.

## Actual motivating evidence

Inspected `/tmp/snake-3d-ci-round6/artifacts/phase3/desktop-metrics.json` from published commit `c953c64d21059fe6eb2dc9f7cb094655ddaba48e`:

- 1920×1080 viewport; canvas 1842×842 CSS pixels.
- **5.242 FPS**, **6 actual draws in 1144.6 ms**, maximum frame gap **266.6 ms**.
- Cache active with **22 hits / 4 builds**; **51 calls / 10,079 triangles**.
- Low-tier cached drawing buffer **1381×631**, from the previous fixed 0.75 ratio.

Display-color preprocessing alone did not meet the frame budget. The environment builder separately replaced the water shader's expensive math with texture samples; that work is outside this renderer change and its combined effect will be measured by CI.

## Policy implemented

1. Ignore the first **three drawn frames** at startup and after `resetTiming()`. The existing visibility-change path calls resetTiming, so intentionally hidden intervals do not become slow-frame samples.
2. Collect an **eight-frame window** and use its median. A single cold/GC stall does not lower a capable device's quality.
3. If the median exceeds **36 ms**, make one measured correction toward a **33 ms** target using:

   `nextRatio = currentRatio * sqrt(33 / observedMedianMs)`

4. Clamp the chosen ratio to the low-tier range **0.4–0.75**, without exceeding the current ratio or device DPR. Devices whose DPR is already below the floor are never upscaled by the policy.
5. Apply the same measurement to explicitly requested low quality; low mode is no longer permanently fixed at 0.75.
6. Once an adjustment is made, retain it for the renderer lifetime. Fast devices keep their existing balanced/native ratio, and the policy continues watching eight-frame windows until sustained slowness is observed.

This is an area-based heuristic driven by actual frame cadence; it is not a claim that all frame cost scales perfectly with pixels. There is no test, CI, browser-brand, headless or software-renderer detection.

## Cache/shadow stability and observability

- The selected ratio is applied once, the pending resize is resolved immediately, and the existing size/cache invalidation path handles disposal and target rebuilding.
- Refining an already-low ratio does **not** dispose/recreate the existing 1024 shadow map. Moving from balanced quality to low still changes the shadow-map size through the existing supported path.
- Subsequent slow frames do not repeatedly adjust resolution or rebuild caches for scaling.
- Stats now report actual `pixelRatio` from `getPixelRatio()` and actual `drawingBuffer.width/height` from `getDrawingBufferSize()`.
- Stats also report `renderScale.adjusted`, `renderScale.sampleFrameMs`, and `renderScale.targetFrameMs`, making the measured decision visible in the next retained CI artifact.
- Existing real 3D rendering, cache composition, world/character updates, fallback and resource-disposal paths remain in use.

## Meaningful CPU-only verification

Root first updated the NoGpuRenderer test boundary to track pixel ratio, size and submitted draw count. Root reported the expected red result against the preceding source: hidden-tab recovery passed, while the new isolated-hitch, sustained-slow and forced-low cases failed.

After the renderer change, this builder ran:

`node --test tests/phase3/snake-render-timing.test.cjs`

**4 tests passed, 0 failed:**

- Resuming an intentionally skipped/hidden interval does not force permanent low quality.
- A capable device retains balanced/native quality despite one isolated 900 ms frame.
- Sustained 200 ms frames select a ratio in 0.4–0.5 once; another 120 draws do not change it again. The test verifies **all 144 requested draws were submitted**.
- An explicitly low tier adapts below 0.6 when its initial resolution is too expensive.

`node --check public/snake-stream/renderer.mjs` and `git diff --check` also passed.

These tests establish the adaptation logic and draw-count contract. They do not establish actual GPU performance, antialiasing quality, readability at the lower ratio, or a passing 17 FPS gate. CI must provide that evidence.

## Reproduction and next action

- `/tmp/snake-renderer-before-adaptive-scale.mjs`: renderer before this task.
- `tests/phase3/snake-render-timing.test.cjs`: root-owned focused regression tests, passed 4/4.
- `/tmp/snake-3d-ci-round6/artifacts/phase3/desktop-metrics.json`: inspected failing full-HD evidence.

The source is stable and this builder has stopped. The root can publish the combined checkpoint and use the isolated runner's retained actual-render metrics and screenshots for the next decision.

---

# Earlier cache/display-color implementation records

# Static 3D cache — display-color optimization handoff

## Latest candidate status

The renderer-only display-color optimization is complete and stable. Current `public/snake-stream/renderer.mjs` has **392 lines**, SHA-256 **`dc7363339a8767fbd3e297f46059d3e42a85f4a1580cd310e08d4bb92af6d74c`**. The delta from published cache commit `c07c4123d3a28e505c1f089465c07f455cbe3486` is **53 insertions / 12 deletions in renderer.mjs only**. No simulation, world, character, application, tests, performance thresholds, or CI files were changed by this implementation.

**The 17 FPS requirement remains unproven for this candidate.** The root owns the next isolated CI run. The bounded local attempt verified that the new shaders compile and actual 3D draws return GL error 0; the harness as a whole did not pass because it assumed exactly one initialization build and observed two. It did not reach image capture or resize checks. There will be no local retry loop.

All profiling browsers are closed. The final local attempt emitted `BROWSER_CLOSED` and exited. No local GPU work remains active from this builder.

## Evidence that motivated this change

The root reported isolated CI results for the published cache: **11/12 tests passed**, including cache resize, context loss and matched-image checks, but full-HD presentation was approximately **5 FPS**, below the unchanged **17 FPS** minimum. The actual artifact metrics inspected here show:

| Small-view artifact | Draw calls | Triangles | Textures | Cache state |
|---|---:|---:|---:|---|
| Before caching | 63 | 74,935 | 11 | disabled |
| Published cache | 51 | 11,498 | 13 | active, 3 hits, 2 builds, 690×342 target |

These artifacts contain only three and five presentation frames respectively. Their frame percentiles must not be treated as a steady performance pass. They show that geometry work was reduced while the root's full-HD gate still failed, making repeated full-screen color processing a concrete bounded optimization target.

## What changed

The published cache copied linear HDR color to the display while running ACES tone mapping, SRGB transfer and final-space fog on every cached frame. The new implementation performs those calculations **once per cache rebuild** and retains the resulting display color in a second target.

There are now two bounded targets:

1. **Original HDR/static-depth target:** unchanged RGBA16F color, selected MSAA samples, and DEPTH_COMPONENT24 depth. Static 3D geometry, shading, shadow sampling and depth resolve follow the published path.
2. **Display-color target:** RGBA8/UnsignedByte, no depth or stencil, zero MSAA samples, nearest sampling. Its texture is deliberately tagged `NoColorSpace`: the stored values are already display-encoded bytes and must not be decoded on sampling.

During a rebuild, the new `cacheBakeMaterial` reads the resolved HDR color/depth and explicitly applies the pinned Three functions in the same order: **ACESFilmicToneMapping → sRGBTransferOETF → the existing output-space fog formula**. Because ordinary offscreen targets disable Three's automatic tone mapping/output conversion, these functions are called explicitly, with `toneMapped:false` preventing duplicate injection. The pinned shader prefix already provides the SRGB transfer function, and the tone-mapping chunk is explicitly included once.

On steady overview frames, the main cache material now performs only the depth lookup/discard, `gl_FragDepth` assignment, and raw display-color lookup. It has `toneMapped:false` and no executable tone/fog/output conversion. It retains the same depth-test/write settings. The snake, props, water and effects still receive real dynamic 3D rendering every frame.

The existing invalidation key covers all baked inputs, including camera/projection, size, world, quality, fog range and exposure. Both targets are disposed/recreated together on size changes, and both targets plus both materials are disposed with the renderer. The quad material is restored in `finally` so a failed rebuild cannot leave the baking shader attached to subsequent display composition.

## Cost and scope

- Steady frames remove the ACES matrix/rational operations, three SRGB power operations, depth-to-view conversion and fog calculations from the cache fragment shader.
- Steady color fetches use RGBA8 instead of RGBA16F. The original depth texture is unchanged.
- A rebuild gains one full-screen pass and one triangle, counted by the existing aggregate renderer info. Steady draw counts and triangles remain unchanged.
- The extra allocation is one RGBA8 color texture, approximately four bytes per drawing-buffer pixel, without additional depth or MSAA storage.
- In the local check, textures increased to **14**; geometry count remained **44**.
- No FPS gain is claimed before the next isolated full-HD measurement.

## Known visual limitation retained

The root's independent review of the published cache found the broad scene, props and depth intact, but static high-contrast edges were harder/brighter than the uncached renderer: canvas MAE **2.604/255**, **3.831%** of pixels exceeding 24/channel difference, with **97.54%** of those differences near high-contrast edges; rear-flower MAE was about **9.9**. The likely cause is the existing HDR-MSAA resolve occurring before nonlinear tone mapping, whereas the uncached default-buffer resolve occurs after it.

This bounded optimization preserves that existing resolve order; it does not fix or claim to fix the AA gap. It also does not establish exact pixel equivalence of the new RGBA8 preprocessing step. The next isolated matched-image capture remains necessary.

## Verification completed

- `node --check public/snake-stream/renderer.mjs`: passed, exit 0.
- `git diff --check`: passed.
- Root independently reported the existing snake render-timing test passed **1/1** for this edited source.
- Source inspection verified the installed Three.js shader prefix and color/tone functions. In particular, SRGB functions are available for ShaderMaterial, ordinary offscreen targets do not automatically tone map, and `toneMapped:false` avoids duplicate tone-mapping definitions.
- Exactly **one** local GPU attempt was made, protected by `timeout --signal=TERM --kill-after=3s 52s`. It used a small 640×360 same-origin canvas, low quality, a fixed public snapshot and reduced-motion draw settings. It was a shader/cache correctness check, not a performance benchmark.

### Local attempt details — not a passing suite

The first draw compiled the new shaders and produced:

- cache active, build 1, 480×270 target, four samples;
- 78 actual draw calls / 138,375 triangles including shadow/cache rebuild passes;
- 44 geometries / 14 textures.

After three real draws, the recorded warm state had:

- **GL error 0**, no console errors and no page errors;
- **51 actual draw calls / 11,498 triangles**, confirming live dynamic 3D work;
- cache active, **1 hit / 2 builds**;
- 44 geometries / 14 textures.

The harness then failed this expectation: `assert.equal(result.warm.staticCache.builds, 1)` with **actual 2, expected 1**. An initial ResizeObserver-triggered invalidation is consistent with this result; the published-cache CI artifact already reported two initialization builds. This was an overly strict harness expectation, but it remains a failed assertion and is not hidden or relabeled as a passing smoke test. The screenshot, resize, and explicit-dispose assertions placed after it were not executed. Browser cleanup did execute and emitted `BROWSER_CLOSED`.

The fixed timestamps in this correctness harness make its `frameMs` fields meaningless for FPS. They must not be cited as recovered performance.

## Evidence and next handoff

- `/tmp/snake-renderer-before-display-cache.mjs`: published-cache renderer before this optimization.
- `/tmp/snake-display-cache-smoke.cjs`: the sole bounded local GPU harness.
- `/tmp/snake-display-cache-smoke.json`: actual first/warm draw stats and errors from that attempt.
- `/tmp/snake-3d-ci-round5/artifacts/phase3/cache-before-metrics.json` and `cache-after-metrics.json`: inspected isolated-CI evidence for the published cache.

The root's next CI run should retain full-HD metrics and a screenshot before asserting the unchanged FPS gate, then run the existing cache resize/context/image checks. The source is ready for that isolated verification route. Independent source-review feedback, if it identifies a concrete defect, should be resolved before claiming readiness.

---

# Historical implementation and blocked-validation record

The following record describes the earlier cache implementation and the saturated local workspace before the isolated round-5 CI results. Its previous lack of runtime evidence was subsequently superseded by the root's isolated CI for commit c07c4123d3a28e505c1f089465c07f455cbe3486; it does not apply as a blanket statement about that published cache today.

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
