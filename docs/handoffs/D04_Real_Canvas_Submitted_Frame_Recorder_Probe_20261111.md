# D04 — Real canvas submitted-frame capture probe (11 November 2026)

**Decision: IN PROGRESS. Authentic Dungeon WebGL and original WebAudio PCM observed; combined canvas+sound WebM and A/V synchronization remain UNVERIFIED.** Legacy /dungeon remains default; this evidence tool exercises only `?feedback=d04`. Do not merge to main or Draft PR #49.

## Dominant observable defect and scope

The verified real-game CI run at `d6817bb` produced an authentic 54-second **Playwright video-only** browser record, an authentic 5.5-second opted-in soundstage WAV and a real 3D screenshot. However the requested joint `HTMLCanvasElement.captureStream(24)` + original `MediaStreamDestination` audio track produced **zero WebM bytes**. This is not evidence of synchronized impacts.

This increment changes ONLY:
- `tests/foundation/dungeon-d04-av-capture-evidence.test.cjs`: red-first negative/provenance contracts; 36 native tests in final CI suite.
- `tests/browser/dungeon-d04-av-evidence.cjs`: fail-closed requirement for observed submitted-frame capture, bounded recorder delay.
- `tests/browser/dungeon-physical-feedback-preview.spec.cjs`: request an actual canvas frame through `CanvasCaptureMediaStreamTrack.requestFrame()` **only when the existing D04 actual WebGL frame-acknowledgment serial increases**. No invented frame, synthetic combat, synthetic sound, or gameplay-authority modification. Retains native frame-rate capture fallback if explicit-frame API is unavailable; logs bounded counts, request failures, recorder chunk count/bytes, muted flag, render epochs; cancels the probe when recording ends. Timeout is capped at 15 seconds and encoded byte ceiling stays at 20 MiB.

## Reproducible red → green evidence

1. [CI 42963830624](https://github.com/my-edutu/Ai_games/actions/runs/42963830624) at test-first `e882b59`: native contracts **34 passed / 2 failed**, as expected, because the old classifier incorrectly certified a nominal WebM with **no observed WebGL canvas frame provenance**.
2. [CI 42964205854](https://github.com/my-edutu/Ai_games/actions/runs/42964205854) at `3b102fa`: **36/36 native Node tests, production build, SHA-verified CC0 model download, genuine Chromium/Three.js/seeded-Dungeon Playwright smoke all succeeded**.
3. [Authentic CI artifact 13830403144](https://github.com/my-edutu/Ai_games/actions/runs/42964205854/artifacts/13830403144) includes the 3D screenshot, **real video-only Playwright WebM**, real mono original WebAudio PCM WAV and machine-readable `dungeon-d04-live-av-evidence.json`. The review did not substitute a staged attack, fake soundtrack or alternate game engine.

## Actual renderer and audio observations (latest CI, not an estimate)

- Browser capture: 1 real WebGL canvas video track, 1 opted-in original soundstage track; `video/webm;codecs=vp8,opus` reported supported.
- Submitted-frame serial advanced **1 → 6**. The manual track requested **5** canvas frames from those actual acknowledgments; **0 request exceptions** and **0 renderer-epoch changes**. The recorder emitted **1 data event, 0 data bytes**, stopped at ~**6.6 seconds**. **Combined WebM remains unavailable**. Requesting legitimate frames alone did **not** solve the encoder/output problem; do not repeat that hypothesis as a success.
- Independent live original PCM: `RECORDED`, 44,100 Hz, mono PCM16, 242,550 samples, 485,144-byte WAV, 5.5 s, peak ~0.01306 and RMS ~0.00701. These describe recorded waveform energy, not correctly timed or good-quality hit sound. Source mix includes ambient audio, not just D04 impact sounds.
- The Playwright video is **video-only** and covers the entire browser session including loading, not the exact 5.5-second audio window. It must never be published as a synchronized combat montage.
- Current evidence policy is **UNVERIFIED**, `combinedVideoAudio:false`, `liveOriginalPcm:true`, `renderFramesAdvanced:true`, `sampleSynchronized:false`.
- Genuine screenshot inspection confirms original 3D assets, readable characters and visible contact-area fragments, but does **not** establish that those fragments followed true blade contact or were correctly synchronized. No matched frozen-before video, multi-camera comparison, mobile or 20-minute soak was performed.

## Specification and quality review

**Spec:** Experimental `?feedback=d04` is unchanged; authoritative `games/ai-dungeon/src/**`, character rigs, camera, lighting, gameplay, source sound/VFX engine, main and PR #49 were not touched. Distinct attack/HP-loss causal contract, WebAudio consent/mute, reduced-motion/flash paths, deduplication, cleanup and budgets remain on the prior runtime path; this is a test-only capture change, **not** a new acceptance certification.

**Quality:** This recording failure now has a stronger diagnosis: the real frame producer delivered confirmed submissions and explicit frame requests without recorder bytes. Whether Chromium's video track or audio+video muxing is the dominant fault is still **unknown**; neither a supported MIME string nor a zero-byte event determines the root cause. Browser workload uses software WebGL and must not be generalized to GPU clients. The 5.5-second sample is insufficient for Warden cycle, misses, blocks, dodges, projectiles, spells, verified damage audio or synchronized playback.

## Next isolated, test-first probe

Run the exact same real opted-in Dungeon source with **video-only and soundstage-audio-only MediaRecorders separately**, with byte/track/timestamp diagnostics. If video-only also fails despite frame receipts, investigate WebGL drawing-buffer lifetime and encoder delivery without changing global renderer behavior or fabricating frames. If each isolated encoder succeeds but combined fails, investigate browser mux compatibility and a separately disclosed unaligned real-source review format. Probe the actual encoded tracks with `ffprobe` before claiming recorded video+audio. Preserve artifact size/time caps and consent, then attempt matching three camera views, desktop/390px mobile, authentic combat event categories and a bounded resource soak.

**Release gate remains OPEN.** This source-level capture improvement and better diagnosis do not prove complete physical combat realism, synchronized original audio or parity with modern AAA action games.
