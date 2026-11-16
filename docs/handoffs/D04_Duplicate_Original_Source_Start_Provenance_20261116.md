# D04 — Duplicate original source.start identity cannot validate physical impact (2026-11-16)

**Status: isolated incremental D04 forensic correctness; audiovisual realism NOT ACCEPTED.** Keep main, PR #49, `games/ai-dungeon/src`, rigs, camera, lighting and other branches unchanged. Legacy /dungeon remains default; only `?feedback=d04` selects the experiment. Preserve the frozen BEFORE milestone `281735d0910c6b2443648af976003d50412ee324`.

## Why this was prioritized

The previous real Chrome run [43915406404](https://github.com/my-edutu/Ai_games/actions/runs/43915406404) reported five genuine shared HP-loss ticks but zero injuries independently confirmed drawable across all six viewpoints. At tick 4 an ordinary impact was 2608ms late and correctly dropped; at tick 7 a fatal impact had a timely 140ms post-WebGL receipt and one original WebAudio scheduling witness, **not** a decoded PCM onset or visible-pixel proof. Multi-second renderer intervals are still the dominant unsolved realism blocker, owned by the renderer/integration session outside D04 permissions.

The new D04 read-only classifier had a provenance defect: it counted matching **valid** `source.start()` records but ignored another record with the *same cue ID* when its recipe, scene, canonical flag, sample clock or voice count was malformed. A valid source start could therefore launder a second inconsistent source event into a false unique original-impact scheduling report. This did **not** emit extra sound in production, but it weakened the essential audit linking what actually happened to what was scheduled.

The first workflow run that included the new test also exposed a separate fixture error: test #313 omitted required `scheduledContextMs`, so the classifier correctly reported zero sound-start matches; [run 43927327738](https://github.com/my-edutu/Ai_games/actions/runs/43927327738) failed 407/408 tests. The fixture was repaired with a finite **synthetic** clock, without relaxing production validation.

## Test-first, bounded correction

1. [Regression and fixture correction `3ee4b45`](https://github.com/my-edutu/Ai_games/commit/3ee4b45c627a2b87188dfdabb50ef696bc132d0d) extends the existing native test file. A canonical witness remains matchable. A second `source.start` with the same cue ID but wrong sound recipe, wrong scene, missing context clock, noncanonical flag, absurd voice count or completely duplicated event must invalidate the *sound* correlation, without deleting the real drawable frame receipt. Synthetic tests cannot verify audible PCM.
2. Before implementing, the **exact previous branch helper** was executed in an isolated V8 environment with the synthetic witness: canonical start => 1; wrong recipe + canonical => **1 incorrect**; missing clock + canonical => **1 incorrect**; wrong scene + canonical => **1 incorrect**. This is an observed source-level RED, not a claimed GitHub RED workflow verdict.
3. [D04-only helper fix `cc63272`](https://github.com/my-edutu/Ai_games/commit/cc63272e51988c0e174ee0052dc6872ca02393ea) counts **all** records sharing the cue ID before checking the sole record's canonical recipe and clock. Same exact V8 source-level cases returned expected GREEN: 1, 0, 0, 0; two identical starts => 0. The 64 receipt, 32 source-start inspection and 400ms upper bounds remain unchanged.

A [test-only workflow run](https://github.com/my-edutu/Ai_games/actions/runs/43935433155) was queued at inspection; complete corrected-head GitHub native/build and browser playback had **not** yet been verified. Do not transplant historical green tests to this head.

## Specification review

- Still consumes only bounded post-WebGL and original source-start diagnostics.
- A real HP loss is victim-only and never assigns an attacker, and a mere sword swing is never impact.
- The correlation cannot emit, cancel or alter real voices, damage, VFX, WebGL frames or authority.
- One drawable frame receipt can remain true while its sound provenance becomes unverified.
- Never compare AudioContext scheduling time directly with video PTS or treat waveform energy as synchronized physical contact.

## Quality review / resource and safety

No added GPU pool, instance, draw, buffer, WebAudio node, voice, timer, background job or asset. Consent/mute and the maximum 8 voices, <=19,200 generated noise samples, 32 pending visuals/audio, <=64 receipts, 102 reserved visual instances, <=7 draws, reduced motion/flash, disposal, epoch deduplication, restart and frame deadline remain unchanged. No borrowed sound. No new in-game visual improvement is claimed.

**Unaccepted:** corrected-head six moving viewpoints at 1440x900 and 390x844, actual contact pixels and decoded PCM onset, true miss/block/dodge/projectile/spell sequence, complete Warden warning/release/recovery/earned counter, consent/reload/renderer recovery, and 20-minute density/cleanup soak.

**Next dominant weakness:** independent real-game moving-frame and original PCM temporal calibration after timely submitted HP contact, while the integration owner investigates renderer stalls outside D04. Do not extend the 400ms deadline, invent an attacker or mislabel standalone audio auditions as real gameplay.

**Rollback:** revert these D04-only test/forensic commits on the isolated branch after review; never merge/revert through main or PR #49.
