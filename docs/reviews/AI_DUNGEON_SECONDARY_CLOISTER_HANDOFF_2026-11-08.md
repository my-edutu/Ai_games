# Session 5 extension — Secondary real dungeon route / service cloister

**Branch:** `feat/ai-dungeon-3d-gauntlet-foundation`, existing **Draft PR #49**.
**Status:** Implementation integrated; **genuine running WebGL and original-gameplay
acceptance remain pending**. Do not merge, deploy, or call the game transformed.
**Pinned M1 BEFORE:** `281735d0910c6b2443648af976003d50412ee324`.

## Why another route?

The initial entry → ordinary-combat → Warden route is useful, but one camera
tour can hide repetitive set geometry. This increment constructs a visibly
different *optional* passage only when the **actual unchanged walkable map**
contains a second branch connecting two existing primary-route points.
The autonomous game may or may not traverse it; the presentation layer
**does not direct units**, unlock doors, move hazards or alter target decisions.

The side passage has its own original physical identity: lower service-cloister
buttresses, shallow stone foundations, fully sealed blind niches with aged
iron fittings, recessed chiselled ribs and very shallow irregular flagstones.
These are structurally anchored to **real blocked walls**, not across the real
combat lane. No fabricated stairs, fictional side exits or glowing signage.

## Deterministic architectural contract

`planAlternateDungeonGallery(map,floor,exit,primaryJourney,units,traps)`:
- Strictly validates both the map and the first route's authoritative cells.
- Searches a bounded set of branch/rejoin anchor pairs by deterministic BFS.
- Forbids all main-route cells inside the detour; the two anchors are the
  *only* allowed shared points.
- Never crosses the true ordinary encounter index from before to after:
  no visual suggestion that a mandatory combat chapter was skipped.
- Excludes the central Warden Court (Chebyshev distance ≤4 from exit) and
  avoids mounting high buttresses near real living enemies.
- Records the count of **actually active, undisarmed trap cells on the route**;
  does not falsely assert hazard-free travel. Shallow inlays skip active traps
  and standing actors.
- On a map without a real second passage, returns
  `status: 'no-authoritative-side-loop'` and **zero** new meshes.
- Returns **true legal** detour and rejoined route cells, original stone/iron
  material-role descriptors, authored wall-face poses, and AABB bounds.

`createAlternateDungeonGallery(...)` turns the validated plan into up to
three retained GPU instanced batches, all owned/disposed per actual floor.
Their Three.js cutaway uses existing camera visibility classification but
**does not alter camera movement policy**. The existing `environment.js`
incorporates side-gallery metrics, split physical bounds, cutaways and
disposal. `app.js` now forwards real `s.traps` to the read-only
presentation planner. All content is offline-made original code geometry.

## Boundaries and caps

| Added secondary-route cost | Bound |
| --- | --- |
| Additional render calls / instanced batches | ≤3 |
| Shared new geometries and materials | ≤3 each |
| Blind solid-wall buttress locations | ≤12 |
| Shallow non-colliding stone paving locations | ≤18 |
| Additional textures, lights, post FX, remote assets | **0** |
| Authoritative movement, AI, hazards, damage, saves, RNG, topology | **0 changes** |

Do not confuse the CPU-side typed array accounting with measured VRAM.
For an **isolated 13×13 authored test fixture**, the renderer returned
3 batches, **736 instanced triangles** and **8,424 bytes** of static
typed vertex/normal/index/instance data; two wall mounts and two shallow
pavers were allocated. Dirty cutaway wrote 2 changed wall bands then
**0** for an identical subsequent visibility pass. All 3 mock meshes were
removed and disposed; a no-loop map created **0** meshes. These checks use
a **mock Three.js resource interface** and are **not** genuine browser
render quality, motion, FPS or GPU memory evidence.

A separate **40-map deterministic synthetic maze/room/courtyard stress**
produced 40 valid true-grid detours, 34 with eligible solid-wall architecture,
mean 5.45 exclusive side cells and 0 tested topology/invariant failures.
These **are synthetic test maps**, not actual 40 autonomous dungeon runs.
The committed Node foundation suite includes *actual*
`DungeonRuntime.create(...).publicState()` seed contracts for genuine maps;
those tests must execute on CI before claiming pass.

## Actual-game evidence path

- `tests/foundation/dungeon-alternate-gallery.test.cjs`: legitimate
  reconnection, no bypass of actual combat stage, no fake side routes,
  trap honesty, actor clearance, deterministic seeded games and lifecycle.
- `tests/browser/dungeon-alternate-gallery.spec.cjs`: selects one real
  generated seed with an actual second loop from a bounded corpus;
  runs **true autonomous browser HTTP snapshots**, checks WebGL scene
  integration and capture, material roles, real hazard counts, resource
  bounds, desktop cinematic/tactical and **390px mobile** views.
  Expected artifacts:
  - `artifacts/dungeon-alternate-cloister-cinematic.png`
  - `artifacts/dungeon-alternate-cloister-tactical.png`
  - `artifacts/dungeon-alternate-cloister-mobile.png`
  - `artifacts/dungeon-alternate-cloister-evidence.json`
- The evidence JSON reports **natural party visits** to the detour if
  observed; it must not claim an actual alternate-path traversal if
  no real autonomous unit stepped onto its exclusive cells. Existing
  organic-journey gameplay footage remains a separate acceptance gate.

Focused commands:

```sh
npm run build
node --test tests/foundation/dungeon-connected-journey.test.cjs tests/foundation/dungeon-alternate-gallery.test.cjs
npm run dungeon:test
npm run dungeon:assets
npx playwright test -c tests/browser/dungeon.playwright.config.cjs dungeon-alternate-gallery.spec.cjs
```

## Acceptance and rollback

**Open:** exact-head CI/Chromium capture, actual 3D scene review from several
viewpoints, genuine natural traversal where the autonomous party chooses
the side route, Warden-telegraph readability regression, measured GPU/CPU
costs, matched pinned M1 before/after video and independent LOOK/FEEL/PLAY
blind critique. The shared draft branch has frequent concurrent commits,
so queued/cancelled workflows cannot be counted as passing checks.

Rollback this extension by reverting its two new `alternate-gallery*`
modules, one render-only `environment.js` integration, the single
presentation argument passing `s.traps` in `app.js`, and the new tests/
test registrations. Leave the preexisting connected-jouney system and
authoritative `games/ai-dungeon/src/**` completely intact.

**Ownership:** dungeon architecture, deterministic dressing placement,
occluder volumes, batched geometry and disposal only. No lighting, material
engine, camera director, simulation, boss rules, VFX or audio changes.
