# Tiny Kingdom W127E — shared terrain sampling and authentic wetland silhouettes

**Scope:** Draft PR #64 only; fixed G088 source `2f6deb43feb1a1557848d44def53a6109deb1ab1`. Read alongside the Living Valley visual workstream and its phase 1 scorecard.

## Profile-led cause

The previous valley surface's 41×41 tiles contain 6,724 real terrain triangles. Although the geometry had been rebuilt into four centre fans per tile, `turfTri` recomputed the same terrain heights, normal derivatives, colours and seasonal climate for all 20,172 submitted vertices. Exact original material/normal/position samples are shared by just 1,764 corners + 1,681 tile centres = 3,445 locations. This was excessive geometry-build CPU work, particularly on seasonal transitions. It is NOT proof this is the dominant GPU raster or video-encoding cost.

The authentic riverbank had 72 repeated groups of 3 straight cylinders (5 sides × 3 triangles) each capped by a 5-triangle cone, giving 4,320 source triangles. Their repeated silhouette was both visibly artificial and a candidate for safe art-budget recovery.

## Connected code correction

- `shadeValleySurfaceVertex` computes height, normal, pigment and the original 10-float vertex structure once per distinct corner or centre. `buildValleySurface` emits identical four-facet triangle ordering with identical x/z arithmetic; immediate temporary samples are unreferenced after build. No simulation/NavMesh/runtime shader/renderer changes.
- `riverReeds` now constructs original seasonal sedges with hand-designed crossed leaves, subtle lean, muted seed heads and deterministic spacing derived from existing `biomeHash`. Skip bounds protect the true bridge and original crossings. Geometry remains in the existing retained seasonal festival/scenery buffer and existing physical frustum policy.
- `getValleySurfaceBuildAudit` and `getRiverReedVisualAudit` expose exact actual sample/triangle accounting, no fictitious FPS or staged physics.

## Measurable isolated source-level results

| Resource / invariant | Previous | W127E source result |
|---|---:|---:|
| Native valley terrain triangles | 6,724 | 6,724 |
| Native valley mesh floats | 201,720 | 201,720, Float32 bit identical |
| Terrain shade evaluations per seasonal build | 20,172 | 3,445 |
| Avoided repeated shading | — | 16,727 (82.9%) |
| Original wetland reed triangles | 4,320 | 1,242 |
| Original wetland stems | 216 | 207 |
| New GPU draw calls / independent buffers | — | 0 |
| Changed world coordinates, navigation, economy or RNG | none | none |

The original `turfTri` remains unchanged for other surfaces. All four seasonal terrain profiles are compared against the old fan algorithm under actual terrain height source. All four reed palette states must remain finite, bounded, rooted and deterministic.

## Required post-commit rejection gates

The source-level contract `node scripts/tiny-kingdom-w127e-valley-reeds-contract.cjs` is expected to pass the entire four-season parity/geometry dataset. The updated original W126E Playwright spec must separately exercise 1024×640 and 390×844 real WebGL, preserve genuine people and snapshots, take real farm overhead/human/river captures, and verify the scene budget. The existing exact-head 120-day long-soak must then prove all citizens/buildings, full geometry audit, byte-identical replay, bounds and true browser errors. Compare Day-1/Day-120/market/mobile with immutable G088 using genuine similar authority state; do not conflate SwiftShader capture cadence with hardware FPS. Physical GPU frame p95/p99 and independent blind LOOK/FEEL/PLAY review remain gates. **No automatic milestone, release or merge.**
