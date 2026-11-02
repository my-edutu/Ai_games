# Display-color cache — independent source-only follow-up

Date: 2026-10-30. Reviewer: `snake_cache_critic`.

Candidate: `public/snake-stream/renderer.mjs`, 392 lines, SHA-256 `dc7363339a8767fbd3e297f46059d3e42a85f4a1580cd310e08d4bb92af6d74c`.

**No source blocker was established in the bounded display-color-cache change. Actual shader output, image equivalence, and performance remain for the builder's smoke check and the lead's isolated CI.** This reviewer did not run a browser or edit repository files.

## Shader and color review

Pinned Three.js 0.186 `WebGLProgram` injects `tonemapping_pars_fragment` only when program tone mapping is enabled. The new bake material has `toneMapped:false`, so its explicit include provides those functions and `toneMappingExposure` once. No duplicate tone-mapping definition was found.

Three injects `colorspace_pars_fragment` unconditionally for ordinary ShaderMaterial. This supplies `sRGBTransferOETF` once, so the explicit call is available without adding a duplicate include. The bake performs the intended ACES mapping, sRGB conversion, then the already-reviewed output-space fog operation.

The display target uses RGBA8 with `NoColorSpace` metadata and nearest filtering. Consequently it stores already-encoded bytes without a hardware sRGB decode on sampling. The final material is `toneMapped:false` and contains no tone/output-color chunks; it copies those bytes and the original resolved depth. No double conversion or obvious missing conversion was established in source.

The bake retains HDR/MSAA input and uses the existing near/far depth reconstruction and fog color. Exposure participates in the invalidation key, so changing it regenerates display color. Current fog color and tone-mapping mode remain private constants.

## State and lifetime review

The original HDR color/depth target remains unchanged. The new display target is depthless and non-multisampled. It is recreated alongside the original target on size changes and released on shutdown. The added bake material is also disposed.

The fullscreen quad switches to the bake material only for the display-target rebuild, then returns to the copy material. The `finally` block also restores that material, render target, camera layers, scene background, fog, and autoClear. The key is updated only after the display bake completes.

## Limits and next evidence

This change adds one retained RGBA8 texture, approximately four bytes per drawing-buffer pixel before driver overhead. It moves tone mapping/conversion/fog work to rebuilds, but source structure does not establish a measured frame-rate gain.

The actual matched CI images reviewed in `/tmp/snake-cache-visual-review.md` belong to the preceding 351-line renderer, SHA-256 `ac983a03…`, not this candidate. They must not be relabelled as evidence for the new byte-cache path.

An additional 8-bit storage step may create small quantization/dithering differences. It also does not inherently correct the already-observed harder/brighter fine static edges caused by the prior resolve/composite path. The next matched real capture should check both interior color and those boundaries, followed by the unchanged desktop pacing gate and lifecycle checks.
