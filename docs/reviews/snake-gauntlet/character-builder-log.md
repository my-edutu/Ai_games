# Character module handoff

Implemented only `public/snake-stream/serpent.mjs`.

Interface: `createSerpent(THREE)` returns `{group, update(paths, options), stats(), dispose()}`. Paths are head-to-tail arrays of contiguous `{x,z}` points. Options support seconds-based `time`/`delta`, `direction:{x,z}`, numeric `eating` and `danger`, `reducedMotion`.

Original assets: procedural DataTexture pigment + scale relief, custom dynamic continuous tube, authored ellipsoid anatomy, spline smile/brows/forked tongue. Jade green skin carries golden leaf-shaped saddles, dark saddle borders, cream ribbed belly. The facial model includes amber irises, pupils, dual catchlights, nostrils, cheek/crown markings, articulated cream jaw, smile crease, reactive brow/eye poses, blink, tongue flick and small swallow/turn animations. Reduced motion suppresses idle head/body, blink, jaw and tongue movement.

The body is a tensioned cubic spline with 20 radial facets and roughly seven axial samples per world unit, dynamically updated in fixed buffers. Head direction smooths except discontinuities; no index connects separate paths. Body radius 0.319, center y=0.4, crown/eyes peak near y=0.8. The final 2.7 cells taper into a fine tail. The isolated one-point path is a compact capped fragment. No imports, external fetches, authority writes, frame-created geometry or growing pools.

Verification: `node --check public/snake-stream/serpent.mjs` passes. A real-Three Node assertion script exercised two portal-separated paths, checked every drawn triangle edge for bridging, updated a 448-cell serpentine path 100 times, checked finite vertices and unchanged geometry counts, empty and isolated restart paths, and repeated disposal. All passed. At 448 cells: 3,130 rings, 65,730 body vertices, 125,160 body triangles. Fixed capacity 8,192 rings; body buffers 9,437,184 bytes. Eight geometries, eleven materials, two 1024x512 textures. `stats()` exposes these values plus path count, truncation, disposal. All owned resources are disposed idempotently.

Risks / pending evidence: actual browser capture, illumination/contrast tuning, mobile and independent visual review are owned by root integration. Fixed cap is comfortably above current 448 cells; over-cap input deliberately truncates geometry and reports `truncated:true`. A portal split caps visually through the portal prop; long split fragments keep their full radius up to the portal. These are presentation choices only. No production-readiness claim.

## Round 4 anatomy and detail tiers

Blind critic's frog silhouette finding addressed with one continuously lofted skull/neck (0.99 long, 0.64 wide; length/width 1.547), lowered side eyes demonstrably below its crown, a lengthened cream mandible and smile, individually defined labial scales and swept cheek/brow anatomy. A dedicated face pigment texture provides golden muzzle gradation, jade crown, cream underside and larger scale detail; bump and roughness variation cover both face/body. The tube narrows beneath the skull to prevent a bulb/seam at its forward end.

New optional update option `detail:'low'` (also `'overview'`, numeric `0`, or `quality:'low'`) chooses prebuilt simpler skull, spheres, and spline details plus 8 body radial facets ×3 axial samples/unit. Default/`detail:'high'` retains 20 radial facets ×7 axial samples/unit and full facial geometry. No geometry is created during switching. Both variants allocated once and disposed together. `stats().detail` reports current mode.

Node/real-Three verification passed repeated high→low→high→low switches, all active indices inside active vertex count, finite positions, 448-cell capacity, no portal triangle bridges in either tier, head length>1.5×width and both eyes below crown in both tiers, fixed resource counts, and idempotent disposal. At448 cells high:125,160 body +37,376 head =162,536 triangles; low:21,456 body +4,480 head =25,936 triangles (84.0% reduction). Allocations fixed45 geometries/12 materials/4 textures; body buffers remain9,437,184 bytes. Actual visual/browser verification pending root capture; no browser launched during this round per root request.

## Round 5 expression / cranial integration

Inspected round4 actual screenshot plus independent critique/reference before edits. Visible eyes enlarged45%, moved from lateral x±.235/y.122/z.015 to x±.184/y.202/z.098 and rotated toward the face (yaw±.40 versus±.78). Two broad supraorbital swells are directly displaced into the one continuous skull geometry. Tubular eyebrows replaced by rolled upper-lid surfaces blending back into those cranial supports. Both eye tops remain at y≈.841; skull support reaches y≈.834 high/.824 low. Their supported eye shape is substantially different from detached eye knobs.

Removed ten small lip-division meshes and changed two pale upper-lip tubes into fine gold edges. Lower jaw is a single fuller cream silhouette, with shallower inset mouth and no idle jaw gap. Facial scale contrast reduced and fades before the nose tip, avoiding conspicuous convergent UV scale spokes. Palette and body design retained.

Verification (real Three Node assertions): enlarged eyes remain within head's cell width and y<.86; eye bounds overlap substantial cranial height; high→low→high transitions retain fixed resources; every head position finite; active body indices valid;448 cells do not truncate; separated portal paths contain no bridging triangle; repeated disposal passes. Now25 owned geometries/12materials/4textures (fewer than previous45geometries). At448 high158,216 total triangles, low25,264 (84% reduction). No browser launched; visual verdict pending root capture.
