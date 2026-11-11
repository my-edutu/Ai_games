# D04 — Serial canvas-encoder isolation and authentic WebGL recording probe (11 November 2026)

**Status: IN PROGRESS / NOT TRANSFORMED / NOT READY FOR DEFAULT / A/V SYNC UNVERIFIED.**

## Frozen scope and authority

- Repository `my-edutu/Ai_games`, branch `feat/dungeon-d04-combat-feedback-realism-20261108` ONLY.
- Starting branch head for this increment: `79ddfc07d7d9a46b25051f897afa00d0426dd4c8`. Before-reference remains `281735d0910c6b2443648af976003d50412ee324`. Current code candidate: `c906746f040c96a71e188df638f494a287d91fd6`.
- Consulted `AGENTS.md`, `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`, the preceding 2D-encoder handoff, and `skills/game-audio`, `skills/game-feel-vfx`. Inspected current actual browser recording harness and D04 feedback/foley code.
- Shared coding tunnel unavailable; implemented via the connected GitHub repository API, and used native GitHub Actions for true Node/Chromium execution.
- **Only three files changed in the code candidate:** `tests/browser/dungeon-d04-av-evidence.cjs`, `tests/browser/dungeon-physical-feedback-preview.spec.cjs`, `tests/foundation/dungeon-d04-av-capture-evidence.test.cjs`. No authoritative `games/ai-dungeon/src/**`, character, camera, global lighting, sound, visual implementation, main, Draft PR #49 or other session branch edits.

## Dominant defect and experimental design

The genuine headless Chromium Dungeon preview rendered authenticated WebGL frames and produced opted-in original soundstage PCM/Opus, but its combined and isolated canvas video `MediaRecorder` instances returned empty/failed tracks. Previous *concurrent* 64×64 animated synthetic 2D positive-control recording also failed: this did not establish that WebGL alone was at fault because five simultaneous encoders were competing.

This increment adds a **sequential** encoder experiment in the *same real Three.js/Dungeon browser*, with carefully separated provenance:

1. Keep the original real canvas + original sound bus, isolated real video, isolated real audio, native real video and synthetic 2D concurrent control. Read-only render submission receipts and acoustic opt-in remain unchanged.
2. Track actual active media encoders and wait for all primary recorder `onstop` callbacks. Freeze original-game frame/track-delivery evidence **before** running any new positive-control recording; no late frame can certify an earlier clip.
3. Run the bounded **synthetic 2D-only serial positive control** (64×64, at most 128 paint frames, 2MiB cap, 5.5-second target, 15-second watchdog). Save *diagnostic metadata only*; never save its video bytes or label it Dungeon footage. Strict comparison requires `phase='after-all-primary-encoders-settled'` and `primaryRecordersSettled=true`.
4. After the 2D control has also settled, run a SECOND, genuinely isolated **real WebGL canvas video-only** recorder using `canvas.captureStream(24)`. Observe `physicalFeedback.framesAcknowledged` at the **start and end of this distinct capture window**; require actual positive frame advancement with no fabricated frame requests, genuine video/webm, one video/zero audio tracks, bounded duration and bytes, and correct exclusive phase. Retain video only when all provenance conditions pass. Its PTS is NOT aligned with the earlier audio/PCM.
5. A serial real video probe can never upgrade `combinedVideoAudio`, `classification` or `sampleSynchronized`; the latter remains `false` until genuine matched sample/frame evidence exists.

The policy produces `POST_RELEASE_ENCODER_RECOVERED` only when a synthetic 2D recorder genuinely works *after* failed concurrent attempts. This suggests concurrency/resource contention deserves investigation, **not** that it definitively caused the WebGL failure.

## Test-first and native execution

