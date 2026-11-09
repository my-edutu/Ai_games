# D04 — Reject stale render-submission receipts before releasing original combat audio

**Status:** isolated opt-in source-level synchronization hardening. **Genuine Dungeon browser audiovisual realism: UNVERIFIED.**

- Repository: `my-edutu/Ai_games`
- Branch: `feat/dungeon-d04-combat-feedback-realism-20261108` (only write target)
- Verified start: `7e294d5719f7b37ec14c8ce2e1f50f6d9919d01c`
- Frozen BEFORE reference (inspected, never edited): `281735d0910c6b2443648af976003d50412ee324`
- Test-first commit: `89ace1b6412b65230876b9302ea504d1e99a469d`
- Production correction: `45e22ef0aa18f160b630558b91092605ce34a8be`

## Defect and evidence level

The D04 controller remembered only `lastPresentedFrame`. Thus non-adjacent duplicate receipt IDs were accepted as fresh render submissions: receipt 41, receipt 42, then a recycled receipt 41 could drain an entirely new, queued original combat sound. This violates the fundamental promise that foley follows a **new** actual render submission.

**Observed:** the unchanged controller executed from GitHub production source in a detached V8 adapter reproduced the numeric defect: first valid receipt emitted one sound; the older numeric receipt incorrectly emitted another sound for the next observed authority cue. This is **source-backed simulated receipt evidence, not filmed live-game defect evidence**. The actual `public/ai-dungeon/app.js` currently increments `++d04PresentedFrameSerial` monotonically; therefore we do not claim this replay has occurred in normal live gameplay. It is a correctness guard against stale/duplicated capture or integration callbacks.

## Focused change

1. Added five independent regression contracts in `tests/foundation/dungeon-d04-submitted-frame-replay-guard.test.cjs`: numeric rollback, non-adjacent string replay, mixed numeric/string history, explicit scene-reset reuse, and bounded memory.
2. In `public/ai-dungeon/physical-combat-feedback.js`, keep the latest accepted numeric serial and reject any numeric value that is not strictly increasing. Opaque string receipt IDs use an insertion-ordered `Set` capped at **64** entries; repeated in-window strings are ignored. The previous last-frame duplicate guard remains. Neither an old numeric nor in-window recycled string receipt increments the frame count, releases audio, or drains the next cue.
3. `flush()` resets both histories, so an explicit controller reset/scene change permits a fresh render stream. `stats()` exposes `replayedFrameAcks` and `recentStringFrameIds` for finite budget monitoring.
4. No frame ID is manufactured. This gate is **in addition** to the actual WebGL submission integration contract. It cannot verify that a unique ID describes a true WebGL frame, encoded pixel or audible sample.

## Executed validation

- **Red reproduction:** one production-source-backed V8 receipt scenario showed an older numeric frame delivering the wrong new sound (**1 unexpected sound**).
- **Green:** the five new authored test callbacks passed **5/5** against fetched current production controller, real public planner and frame-gate logic, with deterministic fake visual/audio adapters and a tiny assert/test shim.
- **Compatibility:** five existing Warden release/recovery submission-order tests passed **5/5** under the same adapted V8 harness. Both release and recovery preserve priority order; mute, stale-frame and scene-change cases remain valid.
- **Native tests, build, CI, WebGL and WebAudio:** **UNVERIFIED**. The coding tunnel returned `Tunnel-client has not been seen for 300 seconds`; the separate container failed DNS lookup of github.com. These adapted checks are **not** Node, Playwright or real Dungeon audiovisual trials.

### Native commands pending in a connected worktree

```sh
node --test tests/foundation/dungeon-d04-submitted-frame-replay-guard.test.cjs tests/foundation/dungeon-d04-warden-release-recovery-submission-order.test.cjs
node --test tests/foundation/dungeon-physical-feedback-d04.test.cjs tests/foundation/dungeon-physical-feedback-realism-d04.test.cjs tests/foundation/dungeon-physical-feedback-preview-integration.test.cjs
npm run build
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

## Review and boundaries

- **Specification review:** original combat audio cannot use a previously acknowledged numeric serial or recently seen opaque string ID as evidence of a new submitted frame; already queued sounds stay pending until an eligible fresh submitted frame or expire within the existing 400ms deadline.
- **Quality review:** numeric path adds constant-time O(1) checking and no heap history; opaque string path retains at most 64 IDs, plus a single counter. No new geometries, GPU draw calls, generated buffers, voices, timers or effect queues. This does not change authority ticks, damage, hit provenance, noise synthesis, combat physics, actor rigs or default spectator behavior.
- No unlicensed audio; existing single generated noise buffer, eight-voice ceiling, seven VFX pools, 32 queued effects, 32 waiting-for-frame sounds, 64 receipts, original mute/gesture preference, reduced-motion/flash and lifecycle cleanup remain as before. Native budget checks remain outstanding.
- Legacy `/dungeon` remains default; this code is only reached in the experiment `?feedback=d04`. D10 must review before enabling by default. Main, Draft PR #49 and other branches were not touched.
- **Rollback:** revert production fix `45e22ef` on this branch; preserve the regression contract for review.

## Required authentic acceptance, still outstanding

The attached GLB-backed game and real clips were not available through the disconnected coding tunnel. A true pass still needs matched authoritative checksum/seed/tick before-vs-after captured from three actual cameras, 1440x900 desktop and 390x844 mobile, both canvas WebM and original opt-in sound-bus PCM/WAV. Capture missed sword motion, actual HP-contact, block/dodge, projectile/spell, interrupt, Warden warning/release/recovery/earned counter and death/restart, simultaneous ambiguous threats, background stalls, mute/reload, reduced effects and 20-minute resource/voice soak. Record event tick → observed animated pose → real render submit → audible PCM onset; mere sound energy or procedural auditions are insufficient.

**Next dominant realism weakness:** neither a fresh frame receipt nor an authentic Warden cast tick proves animated weapon-contact timing. Current sword traces also measure an authenticated wrist rather than the GLB blade tip. These require actual rig/GLB access and genuine moving-game capture before physical-realism synchronization can be accepted.
