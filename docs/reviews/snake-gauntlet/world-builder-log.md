# Environment module readiness

`public/snake-stream/world.mjs` exports `createWorld(THREE, {width,height})` returning `group`, `update(snapshot,{time,delta,reducedMotion})`, `dispose()`, `stats()`.

Original procedural assets: generated stone/moss DataTextures, custom folded leaf geometry, shared rounded masonry, articulated fern fronds, rosettes, tree crowns and roots, carved frieze, rear arch and columns, layered cliff masonry and ivy, turquoise rippling water and short waterfalls. Rear terrace supports all architectural and tree scenery. Main playing field remains at y=0 with exact centered cell coordinates.

Snapshot props: moss-capped stone obstacles; amber retracted hazard wells and raised red three-spike active hazards; matching-colored pairs of inset portal rings with four diamonds; red fruit with leaves/stem and golden objective rim, gold fruit and additional floating crown for bonus. No rule state mutation or global randomness.

Resources bounded by dimensions. 40 mesh submissions, 6,230 static instances, 20 geometries, 19 materials, 2 textures; every dynamic pool has a board-size capacity. 427,340 visible triangles in the headless representative prop scene (before shadow passes). No per-frame GPU geometry/material creation. Signature changes update instance transforms. `dispose()` releases geometry, material, texture and instance buffers, and is idempotent.

Verification: Node syntax check; actual pinned Three.js construction; deep-frozen snapshot update; 1,000 repeated updates with stable resource stats; empty/reset props; repeated disposal. All passed. Real rendered quality, draw-call/triangle totals, mobile framing and integration camera/lighting must be assessed by lead captures. Static scene bounds approximately x ±18, z -14..11, y -3.6..7. Main light should be warm from upper front-left with cool fill; recommended background muted teal.

Known limitations: no real refraction/SSR, and water does not reflect the snake; waterfall geometry is restrained decorative strips. Dynamic props do not display portal index text, but pair-specific hue and matching shape are implemented. Scenery casts shadows: renderer shadow budget must be checked against integrated snake and light settings. No benchmark win claimed without rendered critic review.

## Round 2 measured revision

Inspected actual `round-1-overview.jpg` and agreed the repeated leaf-shaped moss field dominated the composition. Replaced the field with a continuous 1024×512 texture sampled in instance world coordinates, subdued cell seams, broad low-contrast weathering and sparse individual fractures. Enlarged fruit and its raised bonus crown. Added five asymmetric cool distant islets in three batches for depth.

Measured dominant triangle costs before: 186,480 tiny flower triangles, 129,184 leaf triangles,48,384 field-tile triangles. Replaced spheres with eight-triangle petals, folded leaves with eight-triangle meshes, and masonry/tiles with18-triangle top-bevel blocks. Preserved the number and placement of foliage instances.

Current representative scene: **66,188 triangles**,6,270 static instances,43 mesh objects,22 shared geometries,21 materials,3 textures. This is an84.5% triangle reduction from427,340; actual frame time remains the renderer integration owner's measurement. Counts include two obstacles,two hazards and one portal pair.

Verification passed on28×16 and9×7 boards:1,000 updates with identical resource statistics; immutable input; odd-dimension generated shader numeric syntax; empty reset; idempotent disposal. New WebGL shader compilation and actual output still await lead capture. No benchmark pass claimed.

## Round 4 static merge and measured runtime

Baked all 6,270 original static transforms into 13 ordinary indexed material meshes. Preserved authored geometry, inverse-transpose transformed normals, tint colors, and texture UVs; the continuous board map now uses baked world-space UVs and the standard material shader. Static geometry is tagged `mesh.userData.staticWorld=true`. Dynamic props remain live bounded pools.

Structural equivalence check compared 397,242 static vertex coordinates between original instances and merged output; maximum absolute difference was 0.00000187 world units, consistent with Float32 rounding. Frozen-snapshot 1,000-update resource checks and disposal passed.

Independent profiler's controlled A/B used the same frozen length-96 snapshot, renderer, serpent, camera, twelve warmup draws and 24 measured draws per condition. Static merging improved throughput from 2.29 to 3.88 FPS and median GPU time from 347.6 to 198.9 ms. No GL errors. This is a measured improvement, but it misses the 17 FPS target. The root/profiler is evaluating static color/depth caching rather than discarding scene richness.

Inspected `/tmp/snake-merge-after.png`: visible floor, stone and foliage retained their composition; result overlay masks the central field, so unobscured capture still required.

After that A/B, fixed the visible finite water-plane edge by enlarging the two-triangle plane to 240×240. Lowered, widened and moved distant islets farther back to read as layered banks rather than close giant blue boulders. Added unequal tree branch height/reach. Dormant hazard wells now carry a solid amber caution triangle with three dark retracted slots, distinguishable by shape from portal pools. Active spikes are unchanged.

Current representative world: 66,243 triangles, 6,270 static authored placements compiled into 13 static meshes; 39 total mesh objects; 36 geometries, 22 materials and three textures. Last visual refinements await integrated runtime capture; no benchmark pass claimed.
