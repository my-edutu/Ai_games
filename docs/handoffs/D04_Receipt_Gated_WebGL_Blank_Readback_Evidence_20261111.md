# D04 — Authenticated WebGL readback yields blank copied pixels (11 November 2026)

**Status: IN PROGRESS / native test and genuine browser smoke pass; synchronized A/V and realism acceptance UNVERIFIED.**

## Source and boundaries

- Exclusive repository: my-edutu/Ai_games; branch: feat/dungeon-d04-combat-feedback-realism-20261108. Start head: 019f15c75d717f1093d7d0c768c9d7fc80922087; frozen BEFORE: 281735d0910c6b2443648af976003d50412ee324.
- Inspected AGENTS.md, D04_Real_3D_Preview_Acceptance.md, prior serial-encoder handoff, game-audio and game-feel-vfx skills, current browser harness and authentic earlier browser screenshots and footage.
- Coding tunnel disconnected; GitHub connector code changes executed in native GitHub Actions.
- Code changes confined to tests/browser/dungeon-d04-av-evidence.cjs, tests/browser/dungeon-physical-feedback-preview.spec.cjs, tests/foundation/dungeon-d04-av-capture-evidence.test.cjs. No authoritative gameplay, rigs, camera, lighting, main, PR #49 or another branch changed.

## Dominant defect and attempt

Headless Chromium returns zero bytes from genuine Dungeon WebGL capture video, despite authenticated rendering, original separately encoded sound and valid Playwright video. The post-release synthetic 2D encoder had recovered but that did not prove actual WebGL pixels could be copied or encoded.

Added a bounded serial video-only probe that creates a temporary 640×400 2D transport image from the actual world WebGL canvas only after an authentic new render receipt. It samples a 24×16 readback thumbnail, tracks monotonic receipt/time/color signatures and requests an encoded frame only on actual copy. A strictly conservative classifier admits real *video only* when at least two distinct non-flat sampled frames, valid source/phase, zero capture errors, bounded bytes and real receipt progress agree. Neither synthetic paint nor a flat framebuffer can be certified as gameplay video. Independent old PCM does not become synchronized by this.

## Test-first and genuine browser validation

- [09a30fc test-first contracts](https://github.com/my-edutu/Ai_games/commit/09a30fcac397b3a012bdb18465a4bcdd27fa4883): [red run](https://github.com/my-edutu/Ai_games/actions/runs/43009196249), four expected new failures, 60 older contracts passed.
- [3663896 classifier and gated media persistence](https://github.com/my-edutu/Ai_games/commit/3663896be2d52cef59022005e62dcd4543f819b6).
- [a45812a actual browser receipt-gated readback](https://github.com/my-edutu/Ai_games/commit/a45812abcc868da232db8f42e728df2cafca9f91).
- [Green CI](https://github.com/my-edutu/Ai_games/actions/runs/43009517560): 64/64 native contracts, production build, 20 SHA-verified CC0 GLB assets and authentic Chromium/Three.js 1/1 browser smoke passed. This does NOT establish video encoding or quality parity.
- [Authentic CI evidence artifact](https://github.com/my-edutu/Ai_games/actions/runs/43009517560/artifacts/13850720192) independently inspected: genuine original Opus audio WebM, 151,823 bytes at 48kHz; original PCM WAV, 485,144 bytes; separate authentic Playwright VP8 gameplay recording, 800×500 and 109.24 seconds. The latter was not aligned with original PCM.

## Important negative result from actual running Dungeon

| Diagnostic | Observed |
|---|---|
| Genuine new render receipts during readback window | 15 to 21, six increments |
| Source-gated pixel copies | Five, receipts 16 through 20 |
| Capture frame request failures | Zero |
| Distinct sampled pixel colors per copy | **One** |
| Image signature in all five samples | **684a07c5**, unchanged |
| Real receipt-readback video-only WebM | **Zero bytes** |
| Earlier serial direct WebGL video WebM | **Zero bytes** |
| Separate original Opus audio | Recorded |
| Combined synchronized gameplay audio/video | **UNVERIFIED** |

Those five source-canvas readbacks are flat despite valid renderer receipt progression. Browser screenshots and Playwright video show genuinely changing 3D imagery, but the delayed 2D drawImage path did not obtain those visible pixels. Default WebGL framebuffer invalidation and software compositor/capture routing are hypotheses, **not proven causes**. D04 correctly rejected the copied frames; no blank or synthetic video was retained as gameplay evidence.

## Budgets, truthfulness and rollback

Only the temporary test harness gains a 640×400 canvas, 24×16 thumb, 32-sample ceiling, 60ms polling inside a bounded recorder window and 20MiB maximum encoded video size. Interval, media track and canvases are cleaned in finally. Production visual pools, original voice counts, opt-in/mute, reduced flash/motion, deduplication, HP-loss causality and frame receipts are unchanged. Legacy /dungeon remains default; D04 only opt-in ?feedback=d04.

## Still open and next dominant defect

Missing: real live dual-track video and original sound sample timing; three-viewpoint 1440×900/390×844 matched moving captures; full Warden warning/release/recovery/counter; miss, block, dodge, arrow, spell, confirmed HP impact and ambiguous attribution; physical blade-tip motion; 20-minute soak; blind quality comparison to frozen BEFORE. No Diablo-IV parity or production-readiness claim is supported.

**Next:** obtain non-flat compositor-visible pixels at a known genuine frame timestamp via a bounded browser compositor/screencast witness or a proven immediately-in-frame readback without modifying authority, rigs or camera. Only then assess original-sound alignment on a common clock. Reject black, static or synthetic frames, even when the encoder reports bytes. Do not merge before D10 integration acceptance.

Rollback: revert the three isolated test/harness commits and this handoff. No default game implementation was changed.