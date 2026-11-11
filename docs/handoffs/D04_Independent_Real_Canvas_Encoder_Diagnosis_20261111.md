# D04 — Independent authentic WebGL canvas and original-audio encoder diagnosis (11 November 2026)

**Decision: NOT TRANSFORMED / A/V SYNC UNVERIFIED / DO NOT MERGE.**

Scope: isolated branch `feat/dungeon-d04-combat-feedback-realism-20261108`, based for this increment on `6876998820577b65355d2e04017e2096e39d2471`. Preserve the frozen BEFORE `281735d0910c6b2443648af976003d50412ee324`, `AGENTS.md`, and `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`. Legacy `/dungeon` remains default; this probe runs only with `?feedback=d04`.

## Dominant evidence defect

The genuine Dungeon browser emitted zero bytes from a **combined** WebGL-canvas-video + consented original-soundstage-audio MediaRecorder. Real renderer submissions and explicit `CanvasCaptureMediaStreamTrack.requestFrame()` requests were observed but did **not** prove the browser video encoder received encoded frames. Merely changing the request cadence would be an unsupported fix.

This increment compares independent encoders in the **same actual browser, same opt-in, same Dungeon scene and original sound bus**:

1. Existing combined video+soundstage MediaRecorder.
2. **Explicit-frame** real-canvas video-only MediaRecorder, sharing the actual canvas capture track.
3. **Native-rate** `canvas.captureStream(24)` video-only MediaRecorder, with its own real-canvas track; no substitute/offscreen rendering.
4. Original soundstage audio-only MediaRecorder, with the real audio track.
5. Independent original WebAudio PCM tap, not an alternate or borrowed soundtrack.

The three video candidates are not replaced with a page screenshot or synthetic video if encoding fails. `Playwright`'s video-only recording of genuine compositor output is retained separately, and is **not** falsely labeled as synchronized with any sound.

## Source changes (test-only, no runtime gameplay mutation)

- `tests/browser/dungeon-d04-av-evidence.cjs`: fail-closed explicit/native/audio provenance, bounded byte and duration contracts, independent decoder-path diagnosis and retained media manifest. Separate-track success **never** upgrades the combined A/V classification or `sampleSynchronized:false`.
- `tests/browser/dungeon-physical-feedback-preview.spec.cjs`: two independent real-canvas video encoder probes, original soundstage-only encoder, 15-second watchdog, 5.5-second stop request, bounded chunks, track mute and ready-state diagnostics, shared real renderer-submission receipt observation, and cleanup only **after all probes finish**.
- `tests/foundation/dungeon-d04-av-capture-evidence.test.cjs`: three test-first isolated-encoder regression contracts plus three native-canvas follow-up contracts. Negative cases reject zero progress, missing consent, fabricated sources, wrong codec/tracks and empty files.

Resources: no new game visual/audio resources, synthetic effect pools, WebAudio voices or authoritative state. Test-only encoded-memory caps: 20 MiB each for combined and video probes, 2 MiB for audio-only, 2 MiB for PCM. Each recorder has bounded stop and watchdog behavior; borrowed live soundstage tracks are not stopped by the probes.

## Genuine red/green CI

