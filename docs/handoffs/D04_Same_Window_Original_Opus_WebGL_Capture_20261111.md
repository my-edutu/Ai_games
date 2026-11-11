# D04 — Same-window authenticated WebGL readback and original Opus probe (11 November 2026)

**State: IMPLEMENTED ON ISOLATED BRANCH; NEW NATIVE/REAL-BROWSER VERIFICATION UNCONFIRMED; PHYSICAL REALISM NOT ACCEPTED.** This is an experimental evidence-capture change, not production audio or physics.

## Exact branch and ownership

Repository: `my-edutu/Ai_games`; branch: `feat/dungeon-d04-combat-feedback-realism-20261108`. Start head for this increment: `fe5f06fb94fa6d0e3c4440b7b6a8dee2b88cc8b2` (NOT the historic `d74ab68`). Frozen BEFORE: `281735d0910c6b2443648af976003d50412ee324`.

Inspected `AGENTS.md`, `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`, previous D04 retained-framebuffer handoff, current real browser harness, actual prior browser evidence, original foley/visual/rig-source adapters, and `skills/game-audio` and `skills/game-feel-vfx`.

The project coding tunnel returned disconnected; the GitHub connector performed only branch-scoped file writes. No changes were made to `main`, PR #49, `games/ai-dungeon/src/**`, rig geometry/animation, camera, global lighting or other branches. Normal `/dungeon` remains legacy, `?feedback=d04` remains preview opt-in, and drawing-buffer retention is forensic only at `?feedback=d04&captureProbe=retain`.

## Dominant observable evidence defect

The last independently reported genuine Chrome experiment [Actions 43022172614](https://github.com/my-edutu/Ai_games/actions/runs/43022172614) decoded **four distinct genuine receipt-gated WebGL readback frames**, while original opted-in Opus and live PCM were captured **in a different, earlier recording window**. That proves a limited original moving video witness and original sound existence separately, **not** whether real blade events and original sounds correspond. Real previous screenshots and separate Playwright footage show stylized combat; weapon-tip contact and synchronized injury timing remain visually unverified.

## Reviewable changes

1. First commit [189e51c](https://github.com/my-edutu/Ai_games/commit/189e51cbc9e680f5f35f7875142f7ad734472ecd): four synthetic **contract tests only** for real-source same-window provenance, multi-frame VP8, genuine original Opus, reject muted/invalid/static/synthetic tracks, bounded persistence and permanent `sampleSynchronized:false`.
2. [e058d65](https://github.com/my-edutu/Ai_games/commit/e058d6530a4fee59b14d71b6d7f66e929497c20b): decode the first 64 authentic readback VP8 thumbnails via bounded ffprobe/ffmpeg and independently demand an encoded Opus stream from that *same* WebM. Audio waveform existence alone never certifies strike timing.
3. [82c9ea2](https://github.com/my-edutu/Ai_games/commit/82c9ea27d8e853a2a77697e66c03de657442d74e): classify only truthful, recorded, monotonic, non-flat real WebGL pixel samples plus decoded moving frames and Opus. Preserve a valid same-window `.webm` in a separately named artifact, otherwise retain metadata only. Never rename independent PCM/video as synchronized.
4. [bc5f9ea](https://github.com/my-edutu/Ai_games/commit/bc5f9ea26b013f6febfb78f4ffdb3092ec516d47): append a **single recorder, same-window** experiment after the prior encoders settle. Record the real receipt-gated WebGL 640×400 pixel readback transport plus the *live opted-in original soundstage MediaStream track* in one WebM. Up to 32 genuine frame receipts, 20 MiB cap, 5.5-second recorder budget, source and track checks, cleanup and conservative native decoding. Nothing draws synthetic combat or generates a new audio sample.
5. [68f3a5d](https://github.com/my-edutu/Ai_games/commit/68f3a5d0ae05811f81c9e07626c26ef397328e75): register the new test in the D04-only GitHub Actions workflow.

The new combined same-window track can be *classified* `REAL_WEBGL_SAME_WINDOW_MOVING_AV_UNALIGNED` only when genuine monotonic readback and distinct decoded VP8 frames coexist with original Opus. This is NOT hit/audio-sample synchronization: no decoded PCM onset is currently correlated to authority HP delta or renderer receipt PTS. Valid clip may still be silent during a late action-free recording window.

## Checks and their evidence level

- **Confirmed via connector:** the above file commits exist and are ahead of the inspected baseline only on D04. Diff is restricted to D04 capture/contract/workflow code. TDD contracts were authored first.
- **Not confirmed in this increment:** red test execution, final Node test success, production build, current Chromium genuine moving same-window A/V, updated CI job status, screenshot/video playback, reliable impact sample timing, or budget soak. The GitHub commit-status endpoint yielded **no statuses** and its workflow-run adapter returned **no PR-triggered runs**; these responses are not a CI success or failure.
- **Earlier actual gameplay evidence only (different commits):** the real readback four decoded moving frames + independent original Opus/PCM as reported at Actions run 43022172614. Do not use that earlier run to certify this change.

Reproduce on D04 branch, after official models are present:
```sh
npm ci
node --test tests/foundation/dungeon-d04-same-window-av.test.cjs
node --test tests/foundation/dungeon-d04-av-capture-evidence.test.cjs tests/foundation/dungeon-d04-readback-decoder-proof.test.cjs
npm run build
npm run dungeon:assets:strict
npx playwright test -c tests/browser/dungeon-d04.playwright.config.cjs
```
The [isolated workflow](https://github.com/my-edutu/Ai_games/actions/workflows/dungeon-d04-foley-identity.yml) has equivalent native/build/browser stages and preserves authentic artifact manifests. The genuine same-window result must be read from `artifacts/dungeon-d04-live-av-evidence.json` `assessment.sameWindowMovingAV`, `assessment.sameWindowAVClassification`, `decoder.sameWindowReadbackAV`, and `retained.sameWindowAVWebm` **at the exact matching commit**. A one-frame recording or audio-only WebM is not an A/V pass.

## Scope, resources, and rollback

No production D04 effect allocation, original procedural foley voice count, authored GLB rig or gameplay authority code changed. The capture experiment is only in the test/evidence harness. Existing eight-voice cap, seven retained VFX pools, 104-instance budget, mute persistence, audio opt-in, reduced motion/flash, dedup, and frame-submission gates remain unchanged. The extra 5.5-second experiment increases diagnostic browser runtime and should not become an always-on capture. Its continued playback overhead is not measured.

Rollback: revert these five isolated commits (and this handoff) only on the D04 branch. **No default-path change or merge needed.**

## Remaining mandatory acceptance gates / next dominant weakness

Verify current native tests and real-browser artifact, then correlate **actual authority HP-loss event, exact genuine render submission receipt, video frame PTS, original WebAudio PCM sample onset** under one bounded clock. Record a real miss without impact sound/particles, actual victim HP injury, block, dodge, arrow, spell, and Warden warning/release/recovery/earned counterattack. Obtain matched moving clips across three viewpoints at 1440×900 and 390×844, compare frozen BEFORE blind, and run 20-minute cleanup/voice/GPU-budget soak. The sword streak still uses an animated wrist proxy, not actual skinned GLB blade-tip geometry; do not claim physical contact precision, sound parity to AAA titles, or readiness.
