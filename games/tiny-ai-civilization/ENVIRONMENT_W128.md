# W128 · Real medieval freight and household streets, not invisible road decals

**Branch:** `feat/tiny-kingdom-post-main-gauntlet-20261031`, Draft PR #64 ONLY. **Baseline:** `2f6deb43feb1a1557848d44def53a6109deb1ab1` permanently frozen G088. No merging or main changes. Original game is playable in `public/tiny-kingdom/index.html`.

## What was wrong in the actual source

Both `farmMarketStreet()` and `marketToRealHomeStreet()` generated legitimate physical 3D ROAD panels using the actual navigation route. With tangent `[+x,0]` and cross-road width directed toward `+z`, their triangle upward normal was **negative** (example -1.40 on the W83 1.4m corridor and -1.18 on the W87 1.18m household lane). At draw time the original renderer enables WebGL `BACK` face culling, so the texture-atlas roadway remained visible but the real rut/stone geometry could be completely culled. The original historic wide-shots alone do not prove this bug; the sign follows directly from the actual vertex writer and WebGL cull direction. Physical browser screenshots are still the final gate.

## Connected implementation

- `upwardRoadQuad` checks the *true winding* of a generated surface and reverses only downward oriented road panels. Both genuine streets use it, preserving the entire original authoritative route and the material, count and coordinates of every panel. The code leaves roofs, architecture, original geometry helpers and all actor paths alone.
- `renderRealRoadsideMicroterrain(points)` shares the **same W83 `routeBetween(...FARM_MARKET_STREET_ORIGIN, ...FARM_MARKET_STREET_DESTINATION)` return value** and uses absolute terrain samples; it never invents a shorter traversable route. Shallow, passable drainage contours start 1.08m or more from centre, with a clearly open 1.4m existing carriageway. Reject world footprints for existing buildings, fields, market, granary front and stream. Shrubs are <=0.5m and bounded to the rural side.
- No authoritative energy/stock/merchant/work/save state is touched, no independent buffers, no new shader, no hidden citizen or distant building. Only the original civic season VBO contains these triangles and the existing spatial culling decides whether to draw them.

## Actual isolated validation

| Contract | Result |
|---|---|
| Original downward freight and household panel normal | -1.40 / -1.18, RED |
| After upward-only winding correction | +1.40, all tested tops visible |
| Real-world authority/nav/field fixture | byte-identical before/after |
| Original freight and home route coordinates | unchanged |
| Simulated connected rural fixture | 58 sampled segments, 69 accepted verges, 47 safe rejections |
| Authentic route fixture new geometry | 207 shallow drainage panels, 438 triangles |
| Non-overhanging rural scrub | 4 clumps, <=0.476m |
| Scenic budget | <=2,600 new triangles, no new draw or buffer |
| Real WebGL, 120-day growth, GPU/CPU p95/p99, memory | PENDING exact-SHA CI |
| LOOK/FEEL/PLAY acceptance and commercial visual parity | NOT PROVEN / FAIL |

RED-before source observation and green isolated geometry were checked in V8. The source and browser contracts are in `scripts/tiny-kingdom-w128-visible-road-contract.cjs` and `tests/browser/tiny-kingdom-w128-visible-road.spec.cjs`.

## Independent specification/quality critique

**Spec compliance:** Navigation, citizen/job/stock/river coordinates are unchanged. Original 3D public route is physically exposed, and new rural edges skip physical gameplay footprints.

**Quality concerns:** The road may still need better *moving* composition; deliberately low scrub will not create false walls but may be subtle. Correctly oriented dirt/stone could increase fragment cost, so don't claim an FPS gain. The original flat-looking environment, roof occlusion, small characters and inadequate physical device FPS remain blockers.

**Required independent pass:** Exact-head authentic desktop + 390px browser snapshots, original moving farm→loaded courier→market→home, Day1/Day120 world-state alignment, GPU/CPU p50/p95/p99, memory slope and source-matched G088 film. A success requires viewable genuine gameplay and independent experienced reviewers, not only source statistics.

**Rollback:** Revert this W128 environment commit on its PR branch; do not change saved world/replay schemas or touch main. Never promote until an explicit user merge instruction.
