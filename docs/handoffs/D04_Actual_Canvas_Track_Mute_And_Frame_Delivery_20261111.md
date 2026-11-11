# D04 — Genuine canvas track mute and presented-frame delivery diagnosis (11 November 2026)

**Verdict: IN PROGRESS / NOT TRANSFORMED / A/V SYNC UNVERIFIED / DO NOT MERGE.** This is an independently reviewable test-only diagnostic increment on the isolated D04 branch, starting from `6e891da7152ef7eefd6df80f543b1f81ea4d5679`. Preserve frozen BEFORE `281735d0910c6b2443648af976003d50412ee324`; no main, PR #49, `games/ai-dungeon/src/**`, rig, camera, global lighting or runtime combat-fx edits. The default spectator is still legacy; D04 remains `?feedback=d04`.

## Observable defect

Previous real Chromium/Three.js CI reported **three genuine renderer-submission advances and three explicit real-canvas capture requests** while the combined, explicit video-only, and native-rate video-only WebM files each returned zero bytes. The separate original opted-in soundstage audio produced a non-empty Opus WebM and original PCM, and Playwright's real compositor video independently recorded. The defect cannot truthfully be called an audio/video muxing issue until video-track delivery is tested.

This increment installs a bounded consumer of the **same real `canvas.captureStream()` track**, not a synthetic/offscreen drawing source: a muted `HTMLVideoElement` with `requestVideoFrameCallback`, track `mute/unmute/ended` event timestamps, stream and element readiness, and frame callback metadata. It is created only in the authentic opt-in browser test and is removed, paused and disconnected after all original recorders finish or on recorder startup failure.

The pure evidence policy has conservative outcomes: delivered canvas video without encoded WebM; delivered+encoded video still unaligned; explicitly muted track with no presented-frame callback; or track delivery unverified. Any malformed provenance, invalid clock, unbounded observations or unsupported consumer is unverified. This **never** upgrades `sampleSynchronized:false`, invents a contact/attacker or infers runtime quality from a simulated test.

## Test-first and implementation record

- Expected-red: [CI 42977105431](https://github.com/my-edutu/Ai_games/actions/runs/42977105431) — 42 passing tests, 3 targeted failures because the capture-track classifier did not yet exist.
- Expected-red: [CI 42977877162](https://github.com/my-edutu/Ai_games/actions/runs/42977877162) — 45 passing tests, 1 targeted failure because the assessed/retained manifest did not yet preserve the delivery diagnosis.
- Final green: [CI 42977981710](https://github.com/my-edutu/Ai_games/actions/runs/42977981710) — **46/46 native contracts**, production build, SHA-verified retrieval of 20 CC0 Dungeon models, and **one genuine Chromium/Three.js Dungeon preview test passed**.
- [Actual source media and diagnostics artifact 13836576287](https://github.com/my-edutu/Ai_games/actions/runs/42977981710/artifacts/13836576287) — retained manifest, original PCM, independent original audio-only WebM, live real-Dungeon screenshot and 53.2-second VP8 Playwright real-game video. The video is **not** synchronized to the original PCM.

Changes: `tests/foundation/dungeon-d04-av-capture-evidence.test.cjs`, `tests/browser/dungeon-d04-av-evidence.cjs`, and `tests/browser/dungeon-physical-feedback-preview.spec.cjs`. No production/gameplay source changed. Each frame and mute-event trace is capped at 32 entries. The existing 20 MiB video and 2 MiB sound/PCM capture limits remain; no additional effect pools, retained WebGL textures, WebAudio voices or borrowed sounds are introduced.

## Genuine current CI observation, not a simulated score

The final **actual browser artifact JSON** shows:

| Real-source observation | Evidence |
| --- | --- |
| Independent HTMLVideoElement source | Genuine WebGL `canvas.captureStream()` video track |
| Element autoplay | `PLAYING` |
| Element state when capture finished | `readyState=4`, `videoWidth=688`, `videoHeight=397` |
| Track at capture start | `live`, `muted:false` |
| `mute` event | At approximately **4813.6ms** on the browser performance clock |
| Track at finish | `live`, `muted:true` |
| `requestVideoFrameCallback` observations | **0** (no confirmed compositor-presented video frame callbacks) |
| Genuine game frame acknowledgements | **3** advances |
| Explicit `requestFrame()` calls / failures | **3 / 0** |
| Combined video + original audio / explicit video / native video WebM | **0 / 0 / 0 bytes** |
| Original soundstage audio-only WebM | **141,197 bytes** |
| Actual original soundstage PCM WAV | **485,144 bytes**, 5.5 seconds, 44.1 kHz mono, nonzero RMS |
| Separate real Playwright compositor VP8 video | **53.2 seconds**, 800×500, video-only |
| Evidence classification | `TRACK_MUTED_WITHOUT_PRESENTED_FRAMES` and overall `UNVERIFIED` |

**Interpretation:** the WebGL canvas capture track starts live/unmuted and later reports `mute`; the current hidden monitor observed no compositor-presented video-frame callbacks, despite game renderer-submission receipts. This narrows the failure to canvas-track delivery, compositor presentation or encoding, **but does not identify which**. In particular, the monitor's `opacity:0` offscreen placement could suppress callbacks, while `readyState=4` and valid dimensions are not proof of frame-by-frame encoded delivery. The root-cause conclusion must remain open. The separate real browser video is useful for visual review, not sound-contact alignment.

## Spec review and independent quality caveat

The isolated monitor borrows only the real already-consented canvas track. Existing D04 event causality, verified HP-loss contract, actor identity, dedupe, 8-voice audio limit, accessibility and renderer receipts are unchanged, not re-certified. The additional test-only video element may impose minor decoding/compositing overhead; the 32-sample caps and deterministic cleanup limit retention. A real 800×500 compositor capture was inspected and still shows stylized characters/environment and does not prove faithful blade-tip-to-impact timing. It must not be described as Diablo-IV parity or production readiness.

## Next dominant corrective investigation

1. Compare a minimal **visible two-pixel real-stream monitor** with the currently fully transparent one to rule out callback suppression due to compositor culling; simultaneously timestamp actual submitted-frame receipts relative to `mute`/recorder events on the same monotonic page clock.
2. Run identical real-source probes in a GPU-capable headed Chromium host. Do not substitute synthetic video frames, invent a target or bypass the actual canvas.
3. Once authentic rendered-video delivery works, capture matched three viewpoints, desktop 1440×900 and mobile 390×844, genuine Warden warning/release/recovery/counter, misses, block, dodge, arrow, spell, HP-confirmed impact, original PCM and long resource soak. Independently compare frames against the frozen BEFORE and review original GLB blade-tip geometry, not merely wrist proxies.

**Gate remains OPEN.** No promotion of legacy spectator or merge until the dedicated final integration review.
