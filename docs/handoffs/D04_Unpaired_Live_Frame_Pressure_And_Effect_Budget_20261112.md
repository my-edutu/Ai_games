# D04 — Unpaired live-frame pressure and full-observation VFX budget gate

**Date:** 12 November 2026  
**Owner:** isolated Session 4 physical combat feedback and original sound  
**Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`  
**Frozen BEFORE comparison:** `281735d0910c6b2443648af976003d50412ee324`  
**Base before this increment:** `9f6f88ba0b9f76e5ec6251b286461da5797fdf22`  
**Status:** Diagnostic implementation committed; production combat acceptance **NOT MET**.

## Observable defect and test-first regression

The latest completed authentic Chrome run [43215760360](https://github.com/my-edutu/Ai_games/actions/runs/43215760360) passed the native contracts/build and **5/6** real Chrome trials; the strict injury gate remained red with `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. More importantly, real continuous playback frequently skips authority states under multi-second software-WebGL submissions.

The prior continuous legacy/preview classifier checked the D04 GPU pool caps **only for ticks paired against a legacy observation**. The actual browser arms advance independently under the same authentic seed; a severely stalled, over-budget D04 frame is likelier to be unmatched. Such a frame could be omitted from the budget verdict even when genuine telemetry sampled it. The prior comparison also lacked a single conservative view of warmup, observed effects, long render calls, and sampled authority-tick gaps.

The test-first commit `fa808cdd725121f4c661a6bf5d872acde86ad30d` adds three contracts:

1. an unmatched D04 frame at stage 6 with **105 reserved VFX instances** must fail the **104 instance cap** and retain its 1,800ms render call;
2. a browser sampler jumping from tick 1 to tick 5 must record the genuine tick-4 HP loss as **unobserved by that sampler**, without claiming missed WebGL contact or assigning an attacker;
3. the first two submitted samples, subsequent render samples, zero-active-VFX samples, and active-VFX samples must receive separately labelled noncausal distributions.

The isolated coding tunnel was unavailable: the tests were committed before their implementation, but a genuine Node red test run on that intermediate commit was **not verified**. The corrected module and all **11** focused existing/new contracts were executed within a V8 CommonJS-compatible assertion harness; this is **not equivalent** to the native Node suite or browser acceptance. Fresh GitHub Actions must be checked separately.

## Actual edits

- `tests/browser/dungeon-d04-continuous-mode-pair.cjs`: `framePressure` now summarizes **all valid sampled WebGL submissions**, not just overlapping states; reports consecutive authority stage gaps between samples, genuine HP-loss stage indices unobserved by the sampler, >400ms render calls, warmup versus later frame costs, and zero/positive retained effect density. Every valid D04 frame is checked against **7 draw calls, 104 reserved instances**, plus active draw/instance consistency. An unmatched cap breach changes the verdict to `LIVE_EFFECT_BUDGET_VIOLATION`. No attack or audio claim is added.
- `tests/foundation/dungeon-d04-continuous-mode-pair.test.cjs`: three focused regression cases and explicit retained-effect-density fixtures.
- `tests/browser/dungeon-d04-real-live-authority-capture-pair.spec.cjs`: actual real-Dungeon Chrome diagnostic samples now include already-existing `physicalFeedback.visuals.active` and `activeDrawCalls`. The continuous default spectator and opt-in D04 trials remain independent, consented, capture-off, and **not frame-locked**.

No changes to `games/ai-dungeon/src`, main, PR #49, rigs, camera, lighting, game rules, legacy spectator behavior, audio buses, effects geometry, effect pool sizes, WebAudio consent/mute, or the 400ms admission deadline.

## Reproduction and rejection gates

```sh
node --test tests/foundation/dungeon-d04-continuous-mode-pair.test.cjs
node --check tests/browser/dungeon-d04-continuous-mode-pair.cjs
node --check tests/browser/dungeon-d04-real-live-authority-capture-pair.spec.cjs
npm ci
npm run build
npm run dungeon:assets:strict
D04_BROWSER_CHANNEL=chrome DUNGEON_REQUIRE_MODELS=1 npx playwright test \
  -c tests/browser/dungeon-d04.playwright.config.cjs \
  dungeon-d04-real-live-authority-capture-pair.spec.cjs
```

Strict HP-loss visual/foley admission remains tested independently by `dungeon-physical-feedback-preview.spec.cjs`; **never relax its current failing assertion**. Full real-browser evidence must identify the current tested SHA and retain the raw source, software-WebGL mode, viewport, seed, camera, frame receipts and combined original-media limitations.

`framePressure.diagnosticUnobservedHpLossStageIndices` is **not** evidence that the GPU skipped those states: the 80ms browser sampler may miss submitted frames. A frame with 0 active VFX and a 1.5s render call shows that a stall can occur without D04 active geometry in that observation, **not** that D04 is causally innocent. No sample-level audible contact or physically verified blade tip is claimed.

The first two observed frames form an **observational warmup bucket**, not confirmed shader compilation timing. Both density distributions retain extreme outliers. Serial comparisons do not establish effect or recorder causation.

## Budgets, access and rollback

No new draw calls, meshes, geometry, noise buffers, audio nodes, persisted user state or network instrumentation were introduced. Read-only diagnostics are bounded by the existing 120 browser samples and at most 160 authoritative manifest stages. A maximum of 104 registered VFX instances and seven pooled draws remains enforced in evidence. Procedural foley remains behind the user's explicit gesture and mute; stale injuries still receive no late sound.

Rollback: revert this increment's **test fixture**, **continuous classifier**, **real browser diagnostic sampling** and this handoff only. No save or replay schema migration.

## Remaining acceptance work

1. Inspect the next completed real Chrome run and compare long renderer calls against `framePressure` retained effect density without attributing causality.
2. Repair actual continuous HP-loss frame delivery **within D04's ownership only if demonstrated**, retaining the 400ms sound deadline.
3. Obtain matched moving desktop plus 390px mobile from three distinct viewpoints, genuine Warden warning/release/recovery/counter and real miss/block/dodge/projectile/spell/HP loss, decoded synchronized original foley, effect cleanup and 20-minute soak.

**Never infer Diablo-IV parity or claim the complete 3D transformation.** Default spectator stays legacy; D04 requires `?feedback=d04` until final integration acceptance.