- Test-first regression commit `4b50982d8f188ae64922038c2942cd0c89697e9b`: [expected red CI](https://github.com/my-edutu/Ai_games/actions/runs/43000902527), four new serial-2D contracts initially failed.
- Serial 2D classifier and browser implementation: `1142d9675d3f4d88ef925319bc251c958ba24e94`, `1bc46804ef45ece011a55c3c9c09024ed5019f11`. [Successful native+real-browser CI](https://github.com/my-edutu/Ai_games/actions/runs/43001205589): **57/57** native contracts, production build, 20 SHA-verified CC0 model downloads, authentic Chromium/Three.js Dungeon preview passed.
- Subsequent test-first commit `769537ad4cddd6f25461888a2d05cb79b0ab5854` introduced three further contracts for **real** WebGL serial receipt/provenance; [expected red CI](https://github.com/my-edutu/Ai_games/actions/runs/43001934957) failed **exactly these three tests**.
- Serial WebGL source-classification/retention implemented in `ad208997accf1e95fdc2db767f92f11cd1adfa9f` and authentic browser producer in `c906746f040c96a71e188df638f494a287d91fd6`.
- [Final code-candidate CI run](https://github.com/my-edutu/Ai_games/actions/runs/43002272032) **passed:** 60/60 native contracts, build, asset retrieval, and 1/1 authentic Chromium/Three.js Dungeon browser preview. This documentation-only handoff was committed afterward and not separately CI-tested.

## Genuine browser outcome (not an A/V acceptance pass)

At the successful serial-control CI run `43001205589`, the **same real-game browser** reported:

```json
{
  "diagnosis": "VIDEO_ONLY_ENCODER_UNVERIFIED",
  "combined": false,
  "explicitVideo": false,
  "nativeVideo": false,
  "audio": true,
  "synchronized": false,
  "trackDiagnosis": "TRACK_MUTED_WITHOUT_PRESENTED_FRAMES",
  "canvasEncoderDifferential": "BOTH_VIDEO_PATHS_UNVERIFIED",
  "serialCanvasEncoderDifferential": "POST_RELEASE_ENCODER_RECOVERED",
  "submissionDiagnosis": "PRE_MUTE_SUBMISSION_WITHOUT_PRESENTATION"
}
```

The second, full **real-WebGL-serial** code-candidate run `43002272032` again reported `POST_RELEASE_ENCODER_RECOVERED` for synthetic 2D, **but `serialRealVideoRecorded:false`**. Its original real canvas recorders stayed unverified; original opted-in audio-only `true`; render-submission and muted-track diagnostics remained; no sample synchronization. The browser smoke test passed its *truthfulness and resource* requirements, not video-encoding or combat realism acceptance.

- [Authentic CI original soundstage / screenshots / separate game video bundle](https://github.com/my-edutu/Ai_games/actions/runs/43002272032/artifacts/13846677242).
- The synthetic 2D experiment has **no stored gameplay video**. A separately retained Playwright recording is authentic Dungeon imagery but its independent timing does NOT establish original sound alignment. The earlier 390px screenshot is real gameplay but NOT a matched mobile moving clip.
- The observed serial 2D recovery + serial real-WebGL failure narrows the investigation: concurrency appears relevant to *generic 2D* canvas encoding, but **removing concurrent encoders did not yet establish that authentic WebGL video can be recorded**. Browser/GPU/compositor/WebGL transport, frame cadence or native track delivery remain candidates; no definitive cause assigned.

## Preservation, risks, rollback, next owned action

There are no new game-side VFX pools, audio nodes, buffers, foley voices, GPU draw calls, controller mutations or authority changes. D04 remains opt-in via `?feedback=d04`; legacy spectator remains default. Existing WebAudio fresh-gesture opt-in, mute persistence, accessibility, source/HP causality, effect dedupe and cleanup remain untouched in the production modules. The diagnostic harness has bounded recorder size/duration, secondary paint frames, and track cleanup.

**Still NOT ACCEPTED:** genuine dual-track video+original sound PCM synchronization; matched three-viewpoint 1440×900 and 390×844 moving evidence; complete Warden warning/release/recovery/counter/defeat; miss, block, dodge, projectile, spell and HP-verified actual impact comparisons; measured GLB blade-tip rather than wrist-proxy trail; low-end, background, WebGL restart and 20-minute resource soak; visual-quality blind comparison to frozen BEFORE.

**Next dominant weakness:** Inspect precise `serialRealVideo` status, muted track and actual frame-count metadata in the retained real-browser manifest, then compare GPU-enabled headed Chromium with software rendering in a controlled *single-recorder* test. Do not change rigs, camera or gameplay to mask a capture limitation. Only after obtaining real video should anyone assess physical blade-tip/contact audiovisual alignment.

**Rollback:** revert this isolated branch's six test/harness commits; no main or production default rollback is needed. **Never merge until D10 integration acceptance.**
