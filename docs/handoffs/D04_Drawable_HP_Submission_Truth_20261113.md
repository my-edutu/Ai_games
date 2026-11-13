# D04 — Separate verified HP sound from visibly submitted injury (13 November 2026)

**Status:** incremental isolation fix committed for review; genuine moving-contact audiovisual acceptance **NOT achieved**. Current CI verification must be checked independently; an in-progress Chrome job is not a pass.

## Scope and baseline

- Repository `my-edutu/Ai_games`, ONLY branch `feat/dungeon-d04-combat-feedback-realism-20261108`. Never merge main/PR #49.
- Frozen BEFORE remains `281735d0910c6b2443648af976003d50412ee324`.
- All changes are confined to `public/ai-dungeon/physical-combat-feedback.js`, D04 evidence classifier, foundation tests, isolated CI workflow, and this D04 handoff.
- No authoritative `games/ai-dungeon/src/**`, camera, character rigs, lights, or other session branches changed. Normal spectator remains default; experimental D04 requires `?feedback=d04`.

## Observable defect and contract correction

D04 correctly allows independently proven HP-loss **audio** on an acknowledged WebGL frame when retained injury shards are live but occluded. `classifySubmittedCombatAudio()` explicitly supports `allowVerifiedSoundOnlyImpact`. Its terminal `delivered` receipt previously carried `visual:true`, meaning **effect emitted into a retained pool**, not affirmative proof that a drawable injury fragment was actually presented. The independent browser acceptance classifier could improperly label this sound-only receipt `VISUAL_ADMITTED_NOT_AV_VERIFIED`.

The controller now records `visualDrawableAtSubmission` as a bounded tri-state per final frame receipt, using the existing same-cue `hasDrawableCue` witness. `true` means drawable, `false` means hidden and `null` means unverified/not queried. Valid `visual-only-submitted` silent receipts likewise carry this witness. The strict browser classifier now requires affirmative `visualDrawableAtSubmission === true` for **visible** injury acceptance; it continues to require the exact current scene/tick/checksum/victim, actual adjacent HP decrease, no invented attacker, real frame ID, monotonic clock and 400ms receipt limit. An audio-only verified hit remains audible if previously authorized, but is **not** proof of visible contact. No frame receipt proves decoded VP8 presentation time or audible PCM onset.

A previous focused correction also rejected impossible `delivered/audio:false` receipts (real foley's `delivered` implies `emit()` succeeded) and retained bounded, cue-exact failure decisions and worst authenticated submission ages, without upgrading expired effects into pass.

## Regression and CI method

- Test-first source-only contracts: `8e51f213`. Confirmed RED [CI 43507634989](https://github.com/my-edutu/Ai_games/actions/runs/43507634989): 307 passed, two expected failing tests.
- First correction `96abcaae`: confirmed [CI 43507728763](https://github.com/my-edutu/Ai_games/actions/runs/43507728763) native 309/309 and production build; its long Chrome job was not a verified audiovisual acceptance when inspected.
- Second test-first contracts `2ae323c6`, `097456da`, plus CI coverage `442508e8`, make hidden-but-sounding and drawable-and-sounding injury distinguishable in the actual controller.
- Second code corrections: `03a2a262` adds the tri-state receipt field without additional clocks or pools; `2a6f939b` requires the affirmative witness for authentic visible impact acceptance.
- Run `node --test tests/foundation/dungeon-d04-real-feedback-observation.test.cjs tests/foundation/dungeon-d04-hp-hidden-visual-sound-only.test.cjs`, the isolated workflow's full native suite and `npm run build`; then genuine `npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs` with the strictly licensed models. Re-check the final run rather than assuming green.

## Older genuine gameplay evidence and limitations

The completed [Chrome job 43499064076](https://github.com/my-edutu/Ai_games/actions/runs/43499064076) had five passing browser diagnostics but **failed strict original damage visual admission**. Its real seeded tick-4 `enemy-1-0` HP loss yielded a stale-frame terminal receipt after **2329 ms** observation-to-submission, including **2137 ms** measured renderer call. The 400ms safety deadline correctly refused original hit foley. Later genuine tick-24 HP loss produced a WebAudio source.start log but no decoded sample-aligned PCM/VP8 proof. These are original DungeonRuntime -> Three.js/Chrome evidence, not procedural audition. Similar multi-second renderer work occurs in legacy; D04 causation unproven. Previous desktop/mobile VP8+Opus recordings remain sparse and unaligned (11 and 10 frames, worst PTS gaps 3.063s and 3.375s).

No three matched moving camera viewpoints, 390px contact-to-sound decoded PCM comparison, complete Warden warning/release/recovery/counter chain, miss/block/dodge/projectile/spell/impact simultaneous-threat matrix, or 20-minute soak has been accepted. Any browser artifact from this increment must remain **UNVERIFIED** until inspected independently.

## Two reviews and next weakness

**Specification:** Only actual consecutive HP loss may authorize impact; an attempted swing is not contact. No arbitrary attacker inference. Occluded but real injury remains eligible for the existing original foley path, not visual credit.

**Quality/operation:** Receipt uses an already-computed boolean, no additional renderer scan, WebAudio node, oscillator, buffer, timing sample, camera motion, retained pool, draw, or allocation per active frame; it adds only one small primitive to a bounded 64-receipt ring. Existing limits (7 pools/104 slots/7 draw calls, 8 voices/one 13440-sample mono noise buffer, 32 pending/32 frame-awaiting, 400ms deadline), explicit sound opt-in/mute and reduced motion/flash remain. Roll back only this branch if strict visual semantics prove incompatible with an integration review.

**Dominant remaining weakness:** genuine multi-second WebGL CPU-side render stalls and sparse recorded frames prevent believable moving-blade-to-body verification. Do not remove the 400ms deadline or ascribe renderer work to D04 without matched legacy/preview profiling. Hand non-D04 renderer architecture changes to its owner. Full final integration review is required before ever making D04 default.
