# Phase 3 — Premium Broadcast Experience

## Exit gate

Phase 3 delivers a privacy-safe immutable render contract, semantic presentation cues, responsive broadcast layouts, a bounded presentation controller, typed output health, a single-authority HTTP stream host, an accessible Canvas client, distinctive vector characters, adaptive synthesized audio, clean-feed/reduced-motion modes and desktop/mobile browser coverage.

## UI, character and sound review loop

The first visual capture was rejected for three reasons: operator controls overlapped health, Astra was too small against the full-floor camera, and raw movement captions plus high-frequency step audio would fatigue viewers. The review also found stale completed-objective glyphs, repeated feed lines and a post-sigil intent label that did not explain why Astra was still exploring.

Corrections applied before promotion:

- operator controls are invisible in the normal OBS capture and reveal only on direct hover/focus;
- the camera focuses on visible action, current objective and enemies, with damped movement and bounded zoom;
- Astra has a lantern ring, stronger hood/weapon silhouette and name marker at readable scales;
- Mireling, Bone Warden, Ember Seer, Void Hound, Mimic and boss shapes remain distinguishable without colour alone;
- completed sigil/chest/shrine markers disappear and recent public events are deduplicated;
- captions use authored language such as “Astra advances deeper” and “Astra fires a lantern bolt”;
- step and event sounds have semantic cooldowns, a 12-voice ceiling and adaptive calm/exploration/danger/boss/reward/result/recovery ambience;
- particles, floaters, shake, camera motion and replay frames are capped and have reduced-motion variants;
- the browser client is split into ordered core, art, audio, scene and main scripts so each responsibility can be audited without changing visual behavior.

## Verification

- strict TypeScript build: passed;
- Phase 1–3 Node suites: 27 passed, 0 failed;
- stream self-test: authority stable, browser assets present, source budgets present, snapshot privacy safe and recovery verified;
- desktop and 640×360 landscape captures: no JavaScript errors, full-viewport canvas, readable goal/health/caption hierarchy and hidden operator controls;
- sanitized public state omits seed, run ID, config, hidden topology, hidden enemies and private AI memory;
- public entities capped at 32, events at 8, cues at 24, replay at configured capacity, particles at 180, floaters at 12 and audio voices at 12;
- an HTTP Playwright specification covers desktop, phone landscape and reduced-motion clean feed for CI;
- a Chromium script-order verification confirms all five browser scripts execute together and render a valid frame.

The local Chromium installation is governed by an administrator URL block that prevents direct loopback navigation. Visual captures therefore used the same built client with live public snapshots injected into an in-memory page. The HTTP server was tested independently through its self-test and endpoint probes; the committed Playwright test is the direct browser/server gate in CI.

## Readiness

R3 software gate passed with zero open P0/P1 broadcast, character or sound findings. Audience influence, durable authority, operations and external production evidence remain pending.
