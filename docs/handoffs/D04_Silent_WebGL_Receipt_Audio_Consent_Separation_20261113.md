# D04 — Silent WebGL receipt and audio-consent separation (2026-11-13)

Status: **isolated source change; genuine audiovisual realism NOT accepted**.

- Repository: `my-edutu/Ai_games`
- Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`
- Work began from live head `8c63be338d0d0ead52e3661a3de5f20f544f45a2`.
- Frozen BEFORE remains `281735d0910c6b2443648af976003d50412ee324`.
- Legacy `/dungeon` remains default. This is exclusively the `?feedback=d04` experiment; there is no permission to merge to main or Draft PR #49.

## Observable blocker and scope

The genuine Chrome run
[43450542146](https://github.com/my-edutu/Ai_games/actions/runs/43450542146)
logged a desktop slow-frame sample of **3264ms measured inside the renderer call**,
**3ms in D04 visual advance**, and a mobile sample of **2163ms renderer**,
**0ms measured D04 advance**. These are CPU-phase timings, *not*
GPU-completion evidence or proof of causation. Strict authentic HP-impact
acceptance still failed `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`.

A separate, concrete D04 diagnostic defect was found: `acknowledgePresentedFrame`
returned immediately when WebAudio was not opted in. That suppressed genuine
visual/WebGL submission counts and bounded slow-frame phase evidence in the
silent preview, making the relevant muted-vs-opted-in comparison impossible.

## Test-first implementation

1. Added a core contract for actual, distinct submitted frames before
   sound consent, during an opted-in session, and after explicit mute.
   It asserts slow-phase recording, replay deduplication, and **zero**
   retroactive audio from a muted HP event.
2. Restored the complete foundation contract file to isolated CI's trigger
   and test command; it had not actually been executed by this D04 workflow.
3. The first newly wired run
   [43459710263](https://github.com/my-edutu/Ai_games/actions/runs/43459710263)
   failed as expected for the silent receipt (0 rather than 1). It also
   revealed an **older stale test fixture** treating arbitrary evade prose as
   sufficient for a dodge. The fixture was corrected to require an actual
   one-cell move plus the matching public semantic evasion event.
4. Removed only the `!optedIn` **frame-observation** gate from the D04
   controller. No audio permission, sound scheduling, visual authority,
   renderer, rigs, lighting, camera, or gameplay rules were changed.
5. The next runner log showed **268/268 executed tests passing**, including
   the new contract, but the overall job failed because adding the core file
   missed a shell line continuation before the existing realism test file.
   That CI command was corrected in the next commit. The corrected
   [CI and authentic Chrome job](https://github.com/my-edutu/Ai_games/actions/runs/43460424033)
   remains the final verification target. Do not treat a queued or
   in-progress job as a passed build or browser acceptance.

## Boundaries and resource impact

- Actual WebGL submission receipts, 32-slot slow-phase diagnostic ring,
  64-slot delivery receipts, and bounded frame-ID deduplication are retained.
- No audio before an actual click. Explicit mute still revokes staged
  original foley; no old injury receives a retroactive sound.
- The original 400ms real-frame contact-audio deadline, HP-only impact
  evidence, no inferred attacker, reduced-motion/reduced-flash, cleanup,
  and existing visual/audio pool budgets remain unchanged.
- Silent D04 now performs the existing monotonic receipt clock check once
  per actual submission; any performance effect must be measured in-browser,
  not guessed from unit fixtures.

## Evidence inventory and next acceptance gate

The available older genuine unaligned VP8+Opus media was inspected locally:
desktop has **11 decoded video frames**, worst adjacent frame gap
**3.063 seconds**; 390px mobile has **10 frames**, worst gap
**3.375 seconds**. These are real game recordings, but are not matched
three-viewpoint moving comparisons or contact-to-original-PCM proof.

Next: review the corrected Actions contracts and genuine browser verdict;
compare silent D04, audio-enabled D04, and legacy under matched dynamic HP
loss. The dominant observed multi-second renderer-call stall may require
another owner's renderer work; do not change that subsystem inside D04.
Still unverified: three moving viewpoints at 1440×900 and 390×844,
Warden warning/release/recovery/counter, miss/block/dodge/ranged/spell
event A/V causality, source-start/PCM alignment, and 20-minute resource soak.
Do not claim parity with commercial reference games.
