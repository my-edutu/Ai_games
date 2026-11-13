# P0 — Source-pinned world/doorway CI shutdown localization (2026-11-13)

**Stage:** P0 OPEN. **Leading transformation verdict: NOT EVALUATED.** No gameplay, physics, camera, visual shader, native capture or other game was changed during this CI-unblocker step. PR #68 remains a draft above PR #58. Frozen baseline SHA: `1731b380851162741761c5569e2bc152a0869ca9`.

## Grounded latest results

- Latest inspected PR68 branch: `cfc211002e555bda209fecc65196a1b0c5cf5643`. Latest quality: [43473897822](https://github.com/my-edutu/Ai_games/actions/runs/43473897822), **FAILED** (phase3-3 only; the nine other jobs passed). This is not a quality or safety pass.
- The real Three.js source-retained roof/gateway test [phase3-3 job 132053854119](https://github.com/my-edutu/Ai_games/actions/runs/43473897822/job/132053854119) imported real source and built actual Clockwork and Void worlds. Last checkpoint: `twenty-real-submissions` at about 194 ms, RSS about 102 MiB, heap about 22 MiB. **About 26.8 seconds later** hosted agent logged shutdown signal, the test subprocess got `SIGKILL`, and no TAP subtest verdict appeared. Available RSS disproves an observed *process-level* heap exhaustion claim but not all external worker causes. Cause is **unknown** until finer subtest proof.
- Latest authentic [candidate vs frozen-baseline campaign 43466814378](https://github.com/my-edutu/Ai_games/actions/runs/43466814378) did produce all eight normal-speed matched scenario recordings, but native source-event alignment failed. At about 25.0→25.5 s desktop, and 24.5→25.0 s portrait, Floor 8 bronze is replaced by violet Floor 9 before a legible full-body original-gateway walk. Strict acceptance remains 0/2. Genuine floor progress does not establish an acceptable film.

## This blocker-isolation change

Attach read-only per-subtest start/end resource/elapsed-time markers to the *existing* actual Three integration file. Instrument the first unchanged source-owned test's final-retirement assertions and `world.dispose()` boundary. The workflow already sets `TOWER_P0_RESOURCE_DIAGNOSTICS=1` only for this file. Retain every test and its assertions, every actual world build, genuine WebGL-submission proxy, source safety bound and failure veto. The markers are inert outside the existing opt-in diagnostic flag; they do not claim GPU timestamps, event-native PTS or device performance.

## Next highest-impact action

Read exact-head phase3-3 log. The last paired `subtest-begin` and missing `subtest-end`, plus final-retirement/dispose markers, distinguish one expensive renderer/source branch from external runner shutdown between cases. If the agent dies after all tests complete, isolate the GitHub host lifecycle; if in one case, reproduce and remove the actual blocking algorithm without deleting coverage. Preserve 9/10-failed status until all jobs complete.

Then prioritize the **same-world physical guardian doorway and complete-body grounded camera crossing** in exact normal-speed desktop 960×600 and portrait 390×844 video. No more independent opacity-only tune-ups without source/frame/pixel evidence. Also certify outcome/restart, device p50/p95/p99/memory, replay and blind 4/5 per pillar. Independent LOOKS 0/5, FEELS 0/5, PLAYS 0/5; real supported-device results NOT EVALUATED.
