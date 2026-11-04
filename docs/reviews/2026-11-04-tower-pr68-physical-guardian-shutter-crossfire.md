# Infinite Tower Climb — physical crossfire must remain visible during real guardian action
2026-11-04 · Same transformation initiative · draft PR #68 · source `51987aa84e683361f2b064ceb3a80cbfec621a21`

## Actual game problem and cohesive playable remedy

The existing source-observed guardian+close-shutter experience already coordinated the follow camera, key/fill lighting, foreground occlusion, and optional pressure-ratchet sound. Yet `hazard-pressure.mjs` blanket-removed every charging/releasing shutter mesh whenever *any* real guardian telegraphed. On the very frame the game needed to show two threats, the 16-piece exterior physical chamber vanished while camera/audio claimed danger. That is a systemic staging contradiction, not an isolated CSS or test issue.

The existing 3D stage now consumes the same `observedImmediateTrap(snapshot)` that its lighting/camera already consult. If the source confirms the real player is evading a near-body shutter in its final 1–6 fixed ticks, the intact exterior jaws close physically *through* the boss windup. After active contact, they persist until a genuinely adjacent active→inactive source observation, then physically disengage near the actor, even with a living guardian. Distant threats, unobserved intent, early 7–12 tick pressure and speculative releases still yield to the boss. An observed near-body trap receives the first instanced slot within its collision/charge phase; never mutate the source hazard list. Genuine active attacks always outrank warnings.

Only the current `SourceTimedHazardChargingShutters` instanced geometry was reused (16 pieces per hazard, maximum 6 normal / 3 low, one GPU draw), with two source-only diagnostics. No imported assets, extra WebGL pass, new camera, audio dependency, HUD clutter, authored collision, AI/HP/seed/replay policy change. Reduced-motion leaves static shape rather than forcing animation. Genuine nearby danger retains clear geometry without relying on color or sound.

Playable source commit: https://github.com/my-edutu/Ai_games/commit/51987aa84e683361f2b064ceb3a80cbfec621a21
Crossfire physical contract: https://github.com/my-edutu/Ai_games/blob/51987aa84e683361f2b064ceb3a80cbfec621a21/tests/phase3/tower-guardian-crossfire-physical-pressure.test.cjs

## Grounded validation; NO Gauntlet experience PASS

- Original frozen baseline: `1731b380851162741761c5569e2bc152a0869ca9`; unchanged, NOT reset.
- Full exact-source logic safety workflow at `51987aa84e683361f2b064ceb3a80cbfec621a21`: [41911963228](https://github.com/my-edutu/Ai_games/actions/runs/41911963228) **SUCCESS**. This is strictly a safety veto check, not game quality.
- Exact-source [source-pinned normal-speed video workflow 41911963177](https://github.com/my-edutu/Ai_games/actions/runs/41911963177) completed both baseline/candidate **danger** and candidate **outcome** jobs for desktop and phone at inspection. Further jobs were still running. Same seeded floor-8 danger and low-quality 960×600 / 390×844 actual WebGL.
- Genuine **candidate danger**: desktop **128.534s**, portrait **116.500s**, no logged renderer errors. Frozen **baseline danger**: desktop **175.476s**, portrait **131.519s**. Candidate and baseline both exceed 60s, but their runs/floors/action beats differ at the same timestamp. These are **NOT event-matched blind A/B**.
- Genuine **candidate outcome**: desktop **143.362s** and portrait **114.106s**, public-source health-depleted result and result/intermission recorded, two run-token transitions each, original result cards visible in browser observations. This is not a fresh-context full-motion opinion or proof of equivalent baseline outcome framing.
- In each candidate danger file, 69 spaced observations include *zero* `crossfireWarnings` and *zero* `crossfireReleases` at their sampled instants. The true six-tick warning is only ~300 ms at source 20 Hz, so 1–2-second sampled observations can miss it; we cannot conclude the event never happened. But we **also cannot claim anyone has seen the new physical crossfire on a genuine concurrent contact episode**. A CI-native full-motion raster is needed.
- The preceding e452 source video [41908496684](https://github.com/my-edutu/Ai_games/actions/runs/41908496684) did finish 9/9 jobs; those clips predate this change. One current-source capture job remains unverified until completion.
- Fresh independent blind reviewer panel is unavailable (`NOT_FOUND` disconnected worker/browser). **LOOKS 0/5, FEELS 0/5, PLAYS 0/5 are missing judgments, not a poor score.** Supported-device frame-time p50/p95/p99, memory, accessibility and comparative replay also remain unmeasured/ungraded.

## Separate specification and quality review, and remaining decisive work

**Spec safety:** no modification to deterministic fixed-step authority, source snapshots, RNG, AI steering, damage, combat outcome, collision or branch #58. Source-staged event prioritized solely in existing physical presentation; previous source-active phases remain physically closed; observed release is adjacent and bounded; low tier keeps its 3-hazard budget. New exact-source technical CI is green.

**Whole-experience quality:** NOT EVALUATED. Guardian and shutter can still be split across 390×844 portrait or occluded behind real gears. A clip's NDC projection does not prove raster visibility. New source film has not shown a fully evidenced simultaneous near-body warning→hit→release at normal speed. Matched-seed runs do not guarantee matched encounters, outcome and restart in the same moments. Do not promote a transformation.

**Next:** locate genuine live source crossfire ticks (not a test-injected scene) and pin a continuous >=60-second event-matched desktop + portrait replay for both original baseline and candidate; inspect real moving pictures, helmet-to-boot framing, actual closing jaw mechanics and safe route, guardian HP, result/restart. If candidate is not better, transform that entire encounter again. Require >=4/5 actual blind fresh-context preferences in EACH LOOKS/FEELS/PLAYS, no material regressions, real supported-device tails/memory, accessibility and replay checks. Never force-push/merge/deploy. The current same initiative remains OPEN.
