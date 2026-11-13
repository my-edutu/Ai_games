# D04 — Bounded attribution of slow genuine WebGL submissions

**13 November 2026. Isolated observation work, NOT a successful combat-realism transformation.**

- Repository/branch: `my-edutu/Ai_games` / `feat/dungeon-d04-combat-feedback-realism-20261108`.
- Starting branch head: `536cd8c4aa630ce945ed2bf15d638706465968ac`. Frozen BEFORE remains `281735d0910c6b2443648af976003d50412ee324`; it is not a target for edits.
- Changed files: only `public/ai-dungeon/physical-combat-feedback.js`, its existing `tests/foundation/dungeon-physical-feedback-d04.test.cjs`, and this handoff. No gameplay authority, rigs, camera, global lights, default spectator, other branches or PR #49.
- Test-first contract: [`1a5776e`](https://github.com/my-edutu/Ai_games/commit/1a5776e8b63aaa295e83d538682f9ef20e138dff). Source implementation: [`803e04e`](https://github.com/my-edutu/Ai_games/commit/803e04ee9500a221c4a74122859dae60d62d0306). Tests were authored before implementation; **a completed RED CI run has not been independently confirmed**, and new GREEN native/build/browser outcomes must not be claimed before completed run inspection.

## Why this is the priority

The prior complete real Chrome [Actions 43423038243](https://github.com/my-edutu/Ai_games/actions/runs/43423038243) passed five diagnostic browser scenarios but **failed** strict `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. Its continuous run comparisons saw multi-second outliers, including in legacy/no-D04 conditions. The previous frame-level cue receipts could quantify a real observation-to-WebGL gap only **when a combat cue existed**. They were insufficient for classifying stalls in otherwise ordinary submitted frames.

The two existing older genuine gameplay WebMs have real VP8+Opus tracks, but only 11 decoded desktop frames (largest 3.063s gap) and 10 decoded 390px frames (largest 3.375s gap). These clips are **pre-change, unaligned and not proof of contact-to-PCM synchronization**. The desktop track is only 587×339 encoded pixels and mobile 386×517, not full-resolution matched motion evidence.

## Increment delivered

The existing `acknowledgePresentedFrame()` now records read-only submission-phase diagnostics for opt-in D04 **after a real frame ID** and using only clock readings already taken at the visual advance start/end and after WebGL submission. No new hot-path clock calls. Each unique, paired advance and receipt can be measured as:

1. `advanceToSubmissionMs`: actual start-of-D04-advance to post-WebGL acknowledgement wall time.
2. `d04VisualAdvanceMs`: D04 visual pass wall time.
3. `afterVisualToSubmissionMs`: remainder after the D04 pass, **not solely D04 cost**.
4. `beforeRendererMs`: remainder minus measured `renderer.render()` interval, only when clock domains and ordering permit subtraction.
5. `rendererMs`: supplied measured render-call time, **not GPU completion**.
6. `observedRafMs`: raw input frame interval, never an inferred contact time.

Only slow post-advance submissions (at least 100ms measured) are saved. The forensic ring is bounded to 32 frozen value records; counts separately track all verified, unverified and slow submission phases. Duplicate frame IDs cannot inflate counts, and extra acknowledgements without a fresh `advance()` are unverified. Failed/regressing clocks and inconsistent render-submission intervals cannot mint a false phase split. These diagnostics are accessible in the existing opt-in `physicalFeedback.stats()` and real-browser diagnostic snapshot. They do **not** authorize sound, modify the 400ms timeout, mutate HP, or allocate new WebGL/audio objects.

## Verification and limitations

Focused regression tests added to the existing D04 native suite check a 16ms rAF with a **150ms** actual post-advance-to-submit receipt, separating 20ms in D04 visuals, 105ms outside the measured visual/renderer interval, and 25ms in the renderer call; replay IDs; ordinary frames; invalid monotonic clocks; and bounded retention across 39 consecutive slow frames. These are **controlled source-level clocks**, not measurements of actual browser speed.

Run on isolated branch:
```sh
node --test tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```
The shared local coding tunnel was offline during this increment. Do not describe the tests as completed or the current browser as verified without inspecting the matching Actions run. No new three-viewpoint matched captures, decoded PCM onset, real Warden multi-beat footage or 20-minute soak have been produced in this increment.

## Safety, independent review and next owner handoff

Seven retained GPU pools, 102 reserved effect instances, maximum seven draws, at most eight original foley voices, 32 pending, 32 awaiting-frame and 64 cue receipts remain unchanged. The new diagnostic ring contains numeric performance values and frame IDs only; it is bounded independently and does not create live audio or GPU resources. Existing HP-only injury causality, missing-attacker neutrality, opt-in/mute persistence, reduced motion/flash, dedupe, floor/run revocation and original audio submission deadline are untouched.

**Specification review:** no forbidden changes; no sound before a real submitted frame; no claims of visible blade contact or decoded PCM timing. **Quality review:** the added receipts are observational, not a speed optimization. Their 100ms threshold excludes fast frames from the retained ring; pre-advance stalls, GPU completion and pixel/audio encoding remain outside its attribution. Do not mistake `beforeRendererMs` for D04 cost.

**Next dominant work:** inspect actual per-phase browser evidence across paired legacy/D04 runs to establish which part of the frame stalls, then target the proven owner. Obtain three same-seed/tick/checksum moving camera viewpoints at 1440×900 and 390×844, genuine Warden warning/release/recovery/counter, miss, block, dodge, arrow, spell, real HP-loss impact, original decoded PCM/video onset, and a 20-minute cleanup/soak. Preserve opt-in `?feedback=d04` and do not merge to main or Draft PR #49 pending final independent review.

**Rollback:** revert the telemetry implementation commit `803e04e` only on this isolated branch if it adds unacceptable overhead or violates measurement contracts. Retain the failing/passing contract history for audit.
