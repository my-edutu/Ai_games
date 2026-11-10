# Infinite Tower Climb — original browser camera-witness recovery (P0)

**2026-11-10. Scope:** existing Draft PR #68, branch `feat/tower-transformation-gauntlet-20261101`. Original frozen baseline: `1731b380851162741761c5569e2bc152a0869ca9` (unchanged). **Lead verdict: NOT EVALUATED.**

## Exact-source failure, not an apparent quality improvement

Immutable [candidate recording run 42918130217](https://github.com/my-edutu/Ai_games/actions/runs/42918130217) at `1c55057af70839301742bd3b81f59bd21e9ef03a` **FAILED** even though its [quality run 42918129965](https://github.com/my-edutu/Ai_games/actions/runs/42918129965) succeeded. The original 960×600 and 390×844 *candidate* moving-platform and floor-eight danger Playwright browsers both failed near startup. The real test stack is:

```text
page.waitForFunction / page.evaluate: ReferenceError: followComposition is not defined
    at Object.diagnostics (tower/visuals/scene.mjs:4457:32)
    at window.__TOWER_RENDER_DIAGNOSTICS__ (tower/app.js:41:58)
```

The original `scene.mjs` defined `followComposition` inside the `update(dt)` block but the independent `diagnostics()` function read that block-local variable. This is an ACTUAL runtime diagnostics fault, not bad video transport, a source simulation failure or evidence of improved play. The genuine matrix finished 8/10 successful jobs. Candidate ascent and outcome films completed, but candidate moving/danger did not. Source pair audit correctly reported **4/8 paired source timelines, four missing**. Failed browser jobs uploaded partial ZIPs; **do not count those ZIPs as valid 60-second films**. Existing older matched source films cannot prove current HEAD.

## Source-safe production correction

[`a1ed799f4cfc2008b9b8be10fcabb1ca92aed435`](https://github.com/my-edutu/Ai_games/commit/a1ed799f4cfc2008b9b8be10fcabb1ca92aed435) adds a persistent, one-object diagnostic witness of the **same local composed camera**. `update()` records the source run token, floor, tick, actual guardian ID and the existing `guardianPlannerAnchor` descriptor. Independent `diagnostics()` accepts it only for a currently running, live-HP, non-stale, same-source-tick exact guardian; otherwise returns null. This prevents browser crashes and stale/cross-episode diagnostic claims, with no source gameplay, 3D art or camera shot preference change. A focused regression explicitly checks the independent-diagnostics scope and source identity guards. [`1dcf1e4d26bcd6f71622a7aa2f97730dec8cc417`](https://github.com/my-edutu/Ai_games/commit/1dcf1e4d26bcd6f71622a7aa2f97730dec8cc417) corrects the original regression's regex literal (first test commit accidentally overescaped it). No failing test was skipped or weakened.

**Validation already observed:** old quality run 42918129965 is a pass on `1c55057a`, **not** verification of the two new commits. New exact-head Node22 CI and the new source-pinned browser run must both pass. Local container had no mounted GitHub workspace; no standalone browser or native WebM was executed locally.

## Remaining original experience defect

Previously inspected successful [source-original capture 42903135945](https://github.com/my-edutu/Ai_games/actions/runs/42903135945) at `8e54c4edf26de3bf0578a4b5348d006ce844552f` shows a still-unacceptable 390×844 floor-eight guardian encounter around native 18–23s: hero and guardian alternate small, separated, cropped and partly obscured by near-side bronze machinery. This new change **only repairs the evidence path**. It does not prove the guardian visibility issue solved.

## Next acceptance action

A fresh change to `capture-request.json` triggers the **original immutable ten-job** matrix at `github.sha` against exact frozen baseline `1731b380851162741761c5569e2bc152a0869ca9`; observe real 960×600 and 390×844, low graphics, original seed, source-authentic 20Hz, no time manipulation. Audit 8/8 native event clocks, unedited ≥60s 4-scene film, guardian/crusher→HP0→physical earned passage→floor9→terminal→restart. Inspect actual full motion particularly guardian 13–26s, and source-aligned native frames. If bronze occlusion, camera clipping, or unreliable player/boss two-body framing persists, reconstruct the **actual physical scene/camera system**, not another superficial tracking metric. CI remains a veto, not a quality score.

**Independent blind reviewers:** LOOKS 0/5, FEELS 0/5, PLAYS 0/5. **Supported-device** frame-time p50/p95/p99, memory, thermal and input: NOT EVALUATED. No PR58 edit, baseline move, merge, deploy, force push or draft-status change.


## Actual recovered after-change original film and remaining strict veto

The NEW immutable [10-job original gameplay recording 42920000723](https://github.com/my-edutu/Ai_games/actions/runs/42920000723) ran at exact `00e1e00900a8382d1991d3c7c9397a387459fb77` with baseline still `1731b380851162741761c5569e2bc152a0869ca9`. **All eight authentic browser jobs** for ascent, moving floor seven, danger floor eight, and outcome in desktop 960×600 / portrait 390×844 **SUCCEEDED**; the separate real source-ledged-campaign witness also succeeded. This confirms that moving and guardian browser diagnostic capture no longer trips the previous startup `ReferenceError`. Genuine candidate [danger ZIP 13810624390](https://github.com/my-edutu/Ai_games/actions/runs/42920000723/artifacts/13810624390) contains unedited desktop (~72.52s) and portrait (~73.44s) WebMs. These are capture facts, not visual-quality passes.

**Critical: whole recording workflow still FAILED** at the strict source-pair audit. Its [manifest 13810014677](https://github.com/my-edutu/Ai_games/actions/runs/42920000723/artifacts/13810014677) reports 16 recorded source films, **8/8 paired original event-source timelines, but only 7/8 calibrated native clocks and ONE real provenance defect**: original frozen *desktop danger* initial observed source tick **138** versus candidate tick **75**. At original 20Hz that is **63 ticks = 3.15 seconds**, exceeding the established strict 60-tick/3-second start-offset veto. We must not change that threshold, relabel these events or claim matched full-motion comparison. The initial source observer begins after browser scene readiness, which can vary with old-vs-new software renderer startup; determine and verify a truly matched original start rather than backfilling fake events. `fullMotionPaired=false` and verdict **NOT EVALUATED**.

I extracted and inspected **actual decoded frames** from both new source-pinned 1× danger films at native video 10–29 seconds. At portrait the source-real live guardian scene still alternates a split/distant duo, a large near-camera bronze wheel/cage and near-side rails around ~18–22s; desktop also changes perspective while failing to keep both combat bodies consistently readable. Floor-nine visuals appear at about 25s, but these sampled pixels do **not** certify the true grounded gateway crossing nor continuous-frame action causality. The diagnostic fix was deliberately presentation-neutral and did not cure these previously recorded game-first composition problems.

The exact source [quality run 42920000704](https://github.com/my-edutu/Ai_games/actions/runs/42920000704) **SUCCEEDED** (engineering veto, not experience score), as did [quality 42919661620](https://github.com/my-edutu/Ai_games/actions/runs/42919661620) at corrected test source `1dcf1e4d`. New film source SHA: `00e1e00900a8382d1991d3c7c9397a387459fb77`. No actual supported-device performance, thermal or memory budgets; no independent blind LOOKS, FEELS or PLAYS critiques (0/5 each). Keep **P0 OPEN / NOT EVALUATED**. Next system-level work is an honestly matched initial-source/film clock followed by physical bronze guardian duel staging and camera visibility on both viewports, not another test-only micro-patch.
