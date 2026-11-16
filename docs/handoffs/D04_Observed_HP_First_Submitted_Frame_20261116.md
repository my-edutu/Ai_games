# D04 — Observed HP injury first eligible submitted frame (2026-11-16)

Status: **implemented on isolated D04 branch; corrected-head native and real-browser verification unverified**.

## Scope and reason

The completed [authentic Chrome run 43816409781](https://github.com/my-edutu/Ai_games/actions/runs/43816409781) from preceding head `99b6206` passed 399/399 native contracts and its build, but failed strict physical audiovisual acceptance (six browser tests passed, one rejected). Six original Dungeon viewports (cinematic/tactical/chase, 1440x900 and 390x844) shared 12 authority ticks and five actual HP-loss ticks with **zero damage ticks confirmed drawable across all six views**. The native Chromium decoded-video classification and independent PCM onset remained unverified. Representative actual HP observations took 2,217ms and 2,985ms to reach post-WebGL submission; D04's corresponding visual-CPU observations were 2ms and 0ms. An additional observed receipt reached submission at 116ms but did not establish independent decoded impact pixels or sound. CPU intervals do not prove the root cause of renderer stalls.

The D04 public planner independently proves adjacent-tick victim HP loss. Its optional confirmed melee-pose annotation can request 215ms of **cosmetic** delay, without proving the attacker or contact time. On the opt-in submitted-frame path that delay can skip the first usable WebGL frame during severe renderer stalls. The preview then has no drawable injury, despite a genuinely observed public HP drop. This is a missed presentation opportunity, not a mandate to bypass the 400ms sound age gate.

## Changes

1. [`0dce56e`](https://github.com/my-edutu/Ai_games/commit/0dce56e0cc9203c7b6d27d32fa8e8a40592ed238) adds one native regression in `tests/foundation/dungeon-physical-feedback-d04.test.cjs`. It checks a legitimate HP transition with a real, optionally 215ms-annotated delay; requires a first-frame opt-in injury cue, no sound before submitted frame, one sound on a 50ms fresh receipt, and unchanged non-preview timing.
2. [`005af5e`](https://github.com/my-edutu/Ai_games/commit/005af5eda60af9fb2f9f3e68d87f5bbc6d117259) changes only `public/ai-dungeon/physical-combat-feedback.js`: when `requirePresentedFrame` is enabled, verified `observed-hp-drop` `damage` and `damage-fatal` cues are scheduled for the first eligible frame, leaving `cue.delay` intact in forensic receipts. The earlier zero-delay policy for authentic swings and Warden releases stays in place.

Nothing authorizes generic attempts, inferred targets, manufactured damage, synthetic sword contact, or overdue WebAudio. The authoritative planner, seven pooled visual budgets (102 retained instances), 8-voice cap, 32 pending, 32 awaiting-frame, 64 receipt limits, opt-in/mute, accessible reductions, deduplication, cleanup, and original 400ms deadline are unchanged. Normal `/dungeon` retains its original behavior. Only `?feedback=d04` exercises the correction. No changes to `games/ai-dungeon/src`, rigs, camera, lighting, or other sessions' branches.

## Evidence and verification status

- **Historical BEFORE**: pinned `281735d0910c6b2443648af976003d50412ee324`; its original `public/ai-dungeon/app.js` has no D04 opt-in flag. The current `app.js` still gates D04 through explicit `feedback=d04`; this change does not modify that file.
- **Source contract**: new D04 action guard plus registered regression independently checked against both old and new GitHub file content; changed-file comparison shows exactly two D04-owned paths.
- **Test-first RED**: regression was committed before correction, but an actual RED Node workflow result has not been obtained. Source inspection predicts the new first-frame assertion fails on the old version. Do **not** count that as an executed RED run.
- **Corrected-head Node suite and TypeScript build**: **not yet verified**. Previous head was 399/399 and built; do not extend that verdict to the two new commits.
- **Corrected-head genuine Chrome playback**: **not yet verified**. The branch workflow is configured for push, but its new-run ID/verdict is not available through the current connector's read operations. Previous-head six-viewpoint video exists, but no new moving visual improvement or aligned Opus PCM has been demonstrated.

## Required follow-up and rollback

Run `npm ci && npm run build` and the complete D04 native suite from `dungeon-d04-foley-identity.yml`. Then execute `npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs` in genuine Chrome with the SHA-verified CC0 assets. Specifically compare intended 215ms versus scheduled 0ms in damage receipts and look for a *timely, actually drawable* injury on at least one newly recorded original moving-frame pair without retroactively admitting sound or exceeding resources. Collect 3 angles at both viewports, decoded PCM with a demonstrable common clock, missed swing, block, dodge, arrow, spell, entire Warden warning/release/recovery/counter/defeat and run reset, accessibility/mute/reload, WebGL recovery, and a 20-minute cleanup soak.

**Next dominant observed weakness:** multi-second renderer-call intervals and missing universally drawable real injuries; a first-frame admission alone cannot fix WebGL submission. No Diablo IV parity, synchronized original sample onset, or transformed/production-ready claim is justified. Revert only production commit `005af5e` if the direct first-frame admission demonstrably harms physical coherence or bounded-frame safety; retain its test-first rationale for review. Do not merge or change default without a separate final integration review.
