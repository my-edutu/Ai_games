# D04 — Stop charging freshly observed HP cues for the *previous* GPU frame

Date: 11 November 2026. Status: **IMPLEMENTED ON ISOLATED D04 BRANCH; AUTHENTIC A/V ACCEPTANCE NOT ESTABLISHED.**

Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`; latest tested source candidate: `b222c60637433d4d754b6cc648476525952b9cc4`. Baseline comparison remains `281735d0910c6b2443648af976003d50412ee324`. The frozen baseline has the legacy spectator app and no `physical-combat-feedback.js`; the present code is D04-only and opt-in with `?feedback=d04`.

## Actual failure and why this is a causal fix

A completed authentic Chrome + Three.js witness from CI 43055430802 showed 59 true renderer acknowledgements, 129 queued physical cues, 129 expired **before visual admission**, zero VFX accepted and zero original foley played. Its `observedFrameMs` was cumulative and cannot be called the latency of one GPU frame. An independently recorded 91.76-second VP8 gameplay clip exists, but no original, verified sample-synchronized combat A/V.

In the existing opt-in runtime, public `acceptSnapshot()` queues newly observed authoritative HP injury before `advance(frameSeconds, actualFrameSeconds)`. The latter adds the entire raw interval since the **previous** requestAnimationFrame and then expires pending cues. If the preceding WebGL frame was costly, a damage transition genuinely first observed *after* that frame inherited an older interval it could not have lived through. Thus the current-frame damage was dropped before its first possible visual draw even when the source was fresh.

The new narrowly scoped correction records a monotonic **observation timestamp** when each D04 cue enters the bounded queue. At the next `advance()`, only cues that were genuinely newly observed since the last advance have their queued age corrected to the actual elapsed observation-to-advance interval. Older pending cues continue to accumulate real raw frame time and expire normally. Invalid, missing or backwards clocks retain the existing fail-closed raw-interval behavior.

The real D04 `app.js` path explicitly injects `()=>performance.now()/1000`. The controller's default clock is null, so non-opt-in and deterministic legacy test callers are untouched. This does not shorten or lengthen the **400ms** audio/visual deadline; `acknowledgePresentedFrame(frameId, renderSubmissionSeconds)` independently suppresses sounds if the new genuine WebGL submission itself takes too long. No timestamp can substitute for a renderer receipt, measurable blade passage or actual HP loss.

## Implementation and test-first scope

- `tests/foundation/dungeon-d04-snapshot-arrival-clock.test.cjs`: five new contracts for a fresh injury *after* a 1.2s prior interval; genuinely stale injury; a fresh visual whose *current* render stalls; absent/nonmonotonic clocks; and legacy non-submission behavior.
- `public/ai-dungeon/physical-combat-feedback.js`: optional monotonic clock, bounded queue-entry timestamps and one-time first-advance correction. Queue cap 32, receipt cap 64 and stale 400ms gate unchanged.
- `tests/foundation/dungeon-d04-audio-frame-deadline.test.cjs`: explicitly advance fake observation clock in two existing post-observation slow-frame tests; do not conflate a genuinely late cue with a cue that arrived after the previous slow frame.
- `public/ai-dungeon/app.js`: add only the `D04_PREVIEW` opt-in clock injection. No gameplay/authority/camera/rig/lighting/legacy spectator modifications.
- `.github/workflows/dungeon-d04-foley-identity.yml`: include the arrival, stalled-frame and drawable-foley contracts in D04-only CI.

Test-first file was committed before production changes. Its red CI run was canceled by branch push concurrency, **so no independently observed red result is claimed**. Code-candidate workflow [43076012964](https://github.com/my-edutu/Ai_games/actions/runs/43076012964) confirmed **102/102 native contracts passed and production build passed**. Authentic browser playback was still running at this handoff's initial writing; consult that workflow for its final verdict.

## Preservation / performance review

The fix is O(P) over at most 32 pending effects once per animation advance, with no new WebGL geometries, materials, sound buffers, live voices or external assets. The additional per-cue monotonic number and fresh flag are reclaimed by the existing queue eviction/flush. No new event identity or attacker attribution is constructed: actual HP change, source action witness, pose proof, original WebAudio consent/mute, reduced motion/flash, receipt deduplication, source retirement and scene/floor cleanup stay in force. A delayed visual is still not equivalent to audible sample-level synchronization. This is a review candidate, not a completed realism transformation.

Security/privacy: monotonic timing and aggregate cues only; no credentials, personal data or arbitrary external audio. Rollback: revert the D04 clock commits on the isolated branch; **never merge** without final integration review.

## Unpassed acceptance and next dominant weakness

The next genuine browser result must show **both** admitted visual effects and original frame-gated foley for real combat events, with timeline readings proving that a cue entered the queue *after* the prior GPU interval. If visual admission improves while audio remains zero, inspect WebGL submission duration and live-pose/visual-liveness gate rather than stretching the deadline. Evaluate at least three viewpoints at 1440×900 and 390×844, verified miss/block/dodge/projectile/spell/impact, complete Warden warning→release→recovery→earned counter/defeat/restart, opt-in/mute/reload, reduced-motion/flash and a 20-minute soak. None is accepted without genuine moving evidence.

**No Diablo IV parity, blade-tip contact, sample-synchronized A/V or complete D04 acceptance is claimed.**
