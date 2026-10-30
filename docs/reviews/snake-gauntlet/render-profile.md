# Snake 3D rendering profile

## Findings

The current SwiftShader presentation misses the existing 17 FPS gate by a wide margin. The initial normal scene delivered 1.18–1.52 actual rendered frames per second. Direct GPU timer queries on the later scene measured about 603 ms of WebGL work per full-scene frame, while JavaScript scene updates and draw submission typically consumed only a few milliseconds.

The world is the dominant cost. Rendering the current low-detail character and contact shadows without the world reduced median measured GPU work to about 37 ms. Rendering the world without the character remained severely slow. These hidden-group samples are diagnostic reductions, not valid product-quality output or passing performance tests.

A controlled static-material-merge A/B now confirms a substantial fixed instancing cost: preserving the authored geometry while baking instances into ordinary material meshes improved throughput from 2.29 to 3.88 FPS and reduced median GPU work from 347.6 to 198.9 ms. It still fails the 17 FPS gate. Further optimization must remove roughly another fourfold cost from the current full-scene path; static scenery caching is the strongest next quality-preserving candidate. The detailed controlled comparison is appended below.

## Method and environment

- Chromium 140.0.7339.16 through Playwright, headless, with `--use-angle=swiftshader --enable-unsafe-swiftshader`.
- Renderer: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`.
- One browser active at a time; every browser closed in `finally`; no video recording. Both profiling browsers have closed.
- Existing live server `http://127.0.0.1:4173`, normal app requestAnimationFrame loop and actual `renderer.render(scene, camera)` calls. No RAF-only substitute was used.
- Low quality explicitly requested through `?quality=low`; DPR 1, renderer pixel ratio 0.75; antialiasing remained enabled.
- Modules were intercepted only in the profiling browser. No repository files were edited by this investigation.
- First comparison: 12 rendered warmup frames, then 24 actual draws in each independent page. CPU timings surround update and real draw submission.
- Isolation comparison: one page, 12 initial warmup frames, then 20 draws per mode with the first 4 discarded. EXT_disjoint_timer_query_webgl2 measured WebGL work asynchronously; disjoint results were excluded.
- Cgroup CPU quota was 8 CPUs. A process snapshot showed our GPU process at about 349% CPU and no other live Chromium instance. Other game servers had much lower CPU usage. This does not establish a dedicated-hardware production budget.

## Initial one-factor comparisons

The initial module snapshot was frozen at 2026-10-30 19:05:45 UTC. The server remained live, so the body grew between conditions. World population stayed at 6,270 static instances.

| Condition | Viewport | Drawing buffer | Actual FPS | Frame gap p50 | Frame gap p95 | Maximum gap | Update p50 | Submit p50 | Draw calls at end | Triangles at end |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| baseline | 640×360 | 465×191 | 1.18 | 650.0 ms | 1549.9 ms | 5549.7 ms | 0.70 ms | 2.90 ms | 67 | 106,172 |
| baseline | 1280×720 | 916×385 | 1.52 | 599.9 ms | 1783.3 ms | 2100.0 ms | 0.70 ms | 3.60 ms | 68 | 110,594 |
| no-shadows | 1280×720 | 916×385 | 1.85 | 516.7 ms | 1066.7 ms | 1166.6 ms | 1.30 ms | 2.60 ms | 67 | 113,706 |
| lambert-world | 1280×720 | 916×385 | 1.79 | 516.6 ms | 1166.6 ms | 1183.3 ms | 0.90 ms | 2.80 ms | 67 | 115,242 |

The small canvas was 620×255 CSS pixels; the desktop canvas was 1,222×514 CSS pixels. Desktop had about four times the drawing-buffer area, yet median cadence did not become slower. Removing shadows or substituting Lambert materials for world Standard materials reduced median gaps from roughly 600 to 517 ms. Neither was close to the 58.8 ms average frame budget corresponding to 17 FPS.

All four conditions returned GL error 0, no page errors and no console warnings. The normal and Lambert conditions ended with 9 textures; disabling shadows ended with 7. Geometry/resource counts stayed bounded within these short samples, but this is not a soak test.

## Scene-owner isolation with GPU queries

