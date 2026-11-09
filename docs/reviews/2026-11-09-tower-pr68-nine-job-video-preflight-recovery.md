# Tower PR68 — Recover authentic film capture preflight (2026-11-09)

**Stage:** P0 EVIDENCE + GAME-LOOP TRUTH — OPEN  
**Transformation verdict:** NOT EVALUATED  
**Source repair:** [ce0f751cdeedf5eadf2ea1d17434fd7e24fa64b0](https://github.com/my-edutu/Ai_games/commit/ce0f751cdeedf5eadf2ea1d17434fd7e24fa64b0)  
**Inspected branch HEAD:** 215907cfad2772753a916ed0b354d97667424ef9  
**Frozen baseline:** 1731b380851162741761c5569e2bc152a0869ca9 (unchanged)  
**PR:** https://github.com/my-edutu/Ai_games/pull/68 (OPEN DRAFT)

## Real executable evidence, not inferred queue state

[Recording workflow 42490211469](https://github.com/my-edutu/Ai_games/actions/runs/42490211469) acquired GitHub runners. The `authentic-ledge` source-campaign job completed successfully. Eight baseline/candidate `normal-speed-play` jobs built original source but **failed BEFORE Chromium capture** on `Prove scoped video integrity before browser capture`, so no new current-head gameplay film was produced. The source candidate for those jobs was an older fcf98aa2 commit, not current HEAD.

[Baseline moving job 128760727068](https://github.com/my-edutu/Ai_games/actions/runs/42490211469/job/128760727068) reported **46/49 passing, 3 failing**; [candidate danger job 128760727118](https://github.com/my-edutu/Ai_games/actions/runs/42490211469/job/128760727118) reported **48/51 passing, 3 failing**. The three reproducible preflight failures are the same: (1) impossible same-tick `result>running` reversal allowed an extra terminal intermission event; (2) 12fps fixture incorrectly expected no warning although the original integrity checker honestly emits `original-film-has-low-motion-sampling`; (3) a timebase assertion expected outdated caveat wording rather than the currently stronger `NOT established; no on-screen` warning. This is a real blocking failure, not a subjective gameplay score.

## Coherent repair

- The original passive event index now quarantines *additional terminal evidence at that tick* after a contradictory same-tick lifecycle edge, preserving a legitimate result already observed and the valid `running>result>intermission` sequence without manufacturing a phase after corrupted polling. Invalid edge count is exposed as diagnostic evidence; it never rewrites source ticks.
- The native film fixture now explicitly expects the low-motion-sampling warning at 12fps. It remains NOT EVALUATED for FEELS regardless of the transport status. No FPS threshold was lowered.
- The native-video timebase test now asserts the source text's explicit prohibition against claiming rendered on-screen action or independent review from timestamp search windows.

Changed exactly: `scripts/tower-event-alignment.cjs`, `tests/phase3/tower-event-alignment.test.cjs`, `tests/phase3/tower-native-film-integrity.test.cjs`, `tests/phase3/tower-video-timebase.test.cjs`. No authored 3D presentation or simulation changes; no false improvement claim.

## Verification and unresolved issues

GitHub original logs and exact GitHub file revisions were inspected before patching; the repair was committed. **Original repaired Node 22 / Three.js suite, Chromium baseline/candidate native WebM capture, 20Hz event alignment and any effect on actual visual experience are NOT YET RUN.** Do not count preflight as passing until the new runner executes it.

Historical authentic portrait renderer e0fe7729 [artifact 13594459833](https://github.com/my-edutu/Ai_games/actions/runs/42426089449/artifacts/13594459833) had giant near-camera clockwork hiding airborne action around 16.5–18s. That footage does not evaluate this candidate. LOOKS 0/5, FEELS 0/5, PLAYS 0/5; target-device p50/p95/p99 and memory NOT EVALUATED.

## Next highest-impact action

Run corrected exact-head tests, then source-pin and capture fresh 60+ second 960x600 and 390x844 baseline/candidate clips for ascent, moving platforms, crusher/guardian and earned gateway, floor nine, terminal/restart. Audit two full authentic campaigns and pair native WebM PTS with real source events; inspect *continuous* motion for the most serious composition/experience defect before opening P1. Keep PR68 draft and baseline fixed; never merge, deploy, force-push or rewrite PR58.
