# D04 — Isolating genuine browser A/V capture from competing encoders (12 November 2026)

**IN PROGRESS — DIAGNOSTIC INTERVENTION ONLY; NO A/V REALISM ACCEPTANCE.**

## Scope, source, and immutable boundaries

Isolated branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.
Start from reviewed branch head `18089e0bf07d25e87c848eb45f86be3792086dd8`; frozen historical BEFORE remains `281735d0910c6b2443648af976003d50412ee324`.

This increment changes only `tests/browser/dungeon-d04-capture-profile.cjs`, `tests/browser/dungeon-physical-feedback-preview.spec.cjs`, `tests/browser/dungeon-d04-av-evidence.cjs`, `tests/foundation/dungeon-d04-single-primary-encoder.test.cjs`, the D04-only GitHub Actions workflow, and this handoff. It does **not** edit `games/ai-dungeon/src`, `public/ai-dungeon` production runtime, rigs, camera, lighting, default spectator, or other branches. D04 remains **opt-in `?feedback=d04`**, no merge.

## Dominant observable problem and evidence

In genuine [previous Chrome run 43176435574](https://github.com/my-edutu/Ai_games/actions/runs/43176435574), the combined real-canvas+original-opted-in-soundstage recording contained just three decoded VP8 frames. In the same active capture test, 27 of 36 combat cues expired; one confirmed HP loss reached submission after 2751ms, including 2661ms in the renderer. The earlier controlled dynamic transition comparison, **without audio or a live encoder**, rendered ten matched stages without a multi-second direct renderer call. The former full capture test ran **five concurrent MediaRecorders** (combined A/V, video-only, audio-only, second native canvas video, and synthetic 2D positive control), plus the real original-PCM tap. This concurrency is a credible **measurement confound**, not proof of cause.

## Test-first contract and implemented intervention

1. `dungeon-d04-single-primary-encoder.test.cjs` requires the authentic session to start exactly one original video+soundstage MediaRecorder, reject fake alternatives, and label all four omitted concurrent probes `SKIPPED` rather than `UNAVAILABLE` or `RECORDED`.
2. New immutable `dungeon-d04-capture-profile.cjs` selects the single combined original source. The browser harness checks the profile before starting capture, preserves the actual consented original audio, live PCM, original WebGL submission-receipt pump, real-frame consumer monitor and safety timers.
3. The four former **concurrent** auxiliary encoders no longer start during primary capture. The existing **serial** diagnostic probes execute only after that MediaRecorder has stopped. Their video and/or audio sources retain strict separate provenance; synthetic controls never become gameplay footage.
4. The pure capture assessment no longer calls an intentionally skipped auxiliary video encoder an **empty** video when the original combined WebM is genuinely recorded. Its track-delivery diagnosis takes strictly authenticated combined bytes for a skipped auxiliary source; if primary original capture fails, it admits zero encoded bytes. This never upgrades a missing PCM stream, missing real submitted frames, a static/undecoded recording or uncalibrated Opus into synchronized contact evidence.
5. D04 workflow now includes the new native contracts and source parser, and watches the new evidence-policy file.

**Red/green honesty:** test contracts were committed before implementation. GitHub Actions may cancel earlier runs because the workflow intentionally cancels outdated commits; no verified red CI outcome is claimed. Exact current-source V8 syntax parsing and the pure capture-policy/classifier fixture were evaluated successfully; this is **not** a native Node integration pass or a genuine Chrome run. Obtain a completed Actions run for the final candidate before upgrading any test status.

## Reproduction and evidence gates

```sh
npm ci
node --test tests/foundation/dungeon-d04-single-primary-encoder.test.cjs tests/foundation/dungeon-d04-av-capture-evidence.test.cjs
node --test tests/foundation/dungeon-d04-browser-source-parse.test.cjs
npm run build
npm run dungeon:assets:strict
D04_BROWSER_CHANNEL=chrome npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```

The real-browser artifact is authoritative for any claimed impact improvement. Compare per-run `dungeon-d04-real-cue-frame-foley-timeline.json`, `dungeon-d04-live-av-evidence.json`, the original WebM, and decoded actual frames. Record queued / expired / audio and visual admissions; per-HP-loss observation-to-submission vs direct render delay; combined encoder frame yield and exact track provenance. Prior and new runs differ in encoder load, so differences are hypothesis-generating, **not a controlled renderer causal conclusion**.

The reduced encoder profile is deliberately evidence-only; it does **not** relax the 400ms combat-audio deadline, synthesize an impact, change any authority, or alter the 7-pool/104-instance, 8-voice, mute/opt-in and reduced-flash/motion contracts. The same strict forensic classifications remain `UNVERIFIED` when real moving video or audible sample-onset alignment is unavailable.

## Reviews, rollback and next weakness

**Specification review:** no game presentation source edited, no actor/attacker inference, no default route change, no borrowed audio, no change to gameplay/replay/determinism or combat resource limits.

**Quality review:** fewer concurrent browser encoders should reduce evidence-observation intrusion, but it also removes overlapping independent video/audio-only diagnostics. These are explicitly marked skipped, with serial fallbacks retained. This is a capture experiment, **not proof** that multi-second stalls or encoded video starvation have been solved. Any successful CI browser smoke alone is not physical realism or decoded A/V contact acceptance.

Rollback only the new capture-profile file, its focused contracts, the browser harness single-encoder wiring, skipped-probe classification and isolated workflow paths on this branch. No production rollback is required.

The next dominant investigation is **whether authentic single-primary capture produces more timely confirmed HP-loss presentation and more genuine moving VP8 frames**, including separate submitted-frame and PCM sample timing. Then collect three-viewpoint matched desktop/390px active combat, misses, blocks, dodges, projectiles, spells, full Warden warning/release/recovery/counter and the 20-minute soak. No Diablo-IV parity, production status or sample-synchronized foley claim.

## Measured browser encoder-concurrency evidence (follow-up contract)

The browser harness now records `captureStarted.primaryMediaRecordersAtStart` from the actual active `MediaRecorder` Set, and `frames.peakPrimaryConcurrentMediaRecorders` from all real recorder registrations up to the end of the primary original audio+video window. The set covers both the combined original recorder and every optional auxiliary recorder, not just a planned count. These fields are factual only **after** fresh Chrome execution; current values are **not yet verified**. Test-first source contracts prohibit silently replacing observed counts with a policy constant. The primary maximum must be checked in the next genuine CI artifact before claiming the experiment actually isolated encoder contention.
