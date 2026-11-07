# AI Dungeon — Gauntlet Round 018: Original Biome Architecture

**Branch:** `feat/ai-dungeon-3d-gauntlet-foundation` · **PR:** #49 (draft).
**Goal:** Remove repetitive overbright obelisks and give each real 3D dungeon biome an architectural identity. Primary benchmark: authentic Diablo IV gameplay, supported by No Rest for the Wicked environments and Path of Exile 2 combat. **Benchmark NOT MET.**

## Source and visual proof

- Builder commit `b4cb02c7d9bb69a538298d9d5355ba6193b49521` introduces a deterministic read-only wall planner and bounded, shared-resource PBR geometry. The scene now places floor-dependent crypt ossuaries, forge hearths, astronomical orreries and spectral codex lecterns in genuine room-wall niches rather than repeating tall white-glow monuments.
- Baseline at Round 17: the 1440×900 real screenshot was dominated by four bright identical monuments, repetitive masonry and strong foreground lights.
- The actual new browser screenshot at commit `b4cb02c7` from [run 41170019808](https://github.com/my-edutu/Ai_games/actions/runs/41170019808) was inspected, not generated. The previous tall white obelisks are absent, while real wall reliefs and textured characters are visible. However, the frame remained dark and a giant translucent cyan/green light shaft still crossed the heroes. This is not AAA parity.
- Real WebGL metrics at commit `b4cb02c7`, [artifact 13031196073](https://github.com/my-edutu/Ai_games/actions/runs/41170019806/artifacts/13031196073): **8 setpieces**, **3/3 unoccluded live heroes**, **85px minimum hero height**, **7 textured characters**, **0 missing/incomplete assets**, **110,671 rendered triangles**, and **mean luminance 23.75 / 255** in that single 1440×832 canvas sample. This is one frame, not a guarantee for all seeds or devices.
- Follow-up `a51664dab9f3f23bffb52cb0dc5b30763b3c6cea` removes the two 3D light cones entirely after observing that they hide the party under a distracting emerald triangular overlay. A browser assertion now requires `atmosphere.lightShafts === 0`.

## Test evidence and contracts

- The initial full browser workflow [41170019806](https://github.com/my-edutu/Ai_games/actions/runs/41170019806) passed **42/42** across three browser shards, including both new setpiece tests, with the authority job also successful.
- The local room-planner suite passed **3/3** with deterministic placement, bounded count, start/exit exclusion, adjacency and biome changes. `npm run dungeon:test` passed **11/11**.
- Local headless Gauntlet ran **24 seeds × 900 ticks** with zero determinism failures, highest floor 9; this verifies simulation invariants, not visual quality.
- Final exact-head post-light-cone full-browser run [41170512135](https://github.com/my-edutu/Ai_games/actions/runs/41170512135) passed **42/42** across three isolated shards (14+14+14), with its authority job also passing. Raw WebGL evidence [artifact 13030967805](https://github.com/my-edutu/Ai_games/actions/runs/41170512135/artifacts/13030967805) shows 8 genuine wall niches, **zero light shafts**, 3/3 unobscured heroes, 85px minimum hero height, 7 textured characters, 0 incomplete assets, 110,527 triangles, mean luminance 23.13/255. Independent matched A/B and production gates remain open.
- No authoritative grid/AI/pathfinding/save contract is changed. Setpieces add browser-rendered geometry only, capped at eight and placed next to real walls. Cameras may cull them along hero sightlines.
- Existing high-severity dependency audit findings were outside this visual increment and require separate remediation.

## Critic and next round

**Self-review only:** the connected worker tunnel was offline. No fresh-context independent critique, blinded Diablo IV matched A/B preference, ultracode run or production-readiness certification is claimed. The independent quality bar remains **NOT MET**.

Largest remaining gap: hard rectangular corridors and low-detail hero/enemy models. Next build should target robust rig detail, animation storytelling and more varied stone/material breakup, with real gameplay/stream captures and performance budgets. Preserve the separate `/dungeon/gauntlet` ledger, genuine screenshot evidence and deterministic authority; keep PR #49 draft.

## Final candidate visual follow-up (exact code `a51664d`)

The dedicated real-browser reference workflow [41170512137](https://github.com/my-edutu/Ai_games/actions/runs/41170512137) **passed 10/10 interface tests**. Its actual screenshot artifact [13031256210](https://github.com/my-edutu/Ai_games/actions/runs/41170512137/artifacts/13031256210) was downloaded and visually inspected in desktop, raw-world and mobile modes. The oversized translucent green triangular shaft seen in the prior matched seeded screenshot is gone; heroes and enemies remain visible. In a center-of-screen region, bright green pixel occupancy decreased from approximately **21.7% to 10.9%** between these two genuine screenshot samples, with no promise of better artistic quality from that metric alone. The scene remains dark, blocky and below the reference bar. The final full-browser workflow and repo-wide CI require their own gate results.

## Shared catalogue CI integration diagnosis

At exact-head `a51664d`, the repo-wide CI [41170512169](https://github.com/my-edutu/Ai_games/actions/runs/41170512169) passed **533/533 software tests** but its shared browser step failed. Root cause was test-runner discovery, not failed game logic: `playwright.config.cjs` ignored only `dungeon-stream.spec.cjs`, leaving three Dungeon-specific browser files to run against shared port **4173** (Snake) rather than dedicated port **4181**. All such tests failed to retrieve the real Dungeon scene. The dedicated Dungeon suite [41170512135](https://github.com/my-edutu/Ai_games/actions/runs/41170512135) independently passed **42/42** on its correct server.

The follow-up routes **all** `dungeon-*.spec.cjs` tests exclusively through their existing dedicated Playwright config, and removes the unused 4181 server from the shared suite. A new focused test reproduced the discovery error (RED), then both routing tests passed (GREEN). The checked shared suite discovers **15 tests across five files** and the dedicated suite discovers **42 tests across four files**. A fresh shared CI result is mandatory before claiming that integration gate passes.
