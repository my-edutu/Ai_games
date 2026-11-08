# D04 — Spell visual-radius masonry clearance

**Status:** isolated source correction; authentic moving Dungeon WebGL/WebAudio footage **UNVERIFIED**.
**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`. **Parent:** `97b6865c6f1c72f5c42e8d5032519ce048ae97bb`.
**Frozen BEFORE comparison:** `281735d0910c6b2443648af976003d50412ee324`.

## Dominant source-observable physical defect

The earlier public-map collision helper treated **spells and arrows as equally narrow** (0.035m half-width). But the rendered spell is an icosahedron of radius 0.09m; at peak display scaling 0.78 × 0.84 its radius is ~0.059m. At a near-graze along a stone tile, a 0.05m clear centreline could be rendered as intersecting stone. This defect follows from the actual D04 geometry and conservative 2D map envelope; it is **not a claim of an observed real-game penetration**. No GLB model asset or video was available to inspect.

## Implementation and truth boundary

The existing read-only `planMapFlightClearance` now takes a closed, optional effect kind: `projectile` (default for existing callers) or `spell`. The arrow envelope stays at 0.035m; the spell envelope uses 0.075m (rendered max radius + ~0.016m margin). Unknown effect kinds fail closed rather than treating future geometry as thin arrows. The D04 retained renderer passes its existing pool kind for each emission. Swept AABB wall tests, 0.31m longitudinal margin, 0.20m minimum visible travel and clipping/early suppression remain unchanged.

This adjustment **only suppresses or shortens unconfirmed visual flight**; it does not invent damage, contact, attacker, impact debris, hit sound, or alter authoritative projectiles. It does not inspect decorative 3D masonry or certify vertical clearance. No new geometry, sound assets, buffers, voices, frame callbacks, or per-frame collision work. Existing seven retained pools, 102 reserved visual instances, eight foley voice cap, WebAudio gesture opt-in/mute, reduced settings, presentation receipts and cleanup are untouched. Legacy /dungeon stays the default; D04 remains opt-in with `?feedback=d04`.

## Test-first evidence, limits and acceptance

A detached Node 22 fixture reproducing the existing planner and renderer-call excerpt yielded **three failing contracts and one existing pass** before correction: wider spell/collision policy, near-source fail-closed, renderer kind propagation. After the source-level correction, **4/4 focused detached contracts passed**. This is a source-equivalent isolated test harness, **not a successful run of the full newly committed repository tests**. The coding tunnel returned `Tunnel-client has not been seen for 300 seconds`; a separate container could not resolve github.com. Native `npm ci`, build, full Node tests and Playwright **not executed**.

When the real game and assets are available, run:
```sh
node --test tests/foundation/dungeon-occluded-projectile-path-d04.test.cjs tests/foundation/dungeon-unconfirmed-projectile-flight-d04.test.cjs tests/foundation/dungeon-d04-spell-masonry-clearance.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```
Then satisfy `D04_Real_3D_Preview_Acceptance.md` with matched original WebM+PCM, three viewpoints, 1440×900/390×844, misses, confirmed HP loss, block, dodge, arrow/spell, Warden warning/release/recovery/counter and restart, opt-in/mute, renderer recovery and 20-minute soak. No video, PCM or 3D-browser validation was produced by this commit. Frozen BEFORE does not contain the opt-in D04 modules and cannot substitute for actual matched rendered evidence.

**Spec check:** presentation-only, restrictive visual clearance, no fabricated outcome, legacy unchanged.
**Quality risk:** conservative wide spell clearance may suppress legitimate near-wall spells. That is preferable to showing a bolt penetrating stone, but real-camera footage must review clipping quality and readability.
**Rollback:** revert this one isolated D04 commit.
**Next dominant defect:** verify the actual moving sword-tip geometry (currently a skinned-wrist proxy), then synchronize genuine visual frames and original captured PCM. Collision against decorative 3D stone also remains unverified.
