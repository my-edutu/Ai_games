# Pass185 — shared unit-length articulated rod geometry (2026-11-06 UTC)

## Phase-0 implementation candidate

The last measured full-browser six-run failure was **102 renderer geometries** against the unchanged **<100** gate. Pass176's actor primitive sharing reduced some duplicate resources, but each differently long tube/bar still used a distinct `THREE.CylinderGeometry(top,radius,length,radial)` pool key. In Pip and especially Thornback, articulated braces of identical radius/taper but different length were therefore not sharing one buffer.

This candidate changes the original production actor rig (not a screenshot or HUD) to use **unit-height cylinders keyed by radius/top**, with each actual modeled rod given `mesh.scale.y = length`. This is a geometric equivalence under Three's normal matrix: a y-scaled tapered unit cylinder has the same world-space vertices, normals, endpoints, connection and silhouette as the original height-specific cylinder. Materials, pivot hierarchy, animations, autonomy, public-observation privacy, mobile framing and actor authority are unchanged. It is not a quality win or an additional gameplay feature.

## Verification and evidence boundary

An added installed-Three regression test compares all actual vertices/normals of height-specific and scaled-unit cylinders across different lengths, tapers and both model quality resolutions, then creates both characters, exercises movement and verifies shared primitive refcount release. **The shared coding workspace/worker tunnel is still NOT_FOUND**; these installed-Three tests and real Playwright WebGL at this exact commit have NOT been run locally. The currently queued WebGL and whole-repo checks on prior head `d4f5006` do not approve this new candidate. Retain the exact six-run browser resource guard (<100), strict 320/390/844/1280 crop/HUD checks, published-world restrictions and fixed Nintendo benchmark without relaxation.

## Next gate

Require actual current-head CI measurement across six run transitions, genuine source-bound full-resolution WebGL captures of Pip/Thornback/pressure/gate/key, dated PNG hashes, and independent full-image comparison against the original official Captain Toad screenshots. If renderer resource use still exceeds the unchanged budget, inspect the exact breakdown rather than claiming this pooling fix succeeded. No merge/deployment. Keep PR #53 OPEN DRAFT.
