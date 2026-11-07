# AI Dungeon — Gauntlet Round 050: Sculpted Characters & Fractured 3D Stone

**Date:** 2026-11-01. **PR:** [#49](https://github.com/my-edutu/Ai_games/pull/49) **DRAFT, UNMERGED**. **Branch:** `feat/ai-dungeon-3d-gauntlet-foundation`.

## Art goal and reference

The user explicitly reprioritized **recognizable characters and realistic scenarios** over small spectator-performance iterations. Primary quality reference: authentic Diablo IV dungeon gameplay; No Rest for the Wicked for environment composition; Path of Exile 2 for contact/combat. This is an incremental original-geometry experiment, **not AAA quality, realism parity, or production readiness**.

Round 48's *actual running Chromium WebGL screenshot* establishes the visible problem: square blue wall blocks, very small overlapping stylized KayKit character heads/bodies, rigid silhouettes, and limited contact readability. We do **not** present that earlier capture as post-change evidence.

## Independently judgeable improvements in actual render paths

1. **Test-first specification (observed RED):** [commit `7e986764`](https://github.com/my-edutu/Ai_games/commit/7e98676438e2887e36863e8a48ab9471e2686ef3) introduced **six** failing foundation tests (three geometry, three anatomical/renderer wiring) and a genuine Chromium WebGL test. [CI 41270871888](https://github.com/my-edutu/Ai_games/actions/runs/41270871888), job `124743202092`, recorded **647 passing, six failing** repository tests; failures were the expected missing original planner modules and renderer wiring before implementation. This RED is observed, not inferred.
2. **Genuine 3D dungeon wall mass:** [implementation `684893b8`](https://github.com/my-edutu/Ai_games/commit/684893b8696ca38acc0b4fa9d67b505f07dc5eb5) replaces the main wall `InstancedMesh` cube geometry with a closed, non-axis-aligned chipped-stone solid. A shared **26-vertex / 48-triangle** geometry has three sculpted courses, an eight-sided clipped footprint, floor-keyed chipped upper silhouette and coordinate-keyed rotational/tint variation. The real wall cutaway preserves rotation and authoritative wall positions. This changes actual WebGL rendered geometry, not a presentation mockup.
3. **Six sculpted original character archetypes:** immutable recipes attach **14 Vanguard, 15 Ranger, 15 Mystic, 16 Revenant, 15 Cultist, 16 Warden** PBR armor/anatomy parts per loaded original GLB. Visible changes include breastplates, neck collars, cheek masks, greaves, vambraces, kneecaps, tabards, bone ribs and role-specific ornament. Genuine cloned forearm/shin bones carry relevant fittings; missing bones remain safe static overlays. A shared per-actor material/geometry pool is disposed on actor removal. No new licensed binaries were sourced.
4. **Public routes, contract tests and diagnostics:** the real dungeon server serves both new planners; the real loaded-GLB renderer reports `anatomicalDetailActors`, `anatomicalDetailParts`, `anatomicalJointFittings` and `wallSculpture`. `tests/browser/dungeon-sculpted-reality.spec.cjs` uses **real `DungeonRuntime` public state** (fixed seed `visual-room-art-18`, 18 real steps), verifies actual loaded textured rigs, live WebGL scene, model counts, composition, visibility and draw-call bounds, and requests a genuine `#world` screenshot. It does not fabricate hero actions or boss deaths.

## Evidence status, no inflated passes

- Observed test-first **RED:** exact CI above, six expected failures.
- Pure planner self-check executed against the code fetched from GitHub: all five sampled floor variants generated **78 position scalars (26 vertices), 48 triangles**, finite bounded coordinates and 7–8 distinct upper-edge heights. Six immutable class recipes have **14–16 unique pieces** each and bounded part coordinates. This **does not substitute for green CI**.
- The complete latest-head foundation/TypeScript build, **24 seeds × 900** replay, genuine Chromium 3D browser suite, separate visual-review workflow and full-catalogue CI were **not completed and read at this documentation checkpoint**. Several prior in-progress workflows were cancelled by concurrent branch changes; do not count them as passed. The new screenshot and video have **not yet been retrieved/inspected**. No blind matched A/B or independent artistic critic has taken place.
- CC0 asset manifest/provenance, simulation authority, combat reach, collision, navigation, replay, saves and RNG are unchanged. New GeometryBuffers stay within the existing solid tile and use deterministic hashes; original rig attachments remain cosmetic. No external asset licence was added.

## Harsh visual / performance critique (self-review, not independent)

This is more layered art, **not convincing human anatomy**. The existing CC0 KayKit source GLBs remain intentionally stylized, and sphere/cylinder armor overlays can still feel assembled rather than sculpted. The clipped walls break repetition but the underlying grid still forms rigid corridors. Added gear may cover facial expressions, clip during attacks, or increase draw calls; until same-camera actual WebGL A/B confirms it, **do not call this an aesthetic or performance win**. Further improvements must prioritize correctly weighted, original medium/high-poly characters, seamless physically-based materials, deliberate weapon-to-target and foot-plant staging, larger architectural hero assets, and cinematic composition. Retain strict resource caps and live spectator clarity.

## Next verification and gate

Run the exact-head focused and core suite, seeded replay and real Chromium; inspect the **new** `artifacts/dungeon-sculpted-anatomical-world-round49.png` capture and actual gameplay footage against a matched pre-change screenshot with a blinded reviewer if possible. Revert or adjust any floating/obscured anatomy or camera-hiding masonry and re-run tests. Maintain draft PR, do not merge. Worker/subagent tunnel unavailable in this work session; no separate harsh critic or ultracode execution is claimed.

**Realism benchmark: NOT MET. Production readiness: NOT VERIFIED.**
