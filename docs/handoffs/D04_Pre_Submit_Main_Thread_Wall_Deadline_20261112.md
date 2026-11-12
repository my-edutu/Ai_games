# D04 — True pre-submission main-thread combat sound deadline (12 November 2026)

**Status: ISOLATED CANDIDATE / NOT AV-ACCEPTED / DO NOT MERGE.**

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.
Prior verified branch head: `55fcb5b587b33309c81035ac2b212eea1c293151`.
Frozen BEFORE comparator: `281735d0910c6b2443648af976003d50412ee324`.
The experimental controller did not exist at the frozen comparator; no source there was modified. Normal `/dungeon` remains legacy; D04 requires `?feedback=d04`.

## Observable problem and bounded scope

In authentic Chrome run [43140193368](https://github.com/my-edutu/Ai_games/actions/runs/43140193368), 41 D04 cues were queued, 33 expired and only six retained visuals/four original audio controller admissions occurred. The HP loss observed at authoritative tick 4 did not earn an impact cue. This observation demonstrates the persistent **renderer-throughput / missed presentation** problem; it does not isolate every expiration's cause.

Source inspection uncovered a separate event-to-sound time-of-check/time-of-use hole: `app.js` advances D04 around line 1173, performs further scene/render preparation, then measures only the WebGL submission starting around line 1393 before acknowledging around line 1431. Previously, the original 400ms gate counted the last `requestAnimationFrame` interval plus the render submission duration. **Work between `advance()` and `renderer.render()` was omitted**. Therefore an old HP effect could be judged timely even when wall time since the actual public HP observation exceeded the deadline. No evidence asserts this timing hole actually caused the tick-4 expiration; this is an independently discovered correctness defect.

## Minimal change

`public/ai-dungeon/physical-combat-feedback.js` now reads the existing, monotonic, injected `performance.now()/1000` clock at a **genuine frame acknowledgement**, not at a timer or synthetic snapshot. For each already-planned cue with a known real observation timestamp it compares:

- existing raw-frame elapsed age **plus** render-submission seconds, and
- monotonic real observation-to-acknowledgement wall age.

The larger is the effective age. The wall measurement **already contains** the render submission, so the algorithm subtracts that submission interval before passing elapsed age into the existing pure gate (which adds submission duration once). This prevents both a gap and double counting. Missing, invalid or nonmonotonic wall data retains the pre-existing raw-frame gate; no A/V alignment is inferred. An expired cue receives no sound and its stale non-warning retained visual is retired before later frames.

No new audio source, clock, browser listener, timer, GPU material, draw call, state mutation or capture fake is added. Existing 400ms deadline, 32 pending effects, 32 awaiting audio, 64 receipts, seven pools/104 instances, eight voices, mono generated noise buffer, opt-in/mute, scene flush, reduced motion/flash and duplicate-frame rejection are unchanged. Actor identity remains the actual HP-loss victim; attacks still do not authorize damage.

## Test-first contracts and CI

`tests/foundation/dungeon-d04-pre-submit-wall-deadline.test.cjs` supplies five checks:
1. a 700ms observation-to-submit main-thread delay MUST suppress stale impact audio and retire its visual;
2. a timely 200ms verified HP event remains permitted after a real frame;
3. wall age must not double-charge the included 180ms WebGL submission;
4. an untrusted clock cannot bypass raw-frame plus submission deadline;
5. explicit mute remains silent.

The isolated workflow includes this file. The test-only candidate `9e51a8ed5d4d04ec51b9b18005a10dac6cfee91d` launched [43146508503](https://github.com/my-edutu/Ai_games/actions/runs/43146508503) but was **cancelled by the workflow's existing cancel-in-progress policy** when the correcting commit was pushed; consequently a completed red CI job is **not** claimed. On inspection the first assertion would have failed against the earlier calculation. The implementation candidate `442e1ee97c5a118148e0bb2d55e2f004bf107344` launched [43146669934](https://github.com/my-edutu/Ai_games/actions/runs/43146669934), **queued at handoff**. Do not describe native, build or new Chrome tests as passed until this run completes.

## Separate review passes

**Specification:** no older combat event is revived; this change can only suppress late original foley that the old gate might incorrectly admit. Retired visuals remain subject to their own live/current authority and warning exclusions. It makes no contact or attacker inference. Real renderer acknowledgement is still mandatory, and no audio is generated before an authorized click.

**Quality:** one monotonic clock read per submitted frame plus one bounded lookup and arithmetic check per pending audio item (max 32). No per-frame heap of history, media decoding or GPU work. The narrower sound deadline could reduce audible density under software-WebGL stalls; that is an intentional truthful failure, **not** a realism or FPS performance win. Observe controller drops, original source starts, decoded PCM and real video before further tuning.

**Rollback:** revert this controller change plus its focused native test and workflow registration on the D04 branch only; do not cherry-pick it to `main`, Draft PR #49 or other branches.

## Still unaccepted

Run the new code in genuine Chrome/Three.js with model provenance. Collect matched 1440×900 desktop and 390×844 mobile videos from three camera viewpoints, including an authentic warning→release→recovery→counter Warden sequence, missed swing, guard/block, dodge, projectile, spell and an authority-confirmed impact. Confirm real audio sample onset against changing decoded video frames, not merely source-start events, then run the 20-minute cleanup/voice/instance soak. The previous Chrome run's three VP8 packets and three injury source-start correlations do not meet these requirements.

**Next dominant weakness:** 33/41 missed admission cues and sparse encoded frames. Address measured rendering throughput and source-to-visual spatial alignment without extending the 400ms sound deadline or faking late contact.
