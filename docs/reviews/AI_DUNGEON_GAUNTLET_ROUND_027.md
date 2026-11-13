# AI Dungeon Gauntlet — Round 027: Animated Hand-Bone Equipment

**Date:** 2026-10-31. **PR:** [#49](https://github.com/my-edutu/Ai_games/pull/49), open/draft/unmerged. **Starting PR head:** `6c2d870899830946cd9a57ab431fc9ed53dcb7ad`. **Exact verified implementation and test head:** `547c45452d5b58e763b4e4cce7943e0440569dae`. **Visual verdict: Diablo IV quality NOT MET; production readiness NOT MET.**

## First demonstrated gap, objective and approach

The genuine Round 26 Warden render and review showed that the five role-specific ranger/mystic weapons were rigidly mounted to their costume visual pivots, not the model's animated skeleton. This limited the legibility of actual attacks and casting. Round 27 makes one narrow, independent cosmetic improvement: **bind the two original ranger bow elements and the three original mystic staff elements to the imported, animated right-hand bones** in their already cloned Three.js GLB rigs.

- Added pure `public/ai-dungeon/rig-attachment-plan.js`: immutable prop-name selectors and a bounded left/right hand-bone selector. The selector rejects unskinned objects, finger bones and opposite-handed matches; handles common Mixamo, hand-suffix, spaced and underscored armature names. It imports no gameplay simulation, fetches nothing and uses no time or randomness.
- In `model-assets.js`, after the original CC0 GLB is cloned and class costume created, find the actual `SkinnedMesh.skeleton.bones`, find the corresponding original costume meshes and use `handBone.attach(mesh)`. This **preserves each mesh's initial world pose**, then makes it follow subsequent authored skeleton motion. If a compatible hand or full prop group is absent, leave the previous safe pivot fitting unchanged. Do not transfer the actor, collision, grid position or authority into the skeleton.
- Added scene diagnostics `rigBoundAccessoryActors`, `rigBoundAccessoryParts` and bounded hand-bone names; kept original actor-owned geometry/material cleanup. The strict same-origin stream whitelist now serves the small local selector. All 20 source GLB/texture files retain pinned CC0/sha provenance; no new asset or proprietary game art copied.

**Important limitation:** A bone parent is not hand-grip retargeting. Because `attach()` preserves the original world-space accessory position, props may remain offset from actual palms. This is a skeletal-follow improvement, **not** complete anatomically aligned weapon wielding, bespoke animation or AAA fidelity.

## Test-first and a real discovered defect

- New 4-case foundation contract committed **before implementation** at `35bab81`, registered `459eb61`. Dedicated real-GLB Chromium spec committed before implementation at `1535ccb`; explicitly whitelisted at `1e6c122`.
- **Observed expected RED:** [integrated CI 41201364738](https://github.com/my-edutu/Ai_games/actions/runs/41201364738), job 124537672080, failed the new foundation cases while `rig-attachment-plan.js` was absent and renderer integration did not exist. This is not a claimed passing validation.
- Implemented with commits `6d44be6`, `675207a`, `8c608a0`. First complete-code dedicated [run 41201505995](https://github.com/my-edutu/Ai_games/actions/runs/41201505995) showed **16/16** in shard 1 (including new authentic GLB rig browser audit), **16/16** shard 3, **15/16** shard 2. The sole failure was the pre-existing optional bloom toggle awaiting a software-WebGL rendered frame inside 10 seconds. The Playwright trace showed the glow button pressed while stale `postFX='direct'` diagnostics remained. It was **not** a gameplay or new hand-bone assertion failure.
- Follow-up test-only fix `547c454` requires a **newly rendered real bloom frame**, not just a button state, and allows 30 seconds for software-WebGL compositor latency while keeping the per-test 120-second ceiling. No test was skipped or mocked and no authoritative/artistic code changed. First failed run is retained as evidence; its result is not relabelled green.

## Verified exact-head acceptance and real captured game

**All checks below are for `547c45452d5b58e763b4e4cce7943e0440569dae`, with test-only changes compared with the photographed rig implementation.**

| Check | Actual result |
|---|---|
| [Dungeon foundation / real browser workflow 41202025218](https://github.com/my-edutu/Ai_games/actions/runs/41202025218) | **54/54** Dungeon foundation; **17/17** presentation/interface/progress; three Chromium shards **16+16+16 = 48/48** |
| Same workflow — headless | **24 seeds × 900 ticks**, **zero** replay/determinism failures; floor 9 maximum, 401 floor advances, 89 restarts |
| [Integrated catalogue CI 41202025299](https://github.com/my-edutu/Ai_games/actions/runs/41202025299) | **576/576** software tests and **15/15** shared browser tests |
| [Reproducible visual review workflow 41202025309](https://github.com/my-edutu/Ai_games/actions/runs/41202025309) | Completed successfully |
| Real WebGL hand-bone browser case | **PASS:** ≥2 genuinely textured rig-bound ranger/mystic actors, **exactly 5** bound cosmetic meshes, no reported missing/incomplete GLB textures, live hero visible, draw calls <1600 and no page errors |
| Genuine raw-world capture and video | [Final exact-head shard-1 artifact 13042383977](https://github.com/my-edutu/Ai_games/actions/runs/41202025218/artifacts/13042383977): `artifacts/dungeon-rig-attachments-round27-world-only.png`, **1440 × 832**, authentic seeded `DungeonRuntime.create('visual-room-art-18')`, living Warden at same authoritative tick as Round 26, plus **13-second** real Chromium `video.webm` |

The true Round 26 source [artifact 13042615996](https://github.com/my-edutu/Ai_games/actions/runs/41200016777/artifacts/13042615996) and Round 27 source capture were personally inspected side-by-side at the same state seed/tick; rendering/animation phase may differ. A second frame was inspected from the actual Round 27 browser video, not a mock-up. This shows that the new parts participate in the rendered live scene; the instrumented real WebGL test establishes their hand-bone parent relationship. **Neither a single image nor the parent count proves correct weapon grip or improved animation quality in a blind preference test.**

An inspected [authentic Diablo IV dungeon reference from Blizzard's gameplay press kit](https://blizzard.gamespress.com/pl/Diablo-IV-gamescom-Press-Kit) highlights the remaining gap: much richer stone relief, terrain breakup, controlled local illumination, physical surface textures, more natural figure proportions, and coordinated enemy attacks. The current dungeon remains dark, repetitively rectangular and low-poly, with oversized Warden regalia and strong cyan rings. The added rig-follow attachments are a small engineering improvement rather than a visually transformative leap. No copyrighted reference art was imported.

## Safety, harsh review and release gate

**Spec review (author):** renderer-only import/mesh reparenting, no changed authoritative inputs or outcomes, fixed pinned CC0 assets and existing memory cleanup, missing-hand fallback, full test suite and deterministic campaign. No replay/checkpoint schema changes, no dependencies, no paid influence. Reverting the two renderer/selector additions and module whitelist restores prior attachments without migrating saves. The test-only bloom timeout adjustment can be reverted separately.

**Harsh quality review (author; NOT independent):** the hand attachment is present but lacks hand-centred grip alignment, animation retargeting, bespoke hero/enemy anatomy and convincing weapon swing timing; characters remain small and extremely simplified in ordinary 1440×832 encounter views. Original corridor materials and lighting remain far beneath authentic Diablo IV, No Rest for the Wicked environments and Path of Exile 2 combat. FPS/p95 frame timings, a 24-hour soak, multi-seed occlusion sweep, actual mobile play in this round and a blinded external A/B were **NOT** measured. A 10-second optional-bloom responsiveness problem was exposed under software WebGL; the test now truthfully waits for a real frame, **not proof of a performance fix**.

**Independent workers/ultracode:** the external worker tunnel returned `NOT_FOUND`, so separate builder and independent fresh-context critic were not available. No independent blind preference verdict, AAA parity or production-readiness claim. Remain draft; do not merge.

**Largest blocker for the next run:** higher-resolution legally sourced/original humanoid anatomy and true skeletal retargeting with correctly aligned weapon grips, readable wind-up/contact/recovery sequences for heroes and enemies, then stronger original stone materials, room composition and atmosphere. Prove the improvement in multiple authentic rendered gameplay clips (normal traversal, combat, Warden) and device frame-time budgets before quality acceptance.
