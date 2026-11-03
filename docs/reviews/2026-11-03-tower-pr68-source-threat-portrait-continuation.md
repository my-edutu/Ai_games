# Infinite Tower Climb — source-truth combat and portrait action continuation (2026-11-03)

**Project and status:** [Tower PR #68](https://github.com/my-edutu/Ai_games/pull/68), draft, not Tiny Kingdom/Maze/AI vs 1000 Floors. The single cross-run transformation stays **OPEN / NOT EVALUATED**. Frozen baseline **`1731b380851162741761c5569e2bc152a0869ca9`**, unmodified. Current gameplay implementation **`6f40263f349fff5219ad89673e1ba3096f609d05`**; not a quality PASS.

## Real prior-source footage and actual defect

A genuine normal-speed source-pinned [9/9 successful capture workflow](https://github.com/my-edutu/Ai_games/actions/runs/41671295721) filmed frozen baseline and candidate **`558924dce3f2bfefa09d577859ab21e95ee41292`** with source seed `tower-transformation-capture-v1`, low graphics, sound off, motion enabled, 960×600 desktop and native 390×844 portrait. Downloaded the actual WebM ZIPs, inspected real 3D frame samples and their `motion.json`/source trace. This is builder review, **not** independent, blind, continuous-film scoring.

| Scenario | Baseline artifact | Candidate artifact | Candidate desktop / portrait recorded wall-seconds | Unsafe candidate portrait actor samples |
|---|---:|---:|---:|---:|
| Everyday ascent | [13248019597](https://github.com/my-edutu/Ai_games/actions/runs/41671295721/artifacts/13248019597) | [13248238504](https://github.com/my-edutu/Ai_games/actions/runs/41671295721/artifacts/13248238504) | 105.678 / 87.868 | 0 |
| Guardian danger | [13248528329](https://github.com/my-edutu/Ai_games/actions/runs/41671295721/artifacts/13248528329) | [13249620805](https://github.com/my-edutu/Ai_games/actions/runs/41671295721/artifacts/13249620805) | 139.781 / 116.703 | 0 |
| Outcome/restart | [13249975371](https://github.com/my-edutu/Ai_games/actions/runs/41671295721/artifacts/13249975371) | [13249288673](https://github.com/my-edutu/Ai_games/actions/runs/41671295721/artifacts/13249288673) | 170.829 / 123.887 | **3** |
| Moving hazard | [13248258196](https://github.com/my-edutu/Ai_games/actions/runs/41671295721/artifacts/13248258196) | [13250295147](https://github.com/my-edutu/Ai_games/actions/runs/41671295721/artifacts/13250295147) | Authentic captured; not reviewed here | No new claim |

The three candidate portrait **outcome** samples have actual visible protagonist center NDC x **−0.8447, −0.8821, +0.8491**, all beyond the `±0.78` safe framing criterion, versus **zero** in the sampled frozen-baseline portrait outcome. This is a measured mobile-readability concern, not an aesthetic vote. Prior portrait ascent/guardian-danger source samples are now **0 unsafe**, versus earlier source 58904b4 **4/4**. Sparse NDC samples never establish true pixel/occlusion completeness. Candidate and baseline are seeded the same, but their running floors/HP/outcomes diverge by wall clock, preventing fair anonymous A/B scoring without **state- and event-aligned** clips; baseline outcome result hold is brief. No reviewer scores awarded.

## This continuation's real source change

[Source commit `6f40263f`](https://github.com/my-edutu/Ai_games/commit/6f40263f349fff5219ad89673e1ba3096f609d05) changes the autonomous **tactical** policy to respect collision physics rather than false perceived threat range: a fired enemy bolt must be travelling toward and within a near-term body collision lane; a telegraph must be at the actual centerline projectile height; and off-height enemies outside legitimate melee vertical reach cannot hijack the next ascent. Frozen historical-v1 policy still uses its original attack, projectile, route and replay decisions.

The actual 3D portrait camera attempts a short **two-substep source-measured exterior follow-through** only when the live hero has already breached its safe screen margin, checking the projected actor after **each** short step, requiring both screen improvement and unobstructed tower-core sightline, and reverting fully on invalid steps. No simulation authority, image-space actor substitute, HUD, game-time pacing, sound setting, or engine rewrite.

A new focused regression suite tests source-truth dodge versus harmless height-separated bullets, real incoming threats, true shooter windups, off-height melee and legacy mode; **its new exact-head CI is still pending**, so no validated test count is claimed.

## Gates and next work

[Prior-source exact-head technical contract](https://github.com/my-edutu/Ai_games/actions/runs/41671717107) **SUCCESS** — technical safety only, not game transformation. New exact-source [quality run](https://github.com/my-edutu/Ai_games/actions/runs/41677992306) in progress; [source-6f full-motion capture](https://github.com/my-edutu/Ai_games/actions/runs/41677992168) in progress at audit. Inspect results, fix any regressions and demand a **post-patch** phone outcome comparison. Replay/CI and WebGL restoration are vetoes, never positive quality votes. Supported physical-device frame-time p50/p95/p99 and memory **NOT MEASURED**; genuine independent fresh-context blind critic totals **LOOKS 0/5, FEELS 0/5, PLAYS 0/5**. Builder/critic browser tunnel: `NOT_FOUND: Tunnel-client has not been seen for 300 seconds`.

**Largest remaining experiential gap:** framing the real climber during a complete portrait outcome without sacrificing readable guardian/HP-gate action; compare equivalent actual world-state episodes and obtain unbiased full-motion judgments. Keep PR #68 draft and PR #58 intact. No merge, force-push or deployment.
