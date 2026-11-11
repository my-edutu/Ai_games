# D04 — Real Dungeon frames with no admissible combat feedback (11 November 2026)

**Status:** Authentic Chrome gameplay was observed, but D04 visual/audio realism **FAILED** in the latest completed browser run. The current D04 forensic improvement is committed but its new CI run has **not yet been verified**. The branch remains isolated and unmerged; default spectator remains legacy and experiment requires `?feedback=d04`.

## First-order evidence, not an encoder guess

Read `AGENTS.md`, `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`, frozen BEFORE `281735d0910c6b2443648af976003d50412ee324`, current `physical-combat-feedback.js`, `physical-feedback-visuals.js`, measured-wrist trail and genuine Chrome artifact.

Completed CI [43055430802](https://github.com/my-edutu/Ai_games/actions/runs/43055430802) at prior code head `189f157`:
- Native contracts **82/82** and production TypeScript build passed.
- SHA-verified CC0 Dungeon models **20/20**; system Chrome v156 and Playwright-owned ffmpeg installed successfully.
- Genuine Chromium + Three.js ran, actual authentic `DungeonRuntime.step()` HP loss reached its known checksum, and independent Playwright viewport video is **91.76 seconds, 800×500, VP8**.
- The **real** browser job failed: `physicalFeedback.visualAccepted` stayed **0** for a 70-second wait. It did not crash before the page. The failure is the absence of D04 presentation, not evidence of audio/video alignment.
- Inside the attached real-browser debug snapshot: **59 actual acknowledged renderer frames**, **129 queued feedback cues**, **129 expired before visual admission**, **0 visual accepted**, **0 foley played**, **0 active voices**, **0 adapter failures**, and original seeded HP loss from tick **3 → 4**.
- The rendering path is unusually slow. The diagnostic reported `observedFrameMs` of **19,074** at the damage witness and **88,155** at later inspection. This counter needs its own semantics reviewed before claiming per-frame latency. Sparse frame submission and cue expiry are directly witnessed; do not describe `observedFrameMs` as measured GPU frame time.
- Genuine screenshot/video still looks stylized and clustered in the Warden fight; it does not establish blade-tip contact. The original soundstage PCM and gameplay video have not been correlated against the same event sample clock.

The 70-second positive-visual assertion **short-circuited the test before saving the new original A/V experiments and 390px compositor evidence**. That forensic loss is the targeted defect this increment fixes. Do NOT lengthen the 400ms safety deadline or fabricate delayed hit sounds to make the test green. The actual slow-frame pathology must remain an acceptance failure.

## Implemented only in D04 test/evidence scope

1. `tests/browser/dungeon-d04-real-feedback-observation.cjs`: strict read-only classifier. Requires consecutive same-run/floor snapshots, actual HP loss, exact rendered checksum, valid bounded real-browser counters. Distinguishes **ALL_CUES_EXPIRED_WITH_REAL_FRAMES** from no WebGL frame, missing HP proof, damaged browser adapter, and **VISUAL_ADMITTED_NOT_AV_VERIFIED**. No classification claims measured contact or sample-synchronized sound.
2. `tests/foundation/dungeon-d04-real-feedback-observation.test.cjs`: five contract cases covering real-HP-fixture / all-expired failure, cross-scene/unchanged HP and checksum rejection, non-overclaiming successful visual admission, invalid counters, and artifact-before-final-assertion ordering. These are **unit fixtures**, not genuine runtime audiovisual proof.
3. `tests/browser/dungeon-physical-feedback-preview.spec.cjs`: after the genuine HP-loss pair, wait at most 45 seconds for additional actual renderer receipts instead of 70 seconds for a visual accepted counter that may never increment. Preserve the actual audio, video, PCM and desktop/mobile evidence work before the final fail-closed verdict. Save an independent `artifacts/dungeon-d04-real-render-feedback-verdict.json` even when physical feedback fails its acceptance assertion. The asserted status remains `VISUAL_ADMITTED_NOT_AV_VERIFIED`, so all-expired feedback **must fail**.
4. `.github/workflows/dungeon-d04-foley-identity.yml`: execute the new native regression contract only on this branch. The new test was authored **before** the classifier implementation; a red CI run is **not confirmed** because push runs can be canceled by concurrency.
5. Corrected the verdict file's line ending to a valid JSON newline (not the literal characters backslash + n).

Latest source-code commit prior to this handoff: `4d09ba9af9e388e1bac9baf3f8e12208c69967c8`.
**No verified new green test count or new moving A/V witness yet.** The prior 82 passing tests belong to `189f157`, not this code. The connector coding tunnel remains offline; GitHub connector writes were used safely.

## Engineering quality and limits

- Gameplay authority, damage/dodge/block results, rig data, camera, lighting, rendering engine, soundstage code, visual pools, mute/opt-in preferences and frame receipt deadlines are **unchanged**.
- Scope files are all `tests/browser/dungeon-d04-*`, `tests/browser/dungeon-physical-feedback-preview.spec.cjs`, `tests/foundation/dungeon-d04-*`, isolated D04 workflow and this handoff.
- Scene effects still reserve **102** instances across seven pools, maximum seven VFX draw calls, voices cap eight, bounded queues and receipt history. Prior debug shows no pool leak; a real 20-minute soak is **not** proven.
- The new classifier reads a bounded set of snapshot units and numeric counters, performs no edits or audio output, and cannot alter deterministic gameplay/replay.
- Security/privacy: debug stores seed, checksum, tick, aggregate counts and existing real-media evidence, not external secrets.
- Deployment/rollback: these commits are review-only on the D04 branch; revert their isolated test/evidence files to restore earlier CI behavior. Legacy and `main` unchanged.

## What must happen next

1. Inspect CI on the new branch head; run the native five new tests + production build, and the genuine Chrome test. If real browser remains red, retrieve **new** artifact and confirm the verdict JSON plus the opted-in original soundstage record survived even though acceptance failed.
2. Compare a GPU-capable headed browser with software WebGL for actual renderer-to-cue latency; do not loosen the safe cue deadline merely to make a slow environment produce fake late impacts. If authentic visuals cannot be admitted in time, the performance/rendering owner needs the measured submission traces.
3. Only after credible true frames/foley are present: sample original audio onset against known HP loss and render receipts; verify wrist/blade geometry before upgrading its visual identity. No invented sword tip or attacker.
4. Collect matched three-viewpoint desktop (1440×900) and 390×844 mobile moving footage, actual miss/block/dodge/projectile/spell, Warden warning/release/recovery/earned counter and defeat/restart, audio mute/reload, reduced motion/flash, multiple simultaneous threats and a 20-minute lifecycle soak. All are **UNVERIFIED** in this increment.

**Acceptance verdict: NOT TRANSFORMED / NO VERIFIED PHYSICAL-COMBAT A/V SYNCHRONIZATION.**

## Follow-on credibility hardening, same isolated session

The first classifier version was found to allow cumulative `visualAccepted` counts from another run/floor to describe the authenticated HP-loss pair. This is now fixed **fail closed**: both the tick-4 presented state and the latest rendered state must carry the same run/floor and the controller's exact `scene` key, with a non-regressing tick. Added a dedicated regression for cross-run, cross-floor, stale tick and absent D04 scene proof. The new classifier source is now an explicit isolated workflow push trigger; the contract enforces that path. These protections do not claim that an admitted effect corresponds to the identified damage event: the generic admitted-visual status stays `VISUAL_ADMITTED_NOT_AV_VERIFIED`.

Additional commits: `49c033e` test-first cross-scene requirement; `e6ca507` classifier fix; `9c9f890` workflow-trigger contract; `6c6047e` workflow trigger change. All are still **pending new real-browser/CI verification**. No source or authoritative gameplay files changed.

Reassess one unavoidable browser timing distinction: historical `observedFrameMs` was extremely large, but no individual GPU frame-time conclusion follows from that aggregate diagnostic. Measured cue expirations, actual renderer receipts and D04 visual/foley silence are the defensible findings.
