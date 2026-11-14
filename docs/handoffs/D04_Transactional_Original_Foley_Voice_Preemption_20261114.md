# D04 — Transactional original-foley voice priority replacement (14 November 2026)

**Status: source defect reproduced, isolated correction committed, 319/319 native contracts and production build verified. Genuine Chrome A/V synchronization and total D04 realism acceptance remain unverified.**

- Repository / **only writable branch**: `my-edutu/Ai_games` / `feat/dungeon-d04-combat-feedback-realism-20261108`.
- Latest starting head: `2f599ce786c9f0e368613fe55b83141ef6ac6939`. Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`.
- Test-first commit: [`1be15cd`](https://github.com/my-edutu/Ai_games/commit/1be15cd4486b4f2503b3143735537decb5f5a660); correction: [`ab20e4c`](https://github.com/my-edutu/Ai_games/commit/ab20e4c6fcbc718fb718008dff9046e0f799da25).
- Allowed file changes: `public/ai-dungeon/original-combat-foley.js` and `tests/foundation/dungeon-d04-foley-cue-idempotency.test.cjs`. This handoff is documentation only. No changes to gameplay authority, rigs, camera, global lighting, shared soundstage, main, or Draft PR #49.

## Dominant correctable defect within D04's original sound owner boundary

Before this increment, `createOriginalCombatFoley.emit()` **stopped and removed the lowest-priority already-audible voice before it created or scheduled the replacement WebAudio sources**. Under a genuine audio-device allocation or `source.start()` failure, the new cue returned `false` yet the original audible voice was lost. That is inconsistent sensory feedback: a high-priority Warden release could silence an existing legitimate material cue without producing its own sound. It does not imply that the attack hit or that any target was damaged.

Test-first contracts saturate the existing **eight-voice budget** with eight distinct permitted low-priority recipes and inject either a new buffer-source allocation failure or a new noise-source start failure. Both must leave all eight old voices intact, without a reported new delivery or new original source onset. A later successful retry may replace exactly one lower-priority voice, while still reporting no more than eight active/peak voices.

### Test-first evidence

1. The two new regression tests were committed **before** the source patch. Their separate native RED workflow [run 43555077626](https://github.com/my-edutu/Ai_games/actions/runs/43555077626) was cancelled by push concurrency before execution: **do not call that a native RED result**.
2. A direct **executed V8 probe of the exact old GitHub source** reproduced both failures: the old source reduced eight active voices to seven and incremented the stopped counter from zero to one even though the new candidate returned false. This establishes a source-level RED reproduction, **not** genuine Chrome audio.
3. The D04-only correction calculates the intended replacement index but defers stopping that old voice until **all** the candidate's original WebAudio nodes have been successfully wired, started and given their stop times. Candidate failures clean up only candidate nodes. Priority ordering, canonical strict HP/swing validation, one-shot IDs, mute and opt-in semantics are unchanged.
4. Independent direct V8 source-level GREEN probes of the corrected blob `467241b070af1b65b9643bac587eee750ffdfcf0` passed both allocation and start injection, preserved eight ongoing voices on failure, and confirmed one successful priority replacement on retry. These probes do not measure decoded PCM or the actual WebAudio engine.
5. [GitHub Actions 43555218755](https://github.com/my-edutu/Ai_games/actions/runs/43555218755) verified **319 native contracts passed, zero failed**, followed by a successful `npm run build`. The job's actual Chrome `real-preview` result was queued at this handoff's preparation; there is no new verified moving sound/contact result yet.

### Resource, fidelity and safety review

The live voice registry still has an **eight-voice hard cap**; the new test also checks `peakVoices<=8`. The single 13,440-sample original noise texture, the existing generated oscillator partials, per-actor and per-victim cooldowns, recorded starts, priority limits, dedupe, mute persistence and explicit click-to-enable remain intact. No borrowed sample or unlicensed asset was introduced. This change does **not** claim a lower audio latency or higher rendered frame rate.

**Real-audio caveat:** in a saturated successful replacement, a new source start is scheduled immediately before the old voice is synchronously stopped within the same JavaScript turn. Registry accounting stays within eight, but a separate actual AudioContext/output-capture test is still required to prove there is no short mixed overlap at the audio-render quantum; the native fake nodes cannot provide that proof. If measured peak overlap exceeds the resource contract, use a bounded sample-aligned handoff rather than relaxing the voice cap.

### Authentic gameplay evidence boundary and next work

Previous genuine Dungeon desktop/390px browser recordings show sparse WebGL video frames and original Opus recording, but **not** a verified sample-accurate impact onset. The preceding completed browser job [43550105604](https://github.com/my-edutu/Ai_games/actions/runs/43550105604) passed its first five browser diagnostics, failed strict `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`, and observed multi-second renderer-call stalls. It did not demonstrate a D04-specific stall cause.

Still required: three matched moving camera viewpoints in real Dungeon play, both 1440x900 and 390x844, miss/contact/block/dodge/arrow/spell and Warden warning-release-recovery-earned-counter, real decoded onset-to-contact synchronization, WebGL loss/recovery, opt-in/mute/reload, reduced motion/flash, and the 20-minute cleanup/voice-and-effect soak.

**Next dominant observable weakness:** missed genuine HP visual admission during multi-second real WebGL submissions. Profile actual renderer phase and compare legacy and D04 without changing other-session-owned files; avoid using generated foley auditions or static source tests as audiovisual acceptance.

**Rollback:** revert `ab20e4c` only on the isolated branch while retaining the two new failure-isolation contracts. Legacy `/dungeon` remains default; the correction is D04-only and opt-in under `?feedback=d04` pending final integration review.
