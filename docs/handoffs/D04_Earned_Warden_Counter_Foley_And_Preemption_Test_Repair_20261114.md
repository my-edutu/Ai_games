# D04 — Earned Warden counter foley and voice-preemption fixture repair (14 November 2026)

**Status: committed on the isolated D04 branch.** Native contracts **336/336 GREEN** and production build passed on [Actions 43597931916](https://github.com/my-edutu/Ai_games/actions/runs/43597931916). Genuine Chrome preview verdict and decoded audiovisual acceptance **not established at handoff**. D04 is not production ready.

## Scope and source of truth

- Repository: `my-edutu/Ai_games`; branch `feat/dungeon-d04-combat-feedback-realism-20261108`.
- Started from exact head `9b57e2a08259d4595de85583cf3fce22d32832fc`; retained frozen BEFORE `281735d0910c6b2443648af976003d50412ee324` as comparison only.
- Read `AGENTS.md`, `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`, `public/ai-dungeon/physical-feedback-plan.js`, `public/ai-dungeon/original-combat-foley.js`, active and previous regression tests and specialist audio/VFX/simulation-QA instructions. Inspected preceding GitHub Actions genuine-browser diagnostics and artifact manifest. The live project coding tunnel was offline; GitHub connector handled only isolated-branch writes.
- No main/PR #49/authoritative `games/ai-dungeon/src`/rig/camera/lighting/other-session branch changes.

## Dominant immediately actionable defect

Previous [CI 43593117525](https://github.com/my-edutu/Ai_games/actions/runs/43593117525) failed native contracts **333/335**. The two failing preemption tests were still filling eight strict-mode audio voices with **unverified fabricated evade and block recipes**, made invalid by the preceding correct strict-verification change. This masked the actual transaction/voice-safety test and skipped real browser CI.

[Commit 7667d2d](https://github.com/my-edutu/Ai_games/commit/7667d2d072a66b9232ccd59159df954728aefe03) repairs only those test fixtures by using eight legitimate independent neutral audition recipes. The test still checks that failed high-priority source allocation/start preserves all eight original voices and that retry is possible. It does **not** weaken genuine block or dodge authorization.

A second sound-causality flaw remained: `counter` was a named, high-priority recipe that strict original foley could admit without verifying an earned Warden HP-loss counter. That could manufacture a decisive success-sounding stinger with no appropriate public evidence. Unlike a swing, a counter should correspond to the planner's actual recovery-window and HP-delta observation.

## Test-first increment and code

- [RED test commit 65436ec](https://github.com/my-edutu/Ai_games/commit/65436ec185162aaae19eb0b70d9cae1f124ac70d): creates a real `planPhysicalFeedback` counter from adjacent Warden recovery/HP-loss snapshots. The positive cue has only a **victim** ID; tests reject forged owners, missing target, invalid/missing target coordinates, wrong proof, forged event ID, missing verification and raw `audio:'counter'` recipes before any WebAudio nodes or confirmed-event memory are allocated.
- Test-first [Actions 43597887732](https://github.com/my-edutu/Ai_games/actions/runs/43597887732) ran **335 passed / 1 failed as expected** at the new earned-counter authorization assertion; the prior bogus-preemption failures no longer occurred.
- [GREEN source commit 9bdfd68](https://github.com/my-edutu/Ai_games/commit/9bdfd68fda4a455995c6161bcb2867f0bb0141b2): introduces a bounded stateless victim-only counter checker, incorporates it into the immutable event tuple, and includes `counter` in the strict sound gate. It doesn't rederive gameplay damage or identify an attacker from event prose.
- [GREEN Actions 43597931916](https://github.com/my-edutu/Ai_games/actions/runs/43597931916): **336 passed / 0 failed**, native TypeScript production build passed. Genuine Chrome real-preview job was still in progress at this inspection; do not equate these tests with decoded audible sample synchronization.

## Resource/review and remaining gaps

No new buffers, voices, render instances, timers, event queues or runtime memory. Existing eight-voice ceiling, one seeded noise texture, 128 confirmed IDs, WebAudio fresh-gesture consent/mute, accessibility settings, seven visual pools, 32/32/64 frame queues, deduplication and 400ms real frame deadline are unchanged.

Specification review: only a unique Warden recovery/counter accompanied by actual public HP loss may earn an original counter stinger; the injured Warden is a victim, **never proof of which actor hit**. Quality review: invalid success-sound admission is removed; this does not establish physical blade contact or fix stalled WebGL submission.

Prior completed [real browser run 43588302506](https://github.com/my-edutu/Ai_games/actions/runs/43588302506) produced an authentic-preview artifact, but strict acceptance failed `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. Multi-second renderer calls also appeared in legacy comparisons; do not attribute them to D04 without a controlled diagnosis. No new matched three-camera desktop/390px mobile video+PCM capture, complete Warden warning/release/recovery/counter, missed swing, block, dodge, projectile, spell, real-impact sample alignment or 20-minute soak is certified by this change.

**Next dominant weakness:** genuine WebGL frame-submission stalls and missing synchronized moving evidence. Keep the 400ms deadline and legacy default; `?feedback=d04` remains opt-in pending a separate final integration review.
