# D04 — Read-only public-map projectile clearance

**Status:** independent review candidate, not real-game audiovisual acceptance. Frozen BEFORE `281735d0910c6b2443648af976003d50412ee324`; isolated D04 branch only.

## Dominant source-level defect

The existing opt-in projectile lane deliberately ends 0.58m before an aimed target and never asserts a hit. It can nevertheless pass through the authoritative wall map when an animated firing hand is offset behind a stone edge. The earlier detached helper had no map input and therefore could not certify *physical* path visibility. Actual footage was unavailable because the coding/browser tunnel is disconnected; this is source diagnosis, not visual comparison.

## Narrow correction and safe rollout

- D04 now reads **only** the current public snapshot's `map` through `getFloorMap`. Its deterministic, bounded DDA checks the exact world-to-19x19 grid cells, including both corner-adjacent cells, before committing a shot to the retained existing projectile/spell pool.
- A visible projectile remains 0.58m short of the target and at least 0.31m shy of any intervening solid tile boundary (allowing for the 0.43m arrow's half length). The flight is clipped in air; **no new wall impact, debris, wound or attacker attribution** is created. Adjacent walls, malformed maps and off-map source hands suppress only the visual.
- The collision map is sampled once per release, never once per rendered frame. The existing short, straight projectile flight and lifetime now cover actual visible travel distance. The stage exposes `occludedFlights` and `blockedFlights` counters. Seven retained pools, 102 reserved instances, GPU calls and original procedural audio remain unchanged.
- Standalone stage tests without a map callback preserve the previous conservative path; the real D04 controller ALWAYS injects the public map and therefore fails closed when map evidence is invalid. Legacy `/dungeon` is unchanged; only `?feedback=d04` uses this.
- The previous commit also repaired **two missing stream routes** for transitive D04 ES module imports. This new module is separately allowlisted. No change to authoritative gameplay, rigs, camera or lighting.

## Verification limits

Six standalone Node 22 pure-function tests on the identical proposed algorithm passed locally (clear lane, blocked lane, corner crossing, adjacent wall, invalid map, deterministic no-mutation). Existing preview integration and visual-stage tests were extended but require the unavailable full repository runner. Static source checks can verify all import routes; they are **not** a Three.js or Playwright session. No genuine BEFORE/AFTER WebM, captured PCM, 390px mobile footage, Warden run, 20-minute soak, CI build or A/V synchronization was verified. In particular, an unobstructed grid does not prove a path free of decorative scene props; art/geometry handoff may add an independently verified occlusion descriptor later.

### Mandatory next acceptance

On branch `feat/dungeon-d04-combat-feedback-realism-20261108`:
```sh
npm ci && npm run build
node --test tests/foundation/dungeon-occluded-projectile-path-d04.test.cjs tests/foundation/dungeon-unconfirmed-projectile-flight-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```
Record actual opt-in sound bus + canvas from three views for confirmed impact, a miss, block, dodge, arrow, spell, Warden warning/release/recovery/counter, desktop/mobile. Inspect frame receipts and audio onsets. Reject if the path still penetrates masonry or sound suggests an unproven impact. Roll back this D04 commit independently if needed.
