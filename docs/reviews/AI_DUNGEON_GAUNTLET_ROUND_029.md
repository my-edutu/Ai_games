# AI Dungeon — Gauntlet Round 029

**Date:** 2026-10-31 · **Draft PR:** [#49](https://github.com/my-edutu/Ai_games/pull/49) · **exact verified code commit:** [`d944a7c3f628c82e43c9e407f884e9891d1071df`](https://github.com/my-edutu/Ai_games/commit/d944a7c3f628c82e43c9e407f884e9891d1071df) · **status:** visual Gauntlet **NOT MET**, **NOT** production ready. Keep this PR **draft and unmerged**.

## Evidence-based target

Round 27 and the actual pre-change Chromium Warden encounter show low-poly GLB anatomy, highly repetitive rectangular masonry, an excessively dark environment and overlapping luminous circular effects. The immediate independently verifiable rendering bug was a duplicate costume: after successful authored CC0 GLB attachment, `actor.body.visible=false` concealed only the procedural *body*. The Warden's **two procedural root halo meshes** and the Mystic's **three root-level orbiting meshes** remained attached, even though procedural detail animation is skipped while `actor.authored` is true. The Warden's real authoritative danger-ring telegraph (`a.telegraph`) must remain separate and functional.

**Real before evidence:** [exact pre-change Chromium Warden screenshot archive](https://github.com/my-edutu/Ai_games/actions/runs/41204787633/artifacts/13044093167), at code `015dd09`. The authentic Warden encounter comes from the existing deterministic `visual-room-art-18` campaign, not a manually positioned mockup. The entire original 18.24-second Warden browser test recording from the first implementation was viewed, along with the matched actual world-only screenshot after the change. A local side-by-side inspection found the inner decorative gold outlines less cluttered, but multiple other circles remain. These are not proof of reference-quality combat.

## Independent increments and observed red/green

1. **Test first.** Commit [`e90f98c`](https://github.com/my-edutu/Ai_games/commit/e90f98c2591709e466165cae683ad6e875867c6f) introduced foundation contracts and actual Warden WebGL assertions requiring at least **two authored actors** and **five hidden duplicate fallback ornaments**. Full repository [RED CI](https://github.com/my-edutu/Ai_games/actions/runs/41205890890) recorded **578/579 passed, 1 failed**—specifically the missing authored-ornament suppression contract.
2. **Renderer-only replacement.** Commit [`b900bae`](https://github.com/my-edutu/Ai_games/commit/b900baeb66ab27532ff33dfdfcf8a5fa536797d6) adds `setAuthored(enabled)` and live ornament-count instrumentation. Authored GLB attach hides only fallback-only root adornments, and disposal restores them. It preserves Warden telegraph, the imported skeleton/animations, source-licensed CC0 assets, authoritative combat and replay. No new meshes, lights, physics or gameplay RNG.
3. **Test discovery and browser budget.** Commit [`b4bf046`](https://github.com/my-edutu/Ai_games/commit/b4bf046a19c9dc766d2d1776c00a376380812750) enrolled the new regression in the focused Dungeon command and avoided a duplicated costly SwiftShader screenshot. The [first 48-test Chromium run](https://github.com/my-edutu/Ai_games/actions/runs/41206142289) correctly exposed **one independent visual defect**: the existing free-running desktop colour audit yielded **17.590 / 255** against the unchanged **greater-than-18** quality threshold. Shard 3 nevertheless passed and supplied the new actual Warden frame/video. The failing captured screenshot was manually inspected and genuinely showed severe black regions at the dungeon's map edge.
4. **Actual-world shadow lift, not threshold weakening.** Commit [`d944a7c`](https://github.com/my-edutu/Ai_games/commit/d944a7c3f628c82e43c9e407f884e9891d1071df) modestly lifts floor-specific background sky values and changes the build-world ambient fill from **1.70 to 1.95**. The real browser test threshold remains unchanged and all final CI jobs pass. This adds no GPU lights or render passes. It is not evidence of material-quality parity.

## Exactly verified final evidence

| Gate | Result | Source |
| --- | --- | --- |
| Focused Dungeon tests | **58/58 pass** | [Dungeon workflow](https://github.com/my-edutu/Ai_games/actions/runs/41206739033), authority job |
| Presentation / interface foundation | **17/17 pass** | Same authority job |
| Repository software tests | **580/580 pass** | [Integrated CI](https://github.com/my-edutu/Ai_games/actions/runs/41206739013) |
| Shared browser tests | **15/15 pass** | Same integrated CI |
| Dedicated genuine Chromium / software WebGL tests | **48/48 pass**, 16 on each of three shards | [Dungeon workflow](https://github.com/my-edutu/Ai_games/actions/runs/41206739033) |
| Deterministic headless campaign | **24 seeds × 900 ticks**, **zero replay mismatches**, reached **Floor 9**, 401 floor advances, 89 restarts | [Campaign artifact](https://github.com/my-edutu/Ai_games/actions/runs/41206739033/artifacts/13043549753) |
| Genuine Warden shot and browser film | **Observed** at deterministic seed/tick, with live GLB assertion for at least two actors/five hidden original pieces | [Actual Warden capture/video archive](https://github.com/my-edutu/Ai_games/actions/runs/41206739033/artifacts/13044632232) |
| Real desktop colour audit | Initial failed 17.590; *different-scene* final captured 32.497 / 255, above the unaltered threshold | [Final desktop capture/metrics](https://github.com/my-edutu/Ai_games/actions/runs/41206739033/artifacts/13044069195) |
| Separate screenshot workspace build | **Passed** | [Reproducible visual review](https://github.com/my-edutu/Ai_games/actions/runs/41206739048) |

**Do not subtract 17.590 from 32.497 to claim a controlled lighting improvement.** Those captures show different floors/camera/combat states (Hollow Sanctum vs Obsidian Vault). The matched Warden before/after uses the same authoritative seed/tick, but animation timing and transient effects vary slightly. Its visual impression is a modest reduction in duplicate ring clutter and *not* a blinded or independent preference verdict.

## Harsh quality audit (implementer only)

The real 1440×832 Warden screenshot still shows oversized horns and chest ornaments, comparatively tiny and anatomically simple hero models, chunky enemy silhouettes, three-dimensional wall blocks with little believable erosion, crowded floor runes/ground rings, an overly dark border and unconvincing attack/casting contact timing. The audience can recognize the Warden and combat state, but the scene is far below authentic **Diablo IV** cinematography, **No Rest for the Wicked** authored dungeon composition and **Path of Exile 2** combat motion. Removing two halo rings does **not** make the effect system coherent. The test and CI establish bounded functionality, not gameplay artistry or consumer readiness.

No independent harsh-critic subagent or ultracode was usable through the external worker workspace (unavailable tunnel). No independent blind A/B, multi-seed fixed-frame visual sweep, actual mobile gameplay inspection for this code head, GPU frame-time p95, sustained memory soak, external critique or AAA parity claim. This is an honest **author candidate review**, not an independent acceptance decision.

**Biggest remaining blocker:** original high-resolution anatomically plausible rigged heroes/enemies, actually aligned weapon hand-grips, contact/readable wind-up/recovery and caster gestures. The next increments should be proven with matched, real play clips and multi-seed/midrange-device screenshot and performance budgets, then replace blocky masonry and weak local lighting/materials without compromising 24×900 replay integrity.

## Undo / safety

All modifications are isolated to `public/ai-dungeon/characters.js`, `model-assets.js`, `app.js`, `package.json` and the two test files. Original CC0 asset provenance, strict CSP, pathfinding, map collision, save format, deterministic authority, encounter balancing, audience influence and physics are unchanged. Revert these presentation commits as needed; no schema migration is required. **Do not merge draft PR #49.**