This second snapshot was frozen at 2026-10-30T19:09:11.341Z. It includes the current serpent low-detail path, unlike the first comparison; compare conditions within this second run. Exact SHA-256 hashes are in `/tmp/snake-profile-source/manifest.json`, and the four module snapshots are alongside it.

| Actual geometry drawn | Actual FPS | Frame gap p50 | Maximum gap | GPU work p50 | GPU work p95 | Update p50 | Submit p50 | Draw calls at end | Triangles at end |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| baseline | 1.34 | 616.6 ms | 2016.6 ms | 602.7 ms | 753.6 ms | 1.00 ms | 3.90 ms | 78 | 76,616 |
| hide-world | 2.81 | 100.0 ms | 3033.3 ms | 37.2 ms | 111.1 ms | 0.20 ms | 0.80 ms | 36 | 4,440 |
| hide-character | 1.18 | 66.7 ms | 4266.5 ms | 1295.7 ms | 2568.3 ms | 0.20 ms | 1.60 ms | 42 | 67,562 |

Interpretation: the full current scene spent roughly 603 ms in GPU work per median query. Removing the world brought that figure down to 37 ms. Removing the character did not relieve the bottleneck. The world-only case submitted frames in bursts: its 66.7 ms median RAF gap hid 4.27-second stalls and only 1.18 FPS overall. Therefore neither RAF median nor an independent RAF callback counter is sufficient to claim performance.

All isolation conditions returned GL error 0 and no page errors. The live simulation restarted during the character-only sample; body complexity changed, and the GPU query queue means some timing results arrived later than the draw that produced them. The samples establish ownership of the dominant cost; they do not support a precise controlled speedup percentage.

## Geometry and upload evidence

A read-only Node inventory of the 28×16 world found 67,676 potential visible world triangles before renderer frustum culling, across 6,270 static instances. The world-only browser sample actually submitted 67,562 triangles.

| Static batch | Instances | Triangles per instance | Total triangles |
|---|---:|---:|---:|
| Light leaves, color 78a939 | 3,082 | 8 | 24,656 |
| Board tiles, color c3c4ad | 448 | 18 | 8,064 |
| Pink petals, color efb0c0 | 925 | 8 | 7,400 |
| Dark leaves, color 2d663a | 504 | 8 | 4,032 |
| Yellow-green leaves, color a7bf43 | 451 | 8 | 3,608 |
| Stone blocks, color b5bba0 | 199 | 18 | 3,582 |

The serpent reserves about 9.44 MB of typed-array capacity, but it calls clearUpdateRanges/addUpdateRange for active positions, normals, UVs and indices. That capacity is not uploaded in full every frame. The later low-detail baseline had 289 rings and 2,601 body vertices: its active body attribute/index data was around 0.14 MB. Character-hidden world rendering remained slow, ruling out active body uploads as the dominant cause of the whole-scene slowdown.

## Concrete optimization and acceptance plan

1. **A/B test static material merging first.** Bake each static instance matrix into its vertices and normals, retain per-instance color as vertex color, and merge static geometry into material batches. Keep the same geometry, colors, maps, shadows, camera and live gameplay props. This specifically tests fixed instancing/vertex overhead without reducing the image content.
2. **Preserve the garden shader contract.** The continuous tile map currently derives garden UVs through instanceMatrix. With baked geometry it must use the baked world-space position. Copy custom onBeforeCompile and customProgramCacheKey behavior explicitly when cloning materials, retain UVs and correct normal transforms, and dispose generated buffers/materials with the world.
3. **Keep dynamic objects separate.** Obstacles, hazards, portals, fruit, contact shadows, water animation and serpent animation retain their update paths. Static merge must not change simulation state or snapshot ownership.
4. **Measure the real output after merging.** Use the same browser, viewport and low tier, a frozen module snapshot, warmed-up real draws, total actual FPS and maximum gaps. Target the existing 17 FPS threshold and maximum gap below 250 ms, and visually compare the full scene. Do not substitute an RAF-only loop or count frames that skipped rendering.
5. **If merge does not materially improve GPU time, test caching the immutable scenery.** A static-color/depth render cache keyed by settled camera, canvas size, board dimensions and lighting can preserve full authored scenery while drawing it once per change. Water and gameplay remain dynamic. Correct depth compositing is required for snake/ruin occlusion. This is more complex and should follow the cheaper, directly measurable static-merge experiment.

