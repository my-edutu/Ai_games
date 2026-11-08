# D04 — Keep delayed combat cues inside the user's audio-opt-in epoch

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Reviewed parent: `3deec766b961d86750b3ce31f0c48a93f6de9935`. Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`.

**Status: source-level red/green verified; genuine Dungeon 3D + captured audio UNVERIFIED.**

## Observable defect from the actual branch source

`acceptSnapshot()` added a witnessed swing to the 32-entry pending queue while audio was disabled. `popDue()` previously inspected **current** `optedIn` instead of consent state when the cue was planned. If a viewer clicked Enable Audio during the swing's 120ms delay, an OLD sword gesture could unexpectedly speak after the click. The same replay occurred when a sound-enabled attempt was queued, then muted and re-enabled before it became due. The precise parent-source detached V8 reproduction emitted one stale `swing` sound in both cases. Audio arriving after a fresh gesture is not evidence that the action was accepted under that gesture.

## Narrow repair and contracts

The coordinator now assigns a monotonic audio consent epoch on each successful transition from muted/off to opted-in. Each planned public cue retains either that epoch or `null` if sound was not consented to at **planning** time. Its already-scheduled visual still renders normally; the sound may be released only if that epoch is still the active opted-in epoch, and the existing actual-frame submission/liveness policy additionally passes. Mute/re-enable does not authorize replay of a previous epoch's pending events. Native queue, dedupe, scene reset, frame gate, muted preference, voice cap and resource bounds stay unchanged.

A bounded `retroactiveAudioSuppressed` counter and per-cue `audio-opt-in-epoch-mismatch` receipt make suppression inspectable without logging personal information or synthesizing damage. Tests assert that pre-gesture cues and mute/re-enable cues stay silent yet visible, that fresh HP-confirmed damage and post-gesture swings sound, and that the non-gated legacy adapter still emits already-consented events immediately. No change to the public HP planner or attack semantics: a swing is never evidence of injury.

## Evidence and reproduction

Against the exact parent source, a detached V8 harness reproduced **two failing consent examples** (both replayed audio), then used the patched source to confirm the original visuals remain while stale audio is suppressed, followed by legitimate fresh injury/swing audio. The opt-in integration test was added to `tests/foundation/dungeon-d04-optin-epoch-audio.test.cjs` but the native Node runner, full build, Playwright and genuine WebAudio output were **not run** in the disconnected coding environment. The detached adapter is not PCM nor gameplay evidence.

On the D04 branch with installed models, run:

```sh
node --test tests/foundation/dungeon-d04-optin-epoch-audio.test.cjs tests/foundation/dungeon-d04-audio-frame-deadline.test.cjs tests/foundation/dungeon-d04-visual-audio-submission.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

Genuine tests still require 1440×900 plus 390×844, matched three-viewpoint 3D/PCM clips for missed swing, actual HP injury, block, evade, arrow, spell, Warden warning/release/recovery/earned counter, restart, adverse frames, reduced settings and 20-minute soak.

**Review boundaries:** three D04-only files; no `games/ai-dungeon/src`, rigs, camera, lighting, global soundstage, main, PR #49 or other branch. `/dungeon` remains legacy; `?feedback=d04` is opt-in. No new pool, buffer, generated audio, authorial claim, draw call, animation or game damage. Revert only this isolated commit if authentic audio consent behavior regresses. Next dominant realism limitation: source GLB weapon-tip sampling and true synchronized gameplay capture.
