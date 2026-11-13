# M1 Stage A — isolate capture observers (10 November 2026)

This supplements `AI_DUNGEON_TRANSFORMATION.md`; it is the SAME M1, not a new round. Immutable comparison baseline: `281735d0910c6b2443648af976003d50412ee324`. Inspected parent and actual BEFORE source: `47327ba063595c27d19d43f25a016ea2048670e7`.

## Confirmed defect in the experiment
The organic journey and renderer assay used Playwright `trace: retain-on-failure`. Installed Playwright 1.55 defaults screenshots to true and starts a separate screencast. Thus the prior MediaRecorder OFF condition was not an observer-free condition. Native profiling also ran across all three conditions. The prior trace does not attribute all readback to the game or prove the filmstrip is the dominant cost.

Current-parent real Warden OFF/ON/OFF medians: desktop RAF 566.6/583.3/533.3 ms, mobile 450/466.7/333.3 ms. Both organic recordings contain all five rendered stages. Genuine artifacts: run 42860836687, desktop 13786521150, mobile 13785113082. These are BEFORE; no new-head smoothness win is claimed.

## Implemented correction
The organic journey keeps the original WebGL/opt-in WebAudio recording, all authority/checksum milestones, original WAV, explicit screenshots, error collection and network/DOM failure traces. Only the duplicated continuous screenshot filmstrip is disabled.

The real Warden assay disables implicit Playwright tracing/video. Its first OFF/ON/OFF has neither native profiling nor screenshot screencast. Separate labelled blocks measure screenshot-only overhead, clean recovery, and native-only tracing. Each uses the same naturally reached immutable Warden checksum and demands 20 delivered frames. Actual source SHA, resolved observer policy, physical-pixel budgets and camera positions are retained. This held encounter is NOT organic motion acceptance.

No renderer, art, character, authority, audio engine, save, seed or baseline changes. No simulation ticks are skipped and no timeouts are extended.

## Executed checks
- Two configuration regressions first failed, then passed; capture contracts 7/7.
- Actual Chromium tooling-only probe: screenshot tracing true produced 10 filmstrip frames; false produced zero, while both retained network trace files. This is not a game speed measurement.
- TypeScript build and Dungeon suite 403/403; interface/progress tests 21/21.
- Production authority: 24 seeds x 900 ticks, zero replay mismatches, restore checks passed; 199 floor changes and five restarts.
- Full catalogue 1147/1150. Existing failures: dungeon-physical-camera scene hook, dungeon-vaulted-gallery scene hook, dungeon-warden-court scene hook. They remain reported, not weakened.
- Spec syntax and real Playwright test discovery passed.
- Local real-game navigation failed with net::ERR_BLOCKED_BY_ADMINISTRATOR. Connected coding/critic tunnel unavailable. No new-head moving WebGL result or fresh independent critics.

## Status and exact next task
A_INCOMPLETE; IN_PROGRESS_NOT_TRANSFORMED. LOOKS / FEELS / PLAYS UNVERIFIED; critics 0/3. Original hit/audio synchronization and matched immutable-baseline comparison remain UNVERIFIED. PR72 stays separate; inspected animation head 4248a54ad4c83eef7560a13406fae79f76da0458 had a cancelled evidence run and was not adopted.

Inspect the exact-new-head clean observer assay and organic desktop/mobile film before another shader/geometry change. Compare filmstrip ON against its adjacent clean OFF blocks and account for native profiler overhead separately. Verify actual source checksums, pixel budgets, camera positions and video timestamps. If the clean game is still slow, use the isolated native segment to fix the largest measured production cost. Never reinterpret this capture correction as an artistic transformation or reset the baseline.

The original large charter/history are preserved byte-for-byte. This append-only handoff and the existing live gauntlet-latest receipt carry this execution; incorporate the handoff into the controlling charter/history when a safe programmatic repository writer is available.
