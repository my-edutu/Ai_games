# D04 — Host Chrome is not the Playwright video encoder (11 November 2026)

**Status: isolated, unmerged, authentic D04 A/V remains UNVERIFIED.** Owner: Session 4 combat feedback and original sound. Branch `feat/dungeon-d04-combat-feedback-realism-20261108`. Frozen BEFORE is `281735d0910c6b2443648af976003d50412ee324`. No edits to `main`, PR #49, `games/ai-dungeon/src`, characters, camera or global lighting.

## Verified dominant blocker

The previous [D04 Chrome-backed job](https://github.com/my-edutu/Ai_games/actions/runs/43046310060) completed native contracts **81/81**, TypeScript production build, SHA-verified 20 CC0 model downloads, and preinstalled **Chrome 156.0.8078.79** detection. It reached the actual browser test, but failed immediately on `browserContext.newPage`: Playwright's separate `~/.cache/ms-playwright/ffmpeg-1011/ffmpeg-linux` executable was missing. The page never opened. The runner also lacked command-line `ffprobe` / `ffmpeg`; that optional decoding limitation remains independently **UNVERIFIED**.

This is **neither** a Dungeon rendering/contact/audio defect **nor** evidence that the combined canvas recorder works. Host Chrome alone does not provide Playwright's video-attachment encoder.

## Test-first correction

1. Commit [`a7d169e`](https://github.com/my-edutu/Ai_games/commit/a7d169eaf9c76d2f73a4dce8829958582ec6d34e) added a focused contract to `tests/foundation/dungeon-d04-host-chrome-ci.test.cjs`. It requires that the isolated browser job provision **only** the Playwright `ffmpeg` binary before invoking the real preview, with no `apt-get`, browser reinstall or `--with-deps`.
2. [Red run 43055337333](https://github.com/my-edutu/Ai_games/actions/runs/43055337333) completed **81 passing / 1 failing** native tests. This is an independently observed expected failure; the browser job was skipped because the contract job failed.
3. Commit [`189f157`](https://github.com/my-edutu/Ai_games/commit/189f157bbb599140c5fe0335948746181f42840c) inserted `npx playwright install ffmpeg` into **only** the isolated D04 real-preview workflow, after verified model retrieval and before Playwright's actual Dungeon runtime, preserving the preinstalled Chrome strategy and decoder's fail-open diagnostics.
4. [Correction run 43055430802](https://github.com/my-edutu/Ai_games/actions/runs/43055430802) was **queued** when checked. A queued run is not a passing build, not real-game A/V playback, and not a successful media download.

## Source and genuine historical-media review

Inspected `AGENTS.md`, the D04 acceptance gates, the frozen-before `app.js` at `281735d`, current `physical-feedback-visuals.js`, `measured-weapon-trail.js`, `model-assets.js`, current browser capture harness and the earlier CI-produced Playwright game video and screenshot bundles. Those bundles contain **authentic game imagery** but separate original Opus/PCM and video that are *not sample-aligned*. In sampled existing moving footage, the fight remains stylized and clustered, with hands and weapons visually hard to distinguish; this does not prove blade-tip impact realism. The read-only D04 streak is explicitly a measured **wrist proxy**, not a verified sword-tip measurement.

## Next verification and acceptance gates

1. Require the corrected GitHub job to complete **both** native/build and genuine browser jobs; inspect whether the downloaded Playwright-owned encoder permits `newPage` and original 3D gameplay. If CDN fetch fails, label that specific transport failure instead of calling combat broken.
2. Read actual capture diagnostics and preserve original footage + live original audio with provenance. No same-window clip becomes synchronized proof until actual submitted video frames and audible onset are compared against authoritative HP deltas. Missing native ffmpeg means decoded frame/PCM assertions stay UNVERIFIED, even if Playwright saves a gameplay video.
3. Capture three genuine moving viewpoints at 1440×900 and 390×844, plus misses, blocks, dodges, projectiles, spells, Warden warning/release/recovery/earned counter, genuine impact, mute/reload, reduced motion/flash and 20-minute resource bounds. Never substitute 2D encoder controls or screenshots for the genuine Dungeon video.
4. After capture reliability, prioritize real GLB blade-tip evidence over the existing wrist-proxy ribbon. No speculative attachment point, invented attacker or damage-on-swing.
    
**Boundaries:** No runtime gameplay, animation, rig, camera, lighting, foley, consent, accessibility or VFX pools were changed in this increment. Seven retained pools, <=104 reserved, <=7 draw calls, <=8 voices, 32/32 queues and 64 receipts retain their existing contracts but have not been stress-reverified here. Default spectator remains legacy; D04 requires `?feedback=d04`. Rollback is the two above commits on the D04 branch only.
