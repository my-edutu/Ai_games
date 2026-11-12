# D04 — Live retained instance-update pressure, without false GPU causality

**Date:** 2026-11-12. **Branch:** `feat/dungeon-d04-combat-feedback-realism-20261108`. **State:** IN PROGRESS; physical combat realism NOT ACCEPTED.

**Frozen BEFORE:** `281735d0910c6b2443648af976003d50412ee324`. The frozen milestone predates the D04 retained visual pools. **Do not merge or update main or Draft PR #49.** Only D04-owned visuals, isolated evidence/tests, and this document changed.

## First unresolved acceptance: confirmed damage is not reliably presented on a timely genuine frame

The last completed true Dungeon/Chrome job [43266894918](https://github.com/my-edutu/Ai_games/actions/runs/43266894918) passed its native/build checks and five browser trials, but the strict original HP-loss admission trial failed: `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. Continuous real-authority comparisons still recorded intermittent multi-second direct WebGL render calls **even with recording disabled**. The evidence does not demonstrate that D04's visual pools cause them. Matching stage snapshots from sequential experiments cannot replace actual continuously moving frame/audio synchronization.

Previously captured **real** desktop original-canvas WebM has eight decoded VP8 frames, including a 5.707-second gap; older mobile evidence has nine frames and a 4.658-second gap. These recordings predate this increment. Frame rate and physical contact/audio alignment remain unverified.

## What was changed

- `public/ai-dungeon/physical-feedback-visuals.js`: a fixed-size (seven-pool) read-only telemetry summary now reports the number of JavaScript `setMatrixAt` calls performed in the **last D04 visual advance**, which pools they came from, the number of dirty pools, and the upper envelope of full reserved instance-matrix buffers touched. The worst permitted envelope is **102 reserved instances × 64 bytes = 6,528 bytes**. There are no per-frame history arrays, geometry allocations, GPU readbacks or changed lifetimes. This is **not** a GPU timer, proof of `bufferSubData` bytes actually uploaded, encoded video delivery or an audio synchronization metric. Writes performed by emission, reset and other non-advance paths are intentionally excluded from this specific `lastAdvance` counter; they must not be silently attributed to the render pass.
- `tests/foundation/dungeon-d04-held-warning-gpu-update.test.cjs`: an instrumented production-visual adapter confirms held true Warden warning cells incur zero subsequent advance matrix writes, while warning creation, movement and authority cancellation are accounted separately. Visible warning/retirement and static resource caps are preserved.
- `tests/browser/dungeon-d04-real-live-authority-capture-pair.spec.cjs`: the existing genuine continuous-authority page sampler, already collecting real direct WebGL render cost and immutable state checksums, now also samples D04 visual-update pressure on **each observed frame**. Both the legacy and D04 arms still use the same seed, viewport, tactical camera, consent click and serial no-recorder comparison; the captured original A/V remains unsynchronized.
- `tests/browser/dungeon-d04-continuous-mode-pair.cjs` and `tests/foundation/dungeon-d04-continuous-mode-pair.test.cjs`: validates those new counters, catches impossible per-frame/per-pool update budgets even in **unmatched** genuine D04 frames, and keeps WebGL calls over 400ms visible even when the D04 instance-write counter is zero. The classifier explicitly retains `causedByD04:null`, `sampleSynchronized:false`, and `impactAVAccepted:false`. A missing observed authoritative tick remains a sampler gap, not a guessed missed GPU frame.

The additional bounded counters are diagnostic only. The retained seven pools, 102 reserved instances, at-most-seven draw calls, existing 32 pending effects, 32 sounds awaiting a WebGL frame, 64 receipts, original WebAudio consent/mute and interruption policies, 400ms stale-audio deadline, reduced-motion/flash options and scene/renderer cleanup semantics do not change. A swing still cannot establish contact or HP loss; damage still cannot invent an attacker.

## Test-first record

- Test-first commit [12f8b47](https://github.com/my-edutu/Ai_games/commit/12f8b474c8214f94fd61181916fa3cc06e11928c) was executed independently in [CI 43277423493](https://github.com/my-edutu/Ai_games/actions/runs/43277423493): **one expected new missing-telemetry contract failed**, 219 pre-existing contracts passed, total 220 tests.
- Source implementation [8be757d](https://github.com/my-edutu/Ai_games/commit/8be757dc0e370875cc729eb5a022d623b345cd34) followed.
- Browser-classifier regression fixtures [3efaafd](https://github.com/my-edutu/Ai_games/commit/3efaafd0be13406bb04078a0dfc906a1d6679aba) ran before their classifier implementation, in [CI 43277715832](https://github.com/my-edutu/Ai_games/actions/runs/43277715832): **two expected new contracts failed**, while the already implemented visual-stage test passed.
- Classifier implementation [ec80ff4](https://github.com/my-edutu/Ai_games/commit/ec80ff485e1a5274271a5261cbb5225cb45388c8), real browser sampler [221af0c](https://github.com/my-edutu/Ai_games/commit/221af0c89b876087e7211427cb14f5ae4600a4b2).
- Final post-change [CI 43277958439](https://github.com/my-edutu/Ai_games/actions/runs/43277958439) was **still running at documentation authoring**. Native tests, build and fresh real browser results for that final commit are NOT claimed passed until verified independently. The real HP-loss admission trial is expected to remain a strict fail until repaired, not to be weakened.

**Test commands used by isolated CI**: `node --test` for the D04 foundation suite (including both modified contracts), `npm run build`, and real `npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs` in Chrome with SHA-verified CC0 GLBs. The local shared coding tunnel was unavailable, so commits were made through the GitHub connector and checked in Actions. No new stand-alone foley audition is presented as a real Dungeon audiovisual proof.

## Reviews, constraints and next question

**Specification review:** Only D04 public-feedback presentation/evidence files changed. No game authority, rig, model, camera, lighting, HUD, global renderer, shared soundstage, default spectator, unrelated branch or main mutation. No change to foley authorizations, consent, causal provenance or frame submission.

**Quality review:** New stats add four fixed scalar fields and seven fixed pool counters without per-frame-growing logs. The advance loop only increments existing loop-local counters next to real JS matrix writes. This can distinguish long renders occurring on sampled frames with zero D04 advance matrix writes from those with high D04 visual update pressure; it still cannot assign the stall to either case without GPU trace/warmup controls.

**Rollback on D04 branch only:** revert sampler commit `221af0c`, classifier `ec80ff4`, corresponding tests `3efaafd`, visual stage `8be757d`, and its tests `12f8b47`. Do not merge main or PR #49.

**Next dominant weakness:** Correlate actual continuous genuine HP-loss frame receipts with real GPU driver submissions and D04 cost, using controlled warmup plus genuine original decoded A/V. Address only verified D04-owned overhead. Record three matched, moving camera viewpoints at 1440×900 and 390×844; Warden warning/release/recovery/counter, missed swing, block, dodge, projectile, spell and real HP-loss contact; and 20-minute bounded resource cleanup. No parity or realism score is claimed without this evidence.
