# Performance Report

## Budget decisions

- Canvas device-pixel ratio capped at `2`.
- Presentation particles hard-capped at `96`.
- Existing presentation controller entity cap remains `2048` in the stream host.
- Existing replay capacity remains bounded at `360` frames in the stream host.
- Polling is single-flight; slow requests cannot overlap.
- HUD DOM changes occur on authoritative snapshot changes rather than every animation frame.
- World rendering uses procedural geometry and no added texture/3D asset memory in this increment.
- No new framework/runtime dependency was added.

## Long-session behavior

The visual layer owns only bounded particle state, interpolation state and one WebAudio context. It does not accumulate per-floor DOM or retain world entities outside the current public snapshot. The server remains responsible for bounded replay and authoritative entity capacity.

## Measurement status

Repository CI exercises Tower stream self-test, full test suite, chaos/release validation and Playwright browser capture. This report must not claim measured browser FPS, GPU time, heap stability or soak memory until CI/runtime telemetry provides those values.

## Production performance gate

Incomplete until representative 1080p/OBS-like browser runs confirm stable frame pacing, no progressive heap growth, no effect-pool leak and acceptable CPU/GPU usage during guardian/danger peaks.