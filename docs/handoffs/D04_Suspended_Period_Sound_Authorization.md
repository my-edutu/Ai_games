# D04 — Suspend-period sound authorization at WebGL frame receipt

**Status:** incremental source-level fix only; true Dungeon audiovisual acceptance **UNVERIFIED**.

- Repository: `my-edutu/Ai_games`
- Isolated branch: `feat/dungeon-d04-combat-feedback-realism-20261108`
- Previous verified head: `0217071388e5e28b1c9d91e8d5ef55f7536b528f`
- Frozen Gauntlet BEFORE: `281735d0910c6b2443648af976003d50412ee324` (comparison only)
- Do not merge or enable by default; preview remains `?feedback=d04` until dedicated integration review.

## Defect selected and red evidence

The preceding context-interruption fix revoked **existing** queued combat sounds when WebAudio entered `suspended` or `interrupted`. Yet the spectator's prior manual opt-in correctly remained enabled. If a **new** real action was observed *during* that non-running interval, its queued cue received the new current consent epoch; on context resume, the next WebGL acknowledgement could play it as if it had just happened.

This falsely synchronized a resumed whoosh or injury sound with an action performed during browser audio unavailability, even when the authoritative event was older than the resumed frame. The problem was demonstrated in an **adapted V8 production-source reproduction** using the actual D04 controller and cue planner with synthetic visual/AudioContext adapters: one swing staged during suspension was audible after resume (**red: 1 obsolete sound**). It was **not** an authentic browser/WebAudio recording.

## Implementation and why it is bounded

1. Admission of any new cue while its AudioContext is not running records **no audio authorization epoch**. Its legitimate visual art still renders; after recovery that old cue cannot become audible retroactively. A fresh action accepted after recovery can sound normally.
2. The foley admission stage additionally requires a running audio context, not merely a remembered user opt-in.
3. Snapshot ingestion, animation advance, and real WebGL receipt synchronously sample the context state. This catches suspended contexts that offer no `statechange` EventTarget API when suspension is observable at one of those boundaries; normal statechange notifications remain active and idempotent.
4. The listener is detached at disposal. The spectator's explicit consent and persisted mute are **not** silently changed by browser suspension.
5. No impact is classified without actual HP loss; no swing implies a hit; no invented attacker, new voice, sample, effect pool, GPU instance, timer or new frame-receipt queue was introduced.

Scope: `public/ai-dungeon/physical-combat-feedback.js` plus `tests/foundation/dungeon-d04-suspended-period-audio-proof.test.cjs`. No change to the original sound synth, legacy spectator, authoritative game source, camera, rigs, lighting, or other sessions' branches.

## Test-first contracts and checks

Four native Node contract tests were committed **before** the production fix:

- Sword attempt first observed during suspension remains visual, silent after resume, while a genuinely new attempt speaks.
- A suspended-period swing cannot enter the awaiting-frame audio queue.
- No-EventTarget AudioContext is sampled during snapshot ingress and never retroactively speaks.
- Real HP-loss during suspension still produces damage art with `actorId:null`, but only a new post-recovery injury sounds.

In a detached V8 runner, the exact fetched production controller/planner and the four new **test bodies**, alongside five previous interruption-lifecycle test bodies, produced **9/9 adapted passes** after correction. An initial adapted run reported 8/9 because the runner's mock mute preference incorrectly always returned `true`; after correcting the mock to implement production-like read/write state, the same unchanged source/tests produced 9/9. JavaScript module bodies parsed in this runner.

**Not executed or not verified:** native `node --test`, `npm run build`, Playwright, actual WebGL submissions, AudioContext clock and PCM sample onsets, true moving 3D GLBs, genuine Warden warning/release/recovery/counter, missed swing/block/dodge/arrow/spell/HP loss playback, matched three-viewpoint 1440×900 and 390×844 clips, and 20-minute soak. The coding tunnel reported `Tunnel-client has not been seen for 300 seconds`. The GitHub connector did allow source reads and isolated commits; there is no legitimate basis to treat simulated source tests as running-game evidence.

Native validation on an accessible worktree:

```sh
node --test tests/foundation/dungeon-d04-suspended-period-audio-proof.test.cjs \
 tests/foundation/dungeon-d04-audio-context-state-lifecycle.test.cjs \
 tests/foundation/dungeon-d04-optin-epoch-audio.test.cjs \
 tests/foundation/dungeon-d04-visual-audio-submission.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

## Acceptance boundaries, review and next weakness

The existing caps remain seven retained visual pools and 102 reserved GPU instances (at most seven effects draw calls), eight generated foley voices with one shared noise buffer, 32 pending, 32 audio-awaiting-frame and 64 receipt records. Effects remain opt-in only in D04; the normal spectator is legacy.

Spec review: a browser auto-suspend does not become a manual mute, old cues cannot earn retroactive audio, and actual HP/attacker truth remains independent of swing audio. Quality review: state sampling is O(1) at three existing control boundaries; transition latch suppresses repeated flushes, listener is removed on disposal, no per-frame external allocation.

Known limitation: without a `statechange` event, a suspension that begins **and ends entirely between any two controller observations** cannot be inferred after the fact. True browser evidence and failure-path recording remain necessary. This patch is reversible as its own small commit, and **not** acceptance of full audiovisual realism.

**Next dominant issue:** the live sword streak remains sampled from the animated wrist, not authenticated blade-tip geometry. This needs genuine licensed GLB geometry plus synchronized multi-view gameplay and original sound capture before a physical blade-contact claim can be made.
