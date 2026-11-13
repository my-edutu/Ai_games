# Dungeon Session 5 — Connected Journey Architecture Handoff

**Status: IMPLEMENTED IN DRAFT PR #49 — VISUAL ACCEPTANCE NOT YET PROVEN.**
Reference point: existing M1 pinned baseline `281735d0910c6b2443648af976003d50412ee324`.
Workstream: **Entry → actual ordinary encounter → actual Warden Court**. Do not merge on this report.

## Authority and scope

This change touches only read-only presentation code. `games/ai-dungeon/src/index.ts`,
map generation, combat authority, enemy AI, hazard locations, boss rules,
tick ordering, navigation, global lighting and camera policy are unchanged.
No visual doorway is presented as traversable: every blind niche is backed
by an existing `#` cell; each complete corridor arch exists only if both
its actual forward and rear floor tiles are `.` and both of its foundation
supports are in adjacent original `#` cells. No invented stair or ramp.

## Production integration

- `public/ai-dungeon/connected-journey-plan.js`:
  bounded deterministic BFS from the authoritative party spawn through an
  authentic living ordinary foe's reachable tile to the true Warden exit.
  A missing foe results in an explicitly tagged **topology-only** chamber;
  it never claims a battle occurred. Plans at most three thresholds, three
  entry masonry niches, six ordinary-chamber niches, nine outer court niches;
  keeps full central court combat/telegraph clearance.
- `public/ai-dungeon/connected-journey.js`:
  original extruded, closed-faced load-bearing masonry and ironwork with
  different physical silhouettes:
  1. arrival gate — battered squared foundation, lower lintel and broken crest;
  2. battle nave — tall pointed, ribbed wall chapels and blind recesses;
  3. Warden court — tall double-rib counterfort and severe crown.
  All are installed on existing impassable wall mass. The crossing threshold
  consists of two blocked-cell side piers and an **open overhead** pointed vault.
  Materials reuse ordinary PBR descriptors `bearing-stone-and-foundation`,
  `solid-blind-recess` and `aged-iron-fittings`; no shader/material
  system overhaul, new textures, practical lights or effects.
- `public/ai-dungeon/environment.js` accepts the untouched `s.units` list
  from `public/ai-dungeon/app.js`; adds the new masonry; extends existing
  dressing metrics, bounded camera-volume input and disposal.
  It preserves the existing expedition stonework, naves, torch architecture,
  original Warden Court, authored set pieces, floor ruins and wall cutaways.

## Deterministic geometry contract

`planConnectedDungeonJourney(map,floor,exit,units)` returns
`{status,route,chapters,thresholds,facades,occluderBounds,materials,metrics}`.
Both route and world-space placements are deterministic and use no
`Math.random`, `Date.now`, asynchronous asset fetch or authority RNG.
Each facade is tagged as blind, wall-supported and outward-facing.
Camera bounds model each arch as **three distinct volumes**: a left
solid foundation pier, right solid foundation pier and high vault crown;
**the central navigable gap is never treated as an opaque solid box.**
Other bounds describe true wall-facing niches. The existing physical-camera
interface consumes these bounds; its policy remains unchanged.

The existing multi-hero cutaway decides which individual facade/threshold
instances to recede; dirty-band instance updates avoid rewriting all matrices.
Disposing a floor removes its instances and releases its geometries and
materials; source simulation/replay data is never changed.

## Budget and falsifiable evidence

| Feature | Upper bound for this addition |
| --- | --- |
| New InstancedMesh batches / draw calls | **11** (3 roles × 3 material parts + 2 threshold parts) |
| New geometries | **11** |
| New shared material instances | **3** |
| Facade placements | **18** |
| Vaulted thresholds | **3** |
| Physical occluder volumes | **27** (18 wall niches + 3 × 3 arch pieces) |
| New textures, shader passes, dynamic lights | **0** |
| New walkable ground obstacles / collision or AI edits | **0** |

A **non-WebGL JavaScript mock** of the current renderer on the 11×11
adversarial winding-map fixture yielded 11 draws, **8,244 instanced
triangles**, **36,576 bytes** of static vertex/normal/index/instance arrays
(not VRAM, driver overhead, shader storage or total world budget), 27
physical bounds, three distinct facade mesh triangle signatures
(348 / 364 / 460), and zero instance writes on a repeated identical
cutaway after 21 initial changed bands. The render mocked mesh
operations and checked indices, lifecycle, deterministic placement and
disposal; **it is not a genuine WebGL capture or a frame-time measurement**.

## Automated tests and honest acceptance gates

- `tests/foundation/dungeon-connected-journey.test.cjs`:
  genuine seeded `DungeonRuntime` authority maps, no invented foes,
  deterministic legal paths and original fight coordinates; walls/thresholds
  supported only in blocked cells; reproducibility, bounds, disposal wiring.
- `tests/browser/dungeon-connected-journey.spec.cjs`:
  live autonomous HTTP states and actual WebGL; output should include
  `artifacts/dungeon-connected-journey-{cinematic,tactical,chase,mobile}.png`
  and `artifacts/dungeon-connected-journey-evidence.json`, plus CI attachment.
  It checks authority tick progression, material costs, visible heroes,
  three existing camera modes and mobile viewport.
- Existing `tests/browser/dungeon-m1-organic-journey.spec.cjs` supplies
  the independent **real, ordered DungeonRuntime** entry → ordinary combat →
  Warden → floor progression → defeat/restart film. On this branch it should
  render the new environment without altering its evidence contract.

Commands:

```sh
npm run build
node --test tests/foundation/dungeon-connected-journey.test.cjs
npm run dungeon:test
npm run dungeon:assets
npx playwright test -c tests/browser/dungeon.playwright.config.cjs dungeon-connected-journey.spec.cjs
```

**Not yet accepted:** inspect the genuinely completed Actions/browser
screenshots and films from several camera directions; confirm the walkable
corridor and fighters remain readable, verify Warden telegraphs are not
occluded, compare matched baseline visual quality and actual measured
GPU/CPU/render-capture costs. Passing a planner fixture or a screenshot
file-existence check is not an architectural quality verdict. If Actions
are queued/cancelled because other PR #49 sessions are publishing concurrently,
do not represent the capture as completed.

### Ownership

This workstream owns only architectural placement, geometry, rendering
resource lifecycle and physical occluder volumes. Character rigs and art,
combat/AI/authority, material system, global lighting, camera policy,
combat visuals, and sound remain the responsibility of their own sessions.