Overview character LOD is already active in the second run, reducing the full scene from roughly 110k to 77k submitted triangles, but the world bottleneck remained. Disabling shadows or globally simplifying materials should not be the primary fix based on these samples.

## Evidence files

- `/tmp/snake-render-profile.json`: first comparison raw rows, completed-draw cadence, renderer stats, GL/device metadata and errors.
- `/tmp/snake-render-isolate.json`: full-scene/world-only/character-only rows and GPU query results.
- `/tmp/snake-profile-source/`: exact second-run module snapshots and hashes.
- `/tmp/snake-render-geometry.json`: per-mesh inventory from the read-only Node inspection.
- `/tmp/snake-render-profile.cjs` and `/tmp/snake-render-isolate.cjs`: temporary profiling scripts.

No performance gate has been marked passing. No repository changes were made by the profiler.

## Controlled static-merge A/B — latest evidence

Frozen at 2026-10-30T19:13:24.938Z; exact source SHA-256 hashes and snapshot metadata are in `/tmp/snake-render-merge-ab.json`. Both conditions used the same frozen public presentation snapshot, current renderer, current serpent and current camera. Only `world.mjs` changed between the pre-merge copy and merged candidate. The frame contained a 96-length serpent at the run-result stage. Procedural presentation animation remained active; authoritative state was not changed.

Both pages used low quality, a 1,280×720 viewport and a 916×385 drawing buffer. Each warmed up for 12 real draws, then measured 24 real draws. GPU query results were associated with the actual originating frame IDs; all 24 results were available after the post-measurement screenshot. No screenshot work was included in the cadence sample. One browser ran the conditions sequentially and closed in `finally`.

| Measure | Before static merge | After static merge |
|---|---:|---:|
| Actual rendered FPS | 2.29 | 3.88 |
| Frame gap p50 | 416.6 ms | 250.0 ms |
| Frame gap p95 | 600.0 ms | 316.6 ms |
| Maximum frame gap | 716.6 ms | 466.7 ms |
| Median GPU work | 347.6 ms | 198.9 ms |
| GPU work p95 | 533.2 ms | 247.3 ms |
| Update p50 | 0.70 ms | 0.60 ms |
| Submission p50 | 2.30 ms | 1.70 ms |
| Draw calls at sample end | 73 | 70 |
| Triangles at sample end | 76,326 | 76,518 |
| World authored placements | 6270 | 6270 |
| World draw objects | 43 | 37 |
| Active body triangles | 4512 | 4512 |
| GL error | 0 | 0 |

The merge improved actual throughput by about 69% and reduced median GPU work by about 43%. It preserved all 6,270 authored placements and produced 13 static material meshes. Body geometry was identical in both conditions. Small differences in end-of-sample total triangles/draw calls are consistent with time-dependent visibility of character details such as the tongue; they do not explain the speedup. Both conditions had no browser page errors or console errors.

Visual check: `/tmp/snake-merge-before.png` and `/tmp/snake-merge-after.png` were inspected. Visible peripheral stone, foliage, tree and arch geometry are consistent; water differs with animation phase. The frozen run-result overlay covers the center of the garden, so these images do not prove unobscured tile-UV and full-character equivalence. The root agent has separate unobscured current-scene captures. Treat full visual equivalence as a remaining review item, not a proven claim.

The merged candidate still fails both relevant pacing conditions: 3.88 FPS is below 17 FPS, and its 466.7 ms maximum observed gap exceeds 250 ms. Preserve the original performance requirement. Static scenery caching, including correct depth compositing, can avoid redrawing the remaining 6,270 immutable placements on every settled-camera frame while retaining their original shading and appearance. Any cache implementation must receive an actual full-scene draw measurement and a visual review before a performance pass is claimed.

Additional evidence: `/tmp/snake-render-merge-ab.json`, `/tmp/snake-merge-snapshot.json`, `/tmp/snake-render-merge-ab.cjs`, and both comparison PNGs. All profiling browsers are closed.