- [Expected red, independent encoders: CI 42969556274](https://github.com/my-edutu/Ai_games/actions/runs/42969556274) — 36 pass, 3 failures for still-unimplemented diagnosis/persistence.
- [Expected red, native capture: CI 42970447175](https://github.com/my-edutu/Ai_games/actions/runs/42970447175) — native encoder contracts fail before the second implementation.
- [First browser green: CI 42969957334](https://github.com/my-edutu/Ai_games/actions/runs/42969957334) — native contracts/build/authentic browser passed with the explicit-video/audio split.
- [Final browser green: CI 42970732298](https://github.com/my-edutu/Ai_games/actions/runs/42970732298) — **42/42** native test assertions in the D04 CI job, production build, SHA-verified CC0 model retrieval and genuine Chromium/Three.js Dungeon preview succeeded.

### Observed encoded output, not inferred from synthetic tests

The independent real-source run [artifact 13833086662](https://github.com/my-edutu/Ai_games/actions/runs/42969957334/artifacts/13833086662) has:

| Actual recorder | Result |
| --- | --- |
| Combined real canvas+sound WebM | **0 bytes**, one empty data event |
| Explicit-frame real canvas video-only WebM | **0 bytes**, one empty data event, three actual submitted-frame advances and three successful frame requests |
| Opted-in original soundstage audio-only WebM | **139,265 bytes**, recorded |
| Opted-in original soundstage independent PCM | 44.1 kHz mono, 5.5 s, 485,144-byte WAV |
| Separate Playwright genuine game video | VP8 800×500, **54.36 s**, video-only |

The final native-versus-explicit [artifact 13832414165](https://github.com/my-edutu/Ai_games/actions/runs/42970732298/artifacts/13832414165) further proves:

| Actual recorder | Result |
| --- | --- |
| Combined | **0 bytes**, one empty data event |
| Explicit-frame video-only | **0 bytes**, three actual frame receipts, three requestFrame calls, zero request exceptions |
| **Native-rate real canvas video-only** | **0 bytes**, three actual frame receipts, track `muted:false` at start and `true` at stop |
| Original soundstage audio-only | **99,659 bytes**, six non-empty data events |
| Independent original PCM | 44.1 kHz mono, 5.5 s, 485,144-byte WAV |
| Separate real Playwright screen video | VP8 800×500, **64.76 s**, video-only |

External local `ffprobe` inspection of the downloaded final CI artifact finds **Opus audio, 48 kHz stereo** in the real soundstage-only WebM and **VP8 800×500 video** in the separate Playwright browser video. The independent PCM WAV has `pcm_s16le`, 44.1 kHz, mono, 5.5 s. Codec headers and waveform energy do not prove cue/contact timing.

**Diagnosis:** video-track encoding from the actual WebGL canvas remains unverified in BOTH explicit and native capture modes, whereas original soundstage-only encoding and genuine real-game screen video work. This substantially weakens the hypothesis that the audio/video WebM muxer alone caused the empty combined output. It does **not** establish which browser/WebGL drawing-buffer, software compositor, capture-track delivery, or encoder limitation is responsible.

## Acceptance and residual risk

**Specification review:** All edits remain inside tests and this handoff. No authoritative `games/ai-dungeon/src/**`, character rig, camera, global lighting, source combat VFX or source foley was changed. True HP-based injuries, verified swings, mute/opt-in, dedupe, accessibility and existing retained pool limits remain governed by prior runtime code; this increment does **not** recertify those behavior paths.

**Quality review:** The diagnostic probes share actual inputs and never manufacture a hit, an attacker, a voice sample, a canvas frame or a soundtrack. Under the current headless CI, each video encoder returned zero; the separate Playwright video and original audio are therefore **unaligned evidence only**. No `REAL_BROWSER_A_V_CAPTURED_UNALIGNED` classification was awarded to the combined source, and sample-level synchronization remains false.

Unmet acceptance: synchronized original video+audio; three matched viewpoints; 1440×900 and 390×844; genuine miss/block/dodge/projectile/spell/HP-confirmed contact plus Warden warning/release/recovery/counter; timed no-ghost-after-restart; 20-minute effect/audio/frame soak and independent visual critique. The 800×500 visual capture cannot stand in for required desktop/mobile viewpoints.

## Next dominant corrective investigation

Instrument whether `captureStream()` video tracks enter `muted` during sparse software-WebGL frame delivery and determine the timing relative to WebGL submission/drawing-buffer presentation, **without changing the global renderer or faking frames**. Distinguish a headless-only capture failure from a real GPU browser by running an equivalent physical 3D preview in a GPU-capable Chromium host. As a separate review path, retain real Playwright compositor video with explicit monotonic events alongside original audio, labelled unaligned until a common timestamp is calibrated. The authentic GLB blade-tip-versus-wrist problem remains unresolved after usable audiovisual evidence is recovered.

**Release gate:** OPEN; D04 stays `?feedback=d04` opt-in; do not merge or claim Diablo-IV-class parity.
