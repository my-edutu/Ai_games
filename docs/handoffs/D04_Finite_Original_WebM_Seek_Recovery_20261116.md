# D04 — Finite original WebM seek starvation: bounded post-capture recovery (2026-11-16)

**Status: test-first native RED/GREEN and build verified; new-head genuine Chrome audiovisual acceptance pending/unverified. D04 remains opt-in; not a physical-combat realism pass.**

## Evidence and defect

At the isolated branch's preceding [authentic Chrome run](https://github.com/my-edutu/Ai_games/actions/runs/43886104505), the actual Dungeon generated six original VP8/Opus canvas/soundstage recordings (cinematic, tactical, chase at 1440×900 and 390×844). The strict test still rejected physical injury: 12 shared authority ticks, 5 real HP-loss ticks, **0 ticks universally drawable across six viewpoints**. The native Chromium original-WebM inspection remained unverified without the optional ffprobe/ffmpeg decoder. A captured WebM and a submitted-frame receipt are not independently decoded, synchronized impact evidence.

The D04-only post-capture Chromium consumer previously chose four `seeked` attempts whenever `video.duration` was finite. Some valid MediaRecorder WebM streams have a finite duration but an unusable/sparse seek index: no `seeked` event means zero sampled pixels, despite available `requestVideoFrameCallback` playback. That is an **evidence decoder failure**, not a verified gameplay-renderer defect or permission to claim contact/audio synchronization.

## Test-first correction

- **RED** [run 43904857378](https://github.com/my-edutu/Ai_games/actions/runs/43904857378), commit [`f9b269c`](https://github.com/my-edutu/Ai_games/commit/f9b269c581c98e9027022214ba0bcee95ee86cf6): 405 native tests, **404 passed and 1 deliberate failure**; the new regression demonstrated four failed seeks where only two bounded attempts should occur. Native build was skipped after RED.
- **GREEN** [run 43905010790](https://github.com/my-edutu/Ai_games/actions/runs/43905010790), commit [`f3f8633`](https://github.com/my-edutu/Ai_games/commit/f3f86337cafb1754ffb6073f6ddb180223e1dbc4): **405/405 native tests passed**, TypeScript production build passed. Genuine browser job was still running at the last observed check; no corrected-head audio or pixel acceptance verdict is claimed.
- Independent isolated V8 execution of the **actual old and corrected decoder functions** under an explicit mocked DOM reproduced RED (four seek misses, no playback, `BROWSER_DECODE_UNVERIFIED`) and GREEN (two seek misses, one muted bounded playback, four separately hashed frames, `BROWSER_DECODED_MOVING_PIXELS_UNALIGNED`). It independently observed URL revocation and DOM removal. This is synthetic source-level execution, not genuine Chromium or actual game footage.

### Files and boundaries

- `tests/foundation/dungeon-d04-visible-webm-decoder-consumer.test.cjs`: a finite-duration, seek-starved WebM mock with no `seeked` event; requires bounded callback recovery, muted/volume-zero playback, distinguishable decoded samples, and cleanup.
- `tests/browser/dungeon-d04-decoded-video-proof.cjs`: stops after two failed bounded seeks, falls back to at most four `requestVideoFrameCallback` pixel samples or a 5.3-second timeout, keeps finite duration in the report, and permits the truthful finite-duration playback classification. Prior seek samples are discarded rather than mixed with a new playback clock.

Only the **already recorded original WebM** is read. No new game recorder, authoritative event, synthetic visual, attacker identification, source.audio voice, external/unlicensed asset, light, rig, camera, or WebGL renderer change is introduced. Decoder playback is muted at volume zero; object URL, DOM video and pending callback are cleaned up. The original soundstage consent/mute, reduced flash/motion, seven GPU pools/102 instances, draw-call limits, deduplication, scene reset, and 400ms frame-gated original-foley deadline are unchanged.

## Specification / quality review

**Specification:** The decoder continues to authenticate the original recording before any sampling. Finite-duration seek success remains the fast path. Failed seek samples are never counted as a physical contact, audio onset or synchronized timeline. Fallback remains time- and sample-bounded; missing callbacks fail closed.

**Quality:** The synthetic RED/GREEN shows the fix is observable, but genuine Chrome could still fail to decode or display an original VP8 frame; a pixel hash is not a visually confirmed injury. A 5.3s decoder fallback is a **post-capture diagnostic cost**, not a game-frame/performance claim. No visual design improvement is accepted from this change. Rollback is the two-file diff of `f3f8633` and `f9b269c`; never revert through main.

## Next dominant blocker

The latest completed authentic run still measured multi-second WebGL render intervals and five real HP-loss ticks without universal drawable injury evidence. Corrected-head six-viewpoint moving clips must show causal real HP body fragments and independently decoded original PCM aligned to the same submitted frame clock; completed Warden warning/release/recovery/earned counter, miss, block, dodge, ranger arrow, spell, audio consent/mute, reduced settings, restart and 20-minute soak remain unaccepted. Renderer-owner investigation, if required, must occur **outside** this protected D04 branch, without modifying `games/ai-dungeon/src`, rigs, camera or lighting.

Default remains the legacy spectator. D04 continues only under `?feedback=d04` until separate integration review.
