# D04 — Recover native verification of first-frame verified HP effects (2026-11-16)

**Scope:** isolated `feat/dungeon-d04-combat-feedback-realism-20261108` only. Main, Draft PR #49, `games/ai-dungeon/src`, rigs, camera, global lighting and all other session branches untouched. Frozen historical BEFORE comparison remains `281735d0910c6b2443648af976003d50412ee324`. Default spectator remains legacy; the D04 preview requires `?feedback=d04`.

## Blocking defect found in executed CI

After the earlier source change to present **confirmed actual HP loss** on the first eligible WebGL frame, two original focused audio-frame deadline tests still required the obsolete 215ms *scheduling delay*. The controller intentionally retains that optional melee-pose projection only as `intendedDelayMs` forensic metadata; it now records `scheduledDelayMs=0` for a verified observed-HP-drop injury in the real submitted-frame path. The old assertions contradicted the frozen public-HP/visual truth contract and stopped the entire dedicated Chrome job.

The [executed failing native workflow](https://github.com/my-edutu/Ai_games/actions/runs/43829631825) reported 400 passed and two failed, both within `tests/foundation/dungeon-d04-audio-frame-deadline.test.cjs`:
- the old receipt asserted `scheduledDelayMs === 215` but actual was `0`;
- the old 190ms first-frame test asserted zero visuals, but actual was one authorized HP injury.

## Isolated correction

[Commit `413448b`](https://github.com/my-edutu/Ai_games/commit/413448b79e2eddc2d1c20f2edbdbf6d5b1733d3c) modifies only `tests/foundation/dungeon-d04-audio-frame-deadline.test.cjs`:
- assert the **two different clocks** explicitly: `intendedDelayMs === 215` (annotation preserved) and `scheduledDelayMs === 0` (actual authorized first-frame presentation);
- at 190ms, require the injury visual in the first eligible real frame; at 230ms, require exactly the same single admission, no duplicate; both intervals remain sound-silent before WebGL receipt;
- preserve the exact 400ms fail-closed sound deadline, genuine acknowledged-frame gating and the existing case that an unsubmitted 720ms real-frame stall plays no sound.

No implementation file, GPU pool, instance, voice, material, generated PCM, authoritative snapshot, tick, attacker, pose, lighting, or runtime default was changed by this correction. There is no new renderer performance claim.

## Verification separated by type

- **RED:** executed previous-head CI 400 passed / 2 failed, specifically due to obsolete test expectations; this does **not** indicate a newly observed game-causality regression.
- **GREEN:** [GitHub Actions run 43863538258](https://github.com/my-edutu/Ai_games/actions/runs/43863538258) at `413448b` completed the contracts job with **402 passed, 0 failed**, followed by a successful `npm run build` (TypeScript `tsc -p tsconfig.json`).
- **Genuine corrected-head Chrome:** the same run's `real-preview` job was **in progress at this handoff**. This document does not claim its result, actual damage pixels, original Opus/PCM onset, motion-qualified visuals or Warden acceptance.
- **Historical genuine evidence only:** previous real Dungeon Chrome runs produced matched cinematic/tactical/chase sources at 1440×900 and 390×844, but five shared authoritative HP-loss ticks had no universal verified visible injury. Earlier bounded diagnostics recorded individual multi-second WebGL render intervals; the specific cause was unproved. An earlier authenticated VP8/Opus recording and its decoded frames are **not** current-head proof.

## Independent acceptance still outstanding

Inspect the corrected-head authentic Playwright artifacts before any acceptance claim. Compare actual submitted frames to prior matched recordings, check per-contact `observedClockMs`/`submittedClockMs` and independent decoded PCM onset, then require distinct miss, block, dodge, projectile, spell, Warden warning/release/recovery/counter, restart and 20-minute cleanup soak. A successful Node suite or readable still frame cannot pass any of those gates.

**Next dominant defect to measure:** actual HP-impact visibility during sparse/multi-second WebGL submission. D04 owns bounded retained-feedback admission, cleanup, original sound and forensic receipts, **not** other sessions' render pipeline or rig/camera. Do not change the 400ms deadline or infer an attacker to make failure look like success.

**Rollback:** revert only the test-contract commit if the owner explicitly restores the old behavior in a separate reviewed runtime change; otherwise reverting would knowingly reintroduce false CI assertions. No default switch or merge to main.
