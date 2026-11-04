# Infinite Tower Climb — authentic contact danger during guardian crossfire

2026-11-04 · same open 3D transformation · draft PR #68 only

## Primary gameplay problem
A living guardian could always win the 3D fill-light and scenery-priority decision even when a physically near shutter was active against the climber. In the real portrait battle this can hide a life-threatening trap under a cinematic boss emphasis. Separately, distant guardian telegraphs unnecessarily suppressed nearby biome weather despite no local encounter.

## Playable cross-system continuation
- `visuals/scene-hierarchy.mjs`: one shared **strictly observed** near-body pressure witness validates real run/floor/tick, player extents, authoritative shutter bounds, actually active hazard or only the last six source charge ticks during real evasive intent. A witnessed guardian plus **immediate** trap becomes `crossfire`, while distant traps, invalid actors, early warnings, unobserved AI decisions and stale results cannot invent urgency.
- `visuals/action-staging.mjs`: the existing physical fill light selects an immediate contact shutter before a guardian; the guardian remains onstage and the normal guardian priority resumes as soon as the local contact clears. No added light, 3D mesh, draw, HUD, collider, route/decision, HP change, prediction or source mutation.
- `visuals/atmosphere.mjs`: distant offscreen guardian telegraphs do not independently darken the entire scene. Nearby actual guardian warnings still quiet the single-draw weather and rapid flight wake.
- `tests/phase3/tower-action-staging.test.cjs`, `tower-scene-hierarchy.test.cjs`: new negative controls for real crossfire, early/late charge, distant threats, stale/invalid source, and immutable inputs; tests are engineering safety, not votes.

## Actual capture and CI truth
- Frozen baseline **1731b380851162741761c5569e2bc152a0869ca9** unchanged.
- Prior capture [41889543364](https://github.com/my-edutu/Ai_games/actions/runs/41889543364) recorded **eight successful source-pinned baseline/candidate scenario jobs** (ascent, moving, danger, outcome) with candidate playable code `dd21e9c`. The ninth `authentic-ledge` job failed before capture because scratch-world fixture imports were missing `scene-hierarchy.mjs`. Neither those previous clips nor old-source tests prove this new contact priority.
- Prior exact-head technical run [41890763045](https://github.com/my-edutu/Ai_games/actions/runs/41890763045) **FAILED 21/955**; every logged failure was a copied-world test fixture unable to resolve `scene-hierarchy.mjs`. Five affected fixture suites now copy the shipping observer into their temporary ESM fixture directory; two other world fixtures already rewrite the import to the actual repository module. This is a safety correction, not a gameplay victory. No complete exact-new-head CI result available at writing.
- Newest playable code `eb5b356c59bb8f81201a7fd7df966153b91f16bd`; latest test head must be independently source-verified before safety is cleared. No current-implementation normal-speed clips reviewed.

## Guardrails and risks
Only published immutable snapshots choose visual emphasis; fixed-step combat, seeded replay, AI policy, collision, result/restart, privacy and authoritative recovery are unmodified. The extra contact scan is bounded by the already-published number of hazards and uses no added GPU resources; actual supported-device p50/p95/p99, memory and stable frame budget remain **NOT MEASURED**. Existing reduced-motion and sound-off paths remain available. A shadow/color change cannot substitute for readable threat geometry; the existing source-visible shutter hardware stays authoritative. Roll back only these three presentation source files if new-source gameplay shows confusing light switching; retain the safety fixture corrections independently.

## Experience gate
**NOT EVALUATED** (LOOKS 0/5, FEELS 0/5, PLAYS 0/5, no judgments collected).
The biggest unresolved experience gap is event-matched, continuous **normal-speed actual desktop and phone** full-motion comparison of ascent, simultaneous guardian/shutter danger, and a genuine outcome/restart against the frozen build, followed by five genuinely independent randomized blind critics and real target-device performance/accessibility/replay checks. The independent browser/worker tunnel currently returns `NOT_FOUND`; no full-motion verdict, AAA claim, force-push, deployment or merge.
