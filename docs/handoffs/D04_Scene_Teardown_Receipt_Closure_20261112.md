# D04 — Terminal receipts for abandoned combat at scene boundaries

**Date:** 2026-11-12. **Status:** IN PROGRESS; genuine audiovisual realism not accepted.
**Branch only:** `feat/dungeon-d04-combat-feedback-realism-20261108`.
**Frozen comparator:** `281735d0910c6b2443648af976003d50412ee324`; it does not contain D04's physical-feedback controller.

## Source observation and scope

The previous live Dungeon Chrome/Three.js evidence repeatedly showed original HP-loss impacts miss the unchanged 400ms submitted-frame sound deadline during multi-second WebGL stalls, even without a recorder. Earlier captured original WebMs have sparse VP8 frames and cannot prove sample-aligned impact audio. An old desktop clip decoded eight frames including a **5.707s gap**; the original mobile capture decoded nine. No new video or audio acceptance is inferred from those clips.

Source inspection of `public/ai-dungeon/physical-combat-feedback.js` identified a separate life-cycle evidence hole. `flush()`, invoked when run/floor changes, on explicit preview reset and on disposal, cleared `pending` and `awaitingPresentation` without a terminal per-cue receipt. A genuine, already-witnessed HP loss could disappear from the local evidence ledger at precisely the restart boundary where testers must prove no ghost sounds. The visual pools were already cleaned; **this is not an explanation for, or fix to, the multi-second renderer stalls**.

## Implemented change

- Before clearing the bounded pending queue, emit a receipt with decision `scene-transition-pending`, `explicit-reset-pending` or `dispose-pending`.
- Before clearing staged post-VFX/pre-WebGL audio, reuse the existing bounded `revokeAwaitingAudio()` to produce `scene-transition-awaiting-frame`, `explicit-reset-awaiting-frame` or `dispose-awaiting-frame`. Count these staged sounds as cancelled, not emitted.
- Preserve old scene, original cue ID, original tick, whether a retained visual was admitted, wall observation timestamp when available, `audio:false`, `frameId:null`, `submittedClockMs:null` and `sampleSynchronized:false`.
- Keep `MAX_PHYSICAL_RECEIPTS=64`, `MAX_PHYSICAL_PENDING=32`, `MAX_AUDIO_AWAITING_FRAME=32` and all original visual/audio budgets. Receipts are bounded and are not proof of a submitted WebGL frame or audible sample.
- Existing `?feedback=d04` opt-in only. No changes to default spectator, shared soundstage, assets, authority, camera, rigs, global lighting or other branches.

## Test-first evidence and checks

- Test-only contract: [5927c60](https://github.com/my-edutu/Ai_games/commit/5927c601113d8c6f29fb36e93d62ece1137ecae4).
- CI registration: [e9e4272](https://github.com/my-edutu/Ai_games/commit/e9e42724705d8cedc70b23dc809f46a60abc5060).
- **Confirmed red:** [Actions 43255998046](https://github.com/my-edutu/Ai_games/actions/runs/43255998046), 214/218 native contracts passed; **all four newly added scene/reset/dispose receipts tests failed**, as expected.
- Correction: [bbaa6d4](https://github.com/my-edutu/Ai_games/commit/bbaa6d4b8086c49b8c09f0da8853a0c5dea6624c).
- **Confirmed green native/build:** [Actions 43256252018](https://github.com/my-edutu/Ai_games/actions/runs/43256252018), 218/218 contracts passed and production build completed successfully. Real Chrome job status must be checked separately. A new browser pass or HP impact synchronization **must not be inferred** from native green.

The four new tests cover (1) pending real HP loss dropped at run change; (2) retained-but-unsubmitted HP fragment at floor change; (3) explicit preview reset followed by a genuinely new HP loss eligible for one new submitted sound; and (4) disposal of pending injury with a bounded receipt and no replay.

## Independent reviews

**Specification:** No attempted swing becomes proof of HP loss. A terminated cue's original tick and old scene are preserved, with no invented attacker, frame, audio onset or counterattack. Resetting or disposing does not deliver stale foley; existing WebAudio consent/mute, reduced motion/flash, source pose checks, and 400ms limit remain unchanged.

**Quality:** At most 32 pending plus 32 awaiting entries are walked during rare floor/run transitions or explicit teardown; each receipt is an existing 64-ring insertion and uses at most bounded scalar data. There is no additional steady per-frame GPU, CPU, texture, audio-voice or network work. Existing visual cleanup still runs and no new synthetic sound or geometry is introduced. The journal can displace old receipts in the same bounded 64-ring during a maximum-volume reset; it is a recent bounded audit, not a persistent log.

**Rollback:** Revert `bbaa6d4`, `e9e4272` and `5927c60` on the isolated branch only if the new receipt decisions break the D04 evidence consumers. Do not merge or modify `main` or Draft PR #49.

## Next dominant acceptance weakness

The dominant **physical-realism** blocker remains authentic continuous Dungeon WebGL submission stalls: previously confirmed HP-loss effects exceeded the 400ms sound deadline and dropped visibly. A genuinely matched three-viewpoint desktop/390px mobile moving A/V sequence, full Warden warning/release/recovery/earned counter and restart, verified missed swing/guard/dodge/projectile/spell, decoded PCM onset against submitted video frames and 20-minute resource soak are still outstanding. Preserve failed acceptance as failed. The next owner-aligned investigation should use actual retained D04 effect density and submitted-frame timestamps to identify a measured D04-owned cost before altering the renderer; no camera or global WebGL work belongs to Session 4.
