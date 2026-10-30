# Lighting and timber material proposal

## Integration boundary

Runtime files were not modified. Apply `lighting.patch` to the current branch, or copy `scenery3d.js` and apply only the constructor lighting delta from `room3d.js`. The latter avoids overwriting the parent's parallel mechanism batching changes. The patch was generated against the two `*.baseline.js` files retained in this directory.

The final inspected captures are in `captures-final-paint/`. `report.json` records the exact in-memory module hashes that were served to Chromium; both candidate file hashes match that report:

- scenery3d.js: `48521c084b27ed7f9b86698b6a463d43f904b742388759bb5cba5b8a365bf494`
- room3d.js: `b26fbeba19dd62e3dbabe9013c8d9b3226105500c570600fe75ec5d34e0ef5f3`

## What changed and why

The old low tier disabled every shadow map. Shelf backs, drawer recesses and underside joins consequently received broad hemisphere fill without structural occlusion. The wood UVs also stretched the full photograph of a boarded floor across every piece of furniture.

The proposal computes static ambient and key-light visibility against the room's oriented solid timber boxes. Twelve cosine-weighted hemisphere samples produce ambient recess shading; four key directions produce soft static contact shadows. Two normalized bytes per vertex carry that result in the existing merged batches. Dynamic materials get a neutral `[1, 1]` fallback, preserving their existing geometry. Ambient shading affects indirect light; the static key visibility affects the existing directional light.

The bake is used on every quality tier. Immutable timber stops casting live shadows; the existing four moving Archivist shadow meshes still use the high-tier PCF map. This removes the second submission of the merged static wood. There are no additional render targets, post-processing passes, texture assets or lights.

Only broad receivers gain subdivision vertices. Mouldings, scaled unit bars, the hidden floor base and ceiling retain their previous topology. Existing part positions, silhouettes, public attachment surfaces and gameplay state paths remain the same.

Wood UVs now follow each member's longest physical dimension, including scaled bars, and sample one board of the source photograph. Furniture roughness varies through the existing map. Brass uses the existing metal roughness map. The room retains four lights, arranged as a window key, wall sconce, pendant and weaker hemisphere fill. Paint and plaster use zero metalness, including a separate diffuse ceiling material that costs one batch and reuses an existing texture.

## Actual browser results

The final fixed eight-puzzle production opening frame produced:

| Tier | Draw calls | Submitted triangles |
| --- | ---: | ---: |
| Low | 171 | 115,832 |
| Medium | 171 | 115,832 |
| High | 175 | 118,808 |

The previous live-static-shadow candidate submitted 138,408 triangles on high. Removing that redundant static shadow pass saved 19,600 submitted triangles and three calls. The diffuse ceiling subsequently added one call.

All three tiers compiled and rendered without page errors or shader errors. `room-low.png`, `furniture-low.png`, `room-medium.png` and `room-high.png` were viewed. They show a meaningful improvement in shelf/desk depth, grain scale and focal lighting. They do not establish a win against The Room 4; a fresh independent visual critic must make that judgment after integration.

Ten actual theme rebuilds returned to exactly 498 outstanding WebGL buffers for the archive layout and 509 for the laboratory layout. Renderer texture count stayed 21; programs stayed 17/18; geometry cache stayed 243 after both layouts warmed. The separate static texture cache stayed 16. Disposal deleted 479 further buffers and lost the renderer context. The raw counter remained at 19 after context loss; the report does not claim a zero counter or identify those built-in/shared objects as leaks.

These are Chromium/SwiftShader results on the shared host, not native frame-rate evidence. The initial page became renderer-ready in 10,488 ms. The first laboratory bake plus render took 3,277 ms; subsequent cached rebuild-plus-render samples were 852–1,553 ms. These wall times include shared-host contention and shader/render work. The first startup attempt timed out before renderer readiness during the server route transition and is retained separately; it is not counted as a rendering pass.

## Construction cost and lifetime

Static triangles increase by 4,704, from 35,582 to 40,286 for the archive. The number of static material batches increases from 18 to 19 only because the ceiling now has the correct independent finish. Static merged attribute bytes increase by 684,144, including the 232,560-byte visibility attribute. Laboratory visibility adds 233,832 bytes. The two CPU caches therefore retain 466,392 bytes of visibility values in total; they own no GPU handles and are shared by room instances like the existing bounded texture cache.

The cache has exactly two authored keys, archive and laboratory. New per-room batch buffers copy the cached values and remain owned by the existing `sceneryBatch` disposal path. The BVH, ray vectors and temporary vertex memoization map are construction locals and become collectible after the first bake. All theme rebuilds reuse the two fixed layouts.

`measure.cjs` runs the real pinned Three.js geometry builders with canvas/image loading stubbed, verifies finite geometry bounds, exact previous-batch dispose events, bounded geometry/texture counts over three complete theme cycles, and shader hook/default-attribute installation. Its result is `allocation.json`; it is construction/lifecycle evidence, not a visual or GPU performance claim.

## Remaining integration work

The parent found pre-existing draw-call violations in later actual rooms. This eight-puzzle fixture passing 190 calls does not replace that broader live gate. Keep the same 190-call/150,000-triangle bar and validate the combined batching, inspection and lighting source against the live difficult-room fixture.

The bake uses box proxies for solid members and interpolated vertex visibility. It approximates rounded silhouettes and small shadow penumbrae. The fixed key position is exported by scenery and consumed by the room constructor, so the shader bake and real light agree. If authored geometry or that key is changed at runtime in future, the two cached layouts would need an explicit invalidation contract.

Rollback is the inverse two-file patch. No authority, privacy, replay, polling or public-slot definitions are part of this change. The final Chromium process is closed and the browser slot has been released to integration.
