# Static 3D cache — independent review

Date: 2026-10-30. Reviewer: `snake_cache_critic`.

Repository: `/workspace/scratch/c732709c31c7/ai-games`.

## Scope and status

Review of the new settled-overview static color/depth cache in `public/snake-stream/renderer.mjs`, with `world.mjs`, `camera.mjs`, `serpent.mjs`, application fallback orchestration, and the pinned Three.js 0.186.0 source. No repository files were edited and no browser/GPU process was started by this reviewer. Actual browser capture and performance evidence belongs to `snake_render_profile`.

**Final disposition: source review complete, with no remaining actionable source defect established in the reviewed scope. Actual visual equivalence and performance are unverified. The cache must not be counted as passing either gate.**

Initial reviewed renderer SHA-256: `c8d3c1c9f4accc41bec22abeeb2f6df918865e8dfa3c961f2f67b501e8b649af` (328 lines).

Final re-reviewed renderer SHA-256: `ac983a03fe9b60c2a1f6e3ff5ddf544e62e783a8db1f81f89817a7db82bd950e` (351 lines). This revision addresses the fog ordering and format-specific MSAA selection discussed below. It has been re-read in source and its final hash rechecked. The local actual-image attempts did not produce any candidate capture.

Related source hashes:

- World: `4889949b66b1dc3549eb609b21150405d57b16195dfce88c153be0bd3ca1847f`.
- Serpent: `e410fd90bd601e4136b0c010c3944b469afe326c52f619e717c1b5d5ab2023d7`.
- Camera: `996dc807a714936cc707845d5486adbeef125a483ac7115370bc9344ff9a2ca0`.
- Before-cache renderer: `ef7d7dd94df3faa79bf0f90d09b8b04ad3e48117f991c26b798896705ee5a988` (`/tmp/snake-renderer-before-cache.mjs`, 204 lines).

The review follows `AGENTS.md`, the approved Autonomous Snake 3D Gauntlet specification, and the repository performance-optimization and long-running-reliability guides. The required distinction is between truthful, complete rendered output and an optimization that merely reports faster callbacks.

## Source review

### HDR and color

The broad HDR path is correct: the render target is HalfFloat, its texture remains in the working linear color space, and the fullscreen shader applies the final tone mapping and output conversion. Pinned Three's `WebGLRenderer.setProgram()` uses `NoToneMapping` for ordinary non-XR render targets; thus the static pass is not already ACES tone mapped. The final cache shader is tone mapped once.

**Initial pipeline difference, corrected before the completed image comparison.** Three's Standard/Physical fragment shader runs tone mapping, output color conversion, then fog. `refreshFogUniforms()` supplies the fog color in the renderer's current output color space. The initial static offscreen pass instead mixed linear fog into HDR color before the cache shader tone mapped and encoded it. These operations are not interchangeable. No perceptible regression was claimed without an actual matched image.

The current 28×16 garden's landscape camera (1222×514 CSS stage) has fog near `57.7198733` and far `122.7198733`. A CPU geometry/camera inspection found all 3900 vertices of the two distant-islet materials beyond the near plane, with maximum fog factors `0.0980463` for rock and `0.0811016` for green. None of the other eleven static material meshes—including the board, island, arch, trees, and foreground plants—has a vertex inside the fog interval. Thus current fog-order differences should be confined to the distant banks. This is a source/math finding, not evidence of a perceptible regression.

The follow-up revision caches static HDR with `scene.fog=null`, reconstructs positive view depth as `near*far/(far-depth*(far-near))`, then applies output-space fog after tone/color conversion. The fog color is copied and converted from linear to sRGB, matching pinned Three's direct-draw uniform conversion for the renderer's fixed `SRGBColorSpace`. The original fog is restored before the dynamic pass and again in `finally`. This fixes the mathematical ordering; actual output still requires comparison.

### Depth and scene separation

The static pass contains the 13 explicitly tagged immutable world material meshes. Every other world mesh is assigned to the dynamic layer, including water, foam, waterfalls, obstacles, hazard representations, portals, and fruit. Serpent meshes and the bounded contact-shadow pool are also assigned to the dynamic layer. The serpent updates existing meshes/geometries and does not create later untagged meshes.

The fullscreen cache pass writes the sampled depth with `AlwaysDepth`, and discards untouched far-depth pixels; the dynamic scene then draws with `autoClear=false` and a temporarily null background. This avoids Three's Color-background forced clear. Camera layers, background, render target, and `autoClear` are restored in `finally`.

Pinned Three's render target defaults resolve the multisampled depth buffer, and `WebGLTextures.updateMultisampleRenderTarget()` blits depth when that default is enabled. The `DepthTexture` is therefore not obviously unpopulated. Static MSAA color/depth are resolved before the dynamic scene is rendered, however, so per-sample occlusion at silhouettes cannot be assumed identical to a one-pass render. Actual image inspection is required for leaf/ruin/water boundary halos or lost fine edges.

### Shadows

Lights participate in both cache layers. Pinned Three's shadow-map traversal tests the main render camera's layers, so the static pass includes the current static casters. The shadow map is explicitly dirtied on world replacement and quality changes. Current dynamic objects already had casting disabled before this cache patch; the patch does not newly remove their shadows. The default layer remains enabled on scene meshes and lights, preserving the direct-render camera path.

