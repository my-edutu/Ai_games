# D04 — Genuine HP cue emission phase attribution (14 November 2026)

**Status:** D04-only code and contracts committed. [GREEN native workflow](https://github.com/my-edutu/Ai_games/actions/runs/43641302874): 351/351 native tests and the production build passed. Genuine Chrome WebGL playback was in progress at handoff; no new browser acceptance verdict, three-viewpoint motion comparison, sample-aligned PCM or production-readiness claim.

## Authority and ownership

Repository: `my-edutu/Ai_games`. Branch: `feat/dungeon-d04-combat-feedback-realism-20261108`, starting head `1d82f7f0e65f72e3c8d1ec19c7b53ac1f8888f27`. Frozen comparison BEFORE: `281735d0910c6b2443648af976003d50412ee324` (read-only). Inspected `AGENTS.md`, D04 acceptance handoff, applicable game-audio/VFX/performance/simulation-QA skills, latest source, existing real Chrome logs and prior authentic WebM+Opus evidence.

**Observable blocker:** In the preceding [real Chrome run](https://github.com/my-edutu/Ai_games/actions/runs/43635813604), continuous-playback slow-phase evidence included a 3,359ms desktop and 3,400ms mobile **renderer call** in isolated frames. The D04 visual-advance phase was rounded to 0ms in those samples. Both legacy and D04 modes have intermittent severe stalls; causation remains unproven. The strict authentic-impact trial still failed `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`.

**Newly isolated receipt defect:** For a real observed HP-loss cue, `physical-combat-feedback.js` already sampled a clock **after** D04's retained GPU-cue emissions, but the **per-injury receipt** still subtracted the earlier visual-advance-only sample. Consequently expensive original VFX emission was incorrectly counted as time outside the D04 visual stage. This could misdirect the very rendering-stall attribution required before touching any timing or rendering ownership.

## Test-first record

- [First diagnostic probe](https://github.com/my-edutu/Ai_games/commit/a1371846aa8822ac2aa0e23c32fc04729a7d7d8e) verified the **already-existing** next-frame clock reset. It passed; no code change was justified for that hypothesis.
- [Failing contract](https://github.com/my-edutu/Ai_games/commit/1e5f26e839233fb1c946a397bc809ff574b49ed9) models 25ms before visual, 20ms D04 visual advance, **120ms D04 retained emission**, then 90ms pre-submission+renderer. RED [Actions 43641134420](https://github.com/my-edutu/Ai_games/actions/runs/43641134420): 350 passed / 1 failed because the production receipt had no 120ms emission witness.
- [Source fix](https://github.com/my-edutu/Ai_games/commit/a459c7ae0480a0e232213d13f1c9fc3bf9fe0d8b) reuses the already-captured post-emission clock, adds `visualEmissionMs`, excludes its elapsed cost from `afterVisualAdvanceToSubmissionMs`, and refuses invalid/nonmonotonic phase attribution. Existing simultaneous HP regression was updated to separate its 10ms emission from 10ms post-visual work.
- GREEN [Actions 43641302874](https://github.com/my-edutu/Ai_games/actions/runs/43641302874): **351 passed / 0 failed**, production build passed.

This is **forensic attribution only**. No new frame timestamps, audio sources, audio buffers, VFX instances, GPU draws, timer loops or authority changes. One bounded scalar is added to at most 64 existing cue receipts. Neither audio admission nor D04's 400ms expiry changes. Damage remains victim-only and requires genuine consecutive HP loss; sound is still opt-in, mute persistent, reduced-motion/flash safe, deduplicated and cleaned on scene transitions.

## Evidence boundary

The inspected prior Chrome evidence archive contains real canvas/Opus WebMs (desktop and 390px mobile) but sparse decoded VP8 delivery, unaligned Opus and no physical frame-to-audible-sample proof. That prior media predates the new fix. Standalone procedural sound auditions and synthetic adapter timing tests do not constitute a real in-game A/V pass.

**Remaining:** matched three-camera authentic motion clips at 1440x900 and 390x844; missed swing versus confirmed HP impact; block/dodge/ranger/spell; Warden warning, release, recovery, earned counter and defeat; simultaneous threats/anonymous harm; decoded original PCM sample onset; 20-minute cleanup/memory/audio voice soak; final blind visual/audio critique.

**Next dominant weakness:** real WebGL renderer-submission stalls and delayed HP-frame delivery. Use the corrected cue phase split plus existing bounded paired legacy/D04 genuine-frame diagnostics to attribute expensive visual emission vs renderer work; do not relax the 400ms deadline, claim Diablo-IV parity, change the legacy default or touch another session's camera/rig/lighting/authoritative files.

**Rollout / rollback:** only `/dungeon?feedback=d04` uses this opt-in feedback. Revert `a459c7ae` (and its optional receipt-field test) on the D04 branch if a verified measured regression appears. Main, Draft PR #49, `games/ai-dungeon/src` and other branches are untouched.
