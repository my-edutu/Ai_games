# D04 — Admit genuine silent HP visual receipts without fabricating impact audio (13 November 2026)

**Status:** focused test-first source correction and native/build verification completed; genuine browser audiovisual acceptance **NOT achieved**.

## Ownership and comparison

- Repository: `my-edutu/Ai_games`; isolated branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.
- Starting verified head: `6a57a4f727dbbde516d977af41d3604b34bb1fd4`.
- Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`. That earlier baseline contains neither new forensic classifier nor its test file; it has not been changed.
- Only touched code: `tests/browser/dungeon-d04-real-feedback-observation.cjs` and `tests/foundation/dungeon-d04-real-feedback-observation.test.cjs`. This handoff is documentation only. No authoritative gameplay, D10 app source, visual pools, original synth, rigs, camera, global lighting, main, PR #49, or other session branches were edited.
- Legacy spectator remains the default. D04 only runs behind `?feedback=d04`.

## Dominant D04-owned evidence defect

In the actual D04 controller, a genuine muted / no-consent HP-impact visual can receive a **cue-specific** `visual-only-submitted` terminal receipt after a real WebGL acknowledgement. This path checks original observation time, current scene, lifetime, actual drawable retained slots and that no sound is authorized. However, the independent authentic damage browser classifier accepted only `decision === 'delivered'`, even though that decision is fundamentally the *sound* delivery path. Therefore the classifier reported `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED` for an independently witnessed **silent but actually submitted** genuine HP visual. It also discarded valid bounded opaque/string frame IDs, despite the D04 controller explicitly accepting those in capture/test adapters. These were false negatives in the evidence layer—not proven occurrences in the older sparse gameplay clips, and not a frame-rate fix.

The corrected classifier accepts `visual-only-submitted` **only with `audio:false`**, together with existing exact run/floor/tick/victim, anonymous actor ID, real HP loss, checksum, coherent frame-observation clocks, maximum 400ms age, and nonzero actual frame ID. Valid WebGL IDs now match controller contract: nonnegative safe integers or 1–128-character strings. No change to rules, audio authorization, frame queue, visual pool, or deadline. The result is labeled only `VISUAL_ADMITTED_NOT_AV_VERIFIED`: no proof of visible blade-to-body contact, original PCM onset, encoded VP8 frame timing or A/V sync.

## Test-first and evidence

1. [RED test-only commit `224bfe3`](https://github.com/my-edutu/Ai_games/commit/224bfe3707b57718cf9d55b8588252d2e5a6a6aa) added two contracts. They require silent authentic HP visual success, accept a real bounded string frame ID, and reject illegal / stale / cross-cue / audio-contradictory receipts.
2. [RED CI run `43498911644`](https://github.com/my-edutu/Ai_games/actions/runs/43498911644): **305 passed, 2 failed** as expected. Both expected `VISUAL_ADMITTED_NOT_AV_VERIFIED` but received `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`.
3. [Source fix `ce95dc7`](https://github.com/my-edutu/Ai_games/commit/ce95dc7c5d4df82a29ff9fea861d484f335069dc) changes the independent evidence classifier only.
4. [Corrected CI `43499064076`](https://github.com/my-edutu/Ai_games/actions/runs/43499064076): **307/307 native contracts passed, 0 failed; `npm run build` succeeded**. Real Chrome job had not yet completed when this handoff was written; its outcome must be inspected independently.

The new tests use manufactured *contract fixtures* to exercise classifier logic, not simulated WebGL scenes presented as authentic gameplay.

## Genuine browser and clip limitations

The last completed real Chrome [run `43490529464`](https://github.com/my-edutu/Ai_games/actions/runs/43490529464) had five passing browser diagnostics and one strict failing acceptance: `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. Real continuous instrumentation observed post-advance CPU-side renderer-call outliers around 2.2s desktop and 3.5s mobile, while separate matched legacy trials also stalled. This does **not** assign GPU blame to D04 or prove any browser improvement from the classifier fix.

Independently decoded older actual WebMs supplied to the run: desktop VP8 587×339 and Opus with **11 frames / max 3.063s PTS gap**; mobile VP8 386×517 and Opus with **10 frames / max 3.375s gap**. These are older unaligned recordings, neither three-viewpoint matched motion nor sample-accurate contact foley. No new playable browser footage, sampled original-PCM onset, three matched viewpoints, or 20-minute soak was produced by this source-only correction. A native WebAudio audition cannot substitute for genuine A/V evidence.

## Specification/quality review and next dominant weakness

- **Truth:** a sword attempt still cannot make injury; the actual consecutive HP drop and exact anonymous victim remain the only injury authority. The classifier never labels a soundless visual as audible or sample-synchronized.
- **Budget:** the seven retained pools (≤104 instances/≤7 draws), ≤8 foley voices, 32 pending, 32 frame-awaiting, 64 receipts, 400ms clock, opt-in/persisted mute and reduced-motion/flash behaviour are untouched. No new state, particles, WebAudio nodes, buffers, timers, or instrumentation allocations were added to the running Dungeon.
- **Recovery/privacy:** no cross-run attacker inference, no new identifiers beyond bounded frame IDs, and no change to deduplication, consent, scene teardown or WebGL recovery.
- **Rollout/rollback:** remain behind `?feedback=d04`; revert `ce95dc7` only on the isolated branch if the additional silent-visual classification is rejected at integration review.
- **Next dominant visual weakness:** multi-second real renderer stalls and sparse moving WebGL frames prevent genuine impact readability and PCM/VP8 alignment. Compare measured legacy/D04 phase data, identify the owner of slow render calls, and hand non-D04 code to its session owner. Do not stretch the 400ms impact deadline or falsify acceptance. Continue same seed/run/floor/tick/checksum desktop (1440×900) and 390×844 three-viewpoint clips for miss/block/dodge/projectile/spell/actual injury, Warden warning/release/recovery/earned counter, opt-in/mute, background/recovery, and bounded 20-minute soak.