### Invalidation and direct path

- The cache is used only in settled overview. Follow, detail, and residual camera easing use the ordinary full 3D draw.
- The key includes board dimensions, quality, drawing-buffer size, fog near/far, tone-mapping exposure, camera world matrix, and camera projection matrix.
- Resize and low-quality transitions explicitly invalidate; target size changes dispose the previous target.
- World replacement explicitly invalidates and regenerates shadows. Current static scenery is a deterministic function of dimensions, so a new run with unchanged dimensions does not require a rebuild.
- Lights, fog color, static materials, and background are private constants in the current factory. They are not included in the key; this is not a current stale-cache defect because no runtime path mutates them. Any future mutable lighting/material API must extend invalidation.
- Subpixel overview easing ends at a squared offset error below `1e-10`. This makes the pose truly stationary before caching without bypassing the visible transition.

### Failure and lifetime

If `EXT_color_buffer_float` is absent, the renderer retains the ordinary 3D path. A thrown draw error is caught by the app and switches to its safe 2D renderer. Context loss invokes the same app fallback, which disposes the old renderer and replaces the canvas. The product does not continue using the same lost/restored renderer instance; missing cache invalidation for a restored original context therefore is not an application defect in the current integration.

There is at most one retained static render target. Replacement/disposal calls its `dispose()`, which pinned Three uses to release color texture, depth texture, framebuffer, and multisample renderbuffers. The cache geometry/material are also disposed, alongside the existing observer/listener/world/serpent/shadow resources. This establishes ownership and a size-bounded lifetime in source, not measured long-run stability.

The initial cache chose `min(4, renderer.capabilities.maxSamples)`, which is the generic maximum rather than the supported sample set for RGBA16F and the depth format. The follow-up revision queries `getInternalformatParameter()` for `RGBA16F` and `DEPTH_COMPONENT24`, chooses their highest common sample count at most four, and falls back to a non-multisampled target when there is no such count. The depth format matches pinned Three's choice for the `UnsignedIntType` depth texture. No unsupported framebuffer failure was reproduced; this concern was addressed in source before the completed image comparison.

## Actual-image and runtime evidence limit

The intended comparison used the public round-4 frame, identical cameras, fixed presentation time, and reduced motion only for the captures. **No before/after cache images were produced.** The capture owner stopped local GPU work on the root agent's instruction and confirmed all of that owner's browsers/harnesses were closed. It handed off `/tmp/snake-cache-builder-report.md`, which this reviewer read.

The builder's attempts failed before obtaining meaningful candidate output. A small full-app run could not reach three real frames of the unchanged before-cache renderer in 30 seconds. A separate minimal same-origin harness logged `MODULE_READY` and `RENDERER_READY`, then timed out during that baseline renderer's first synchronous draw without logging `FIRST_DRAW`. Neither reached the cache condition. The builder recorded cgroup memory at approximately 98% of its 8 GiB limit and 97,213 memory-limit events during the window. These are evidence that the local window is unsuitable for attributing performance; they do not prove the cache has no runtime defect.

This reviewer inspected `/tmp/snake-merge-after.png` only as older pre-cache context. It contains a result/intermission overlay obscuring the center of the garden and comes from the prior material-merge work. It cannot establish the final cache's pixels, unobscured board/character equivalence, or dynamic completeness. There is no honest visible-occlusion/color verdict for the final cache yet.

The final builder report records `node --check public/snake-stream/renderer.mjs` exit 0. The root's 515/515 Node suite result predates this cache change and is expressly not credited as cache validation. No cache performance, resize, quality-transition, world-replacement, unsupported-device, context-loss, or resource-soak result was obtained by this reviewer.

## Required follow-up before accepting the cache

1. On an isolated runner, produce identical unobscured full-scene frames through `/tmp/snake-renderer-before-cache.mjs` and the final renderer. Inspect actual images for distant-bank color, leaf/ruin/water edges, static/dynamic occlusion, contact shadows, serpent, hazards, portals, and fruit. Do not infer equivalence from matching object counts.
2. Exercise settled overview reuse, transition to follow/detail and back, resize, quality reduction, and board-dimension replacement. Require correct buffer sizes and invalidation, no stale scenery, no disappearing dynamic meshes, and clean WebGL errors.
3. Exercise context loss through the actual application and confirm that the fallback stays readable while the authority continues.
4. Measure warmed-up completed real draws and GPU work with the full scene visible. Preserve the existing 17 FPS minimum and maximum inter-frame gap below 250 ms; do not substitute an unrelated RAF loop. Count cache rebuild passes in the samples where they occur.
5. Verify resource counts across repeated rebuilds/resizes and dispose. A single owned target in source is not a measured leak/soak result.

## Claims expressly not made

This review does not infer performance from tests, `requestAnimationFrame` counts, or reduced draw calls. It does not declare a Snake Pass benchmark win, commercial art equivalence, complete mobile/camera/lifecycle coverage, a resource soak pass, or production readiness. Those need their corresponding real-output evidence.
