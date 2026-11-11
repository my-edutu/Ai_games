# D04 — Same-browser canvas-encoder positive control (11 November 2026)

**Verdict: INVESTIGATION IN PROGRESS — COMBAT A/V SYNCHRONIZATION UNVERIFIED — NEVER MERGE.**

## Ownership and baseline

- Repository: `my-edutu/Ai_games`; isolated branch: `feat/dungeon-d04-combat-feedback-realism-20261108`.
- Started from verified branch head `deb7cb47f295b4e81ae276a1a6d4ed468911cd40`.
- Consulted `AGENTS.md`, `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`, specialist `skills/game-feel-vfx/SKILL.md`, `skills/game-audio/SKILL.md`, `skills/production-readiness-review/SKILL.md`, and inspected frozen BEFORE ref `281735d0910c6b2443648af976003d50412ee324`.
- Reviewed authentic earlier Chrome evidence `d04-390-mobile-and-visible-track-ci-20261111.zip`: 800×500 VP8 Playwright video (82.52 s), opted-in original Opus (134,435 bytes), original PCM (485,144 bytes), 390px screenshot, and full diagnostic JSON. This **does not** prove synchronized game A/V.
- Scope of this increment: **only browser capture test harness, pure diagnosis, regression contracts and this note**. No edits to main, PR #49, `games/ai-dungeon/src/**`, models, rigs, 3D camera, renderer, lighting, audio production engines, or other branches.

## Why this test is necessary

Authentic WebGL canvas-track recorders emit zero bytes despite real renderer acknowledgments and successful `requestFrame()` calls; the capture track periodically mutes. The same browser **can** record the original output-bus audio. It is not established whether video failure is global to Chromium's MediaRecorder, specific to canvas capture, specific to WebGL rendering or to GPU/software/compositor interactions.

A **separate synthetic 64×64 2D canvas** is now animated at bounded frequency *in the same browser and capture interval*, encoded through a comparable VP8 MediaRecorder and immediately discarded. It is explicitly a **positive control**, not a substitute game frame. None of its media bytes, geometry, or timestamps may be published as real Dungeon combat. Its provenance metadata alone is preserved in the JSON manifest.

The genuine WebGL video-only recording continues in parallel from the **unchanged actual Dungeon canvas**, and original audio/PCM still derive only from the consented soundstage. This does not alter gameplay, game RNG, audiovisual cue causality or WebGL frame submission.

## Conservative differential interpretation

| Case | Diagnostic | Meaning |
| --- | --- | --- |
| Control encodes, real submitted WebGL fails | `CONTROL_ENCODES_REAL_WEBGL_EMPTY` | Generic MediaRecorder cannot be the **sole** explanation; exact WebGL/render/transport cause remains unknown |
| Both encode video | `BOTH_VIDEO_PATHS_ENCODED_UNALIGNED` | Video encoding possible; A/V and contact alignment still unverified |
| Control fails and real fails | `BOTH_VIDEO_PATHS_UNVERIFIED` | Broad canvas-encoder/environment issue possible; no root-cause attribution |
| Real encodes, control fails | `REAL_VIDEO_ENCODED_CONTROL_UNVERIFIED` | Comparison control inconclusive; real game track needs independent playback inspection |
| Invalid provenance, missing real frame receipts, bad MIME/count/duration or no explicit opt-in | `CONTROL_COMPARISON_UNVERIFIED` | No grounded differential inference |

Regardless of result, `assessD04Capture(...).classification` remains tied exclusively to the **real** combined track and live original PCM, and `sampleSynchronized` is always `false`. The two-track control adds no new acceptance pass. Diagnostic resources are a single 64×64 test canvas, at most 128 drawn control frames, one capped 2 MiB recorder, no retained control media, and cleanup of interval/track even after errors. No production runtime resource budgets changed.

## Test-first evidence

1. Four new contract tests introduced in `tests/foundation/dungeon-d04-av-capture-evidence.test.cjs`. [Expected-red GitHub Actions run](https://github.com/my-edutu/Ai_games/actions/runs/42992538716) failed 4 tests because the classifier and metadata sanitization were not yet implemented.
2. Implemented pure `classifyCanvasEncoderControl`, opt-in-safe assessment and synthetic-byte exclusion in `tests/browser/dungeon-d04-av-evidence.cjs`.
3. The first implementation had **one incorrect test fixture**: it retained an otherwise valid real combined A/V clip and then expected overall capture to be `UNVERIFIED`. The existing classifier correctly reported it as captured but unaligned, so the fixture was changed to make the real combined clip unavailable during the differential failure test. [Failure log](https://github.com/my-edutu/Ai_games/actions/runs/42992748017) is retained; no passing test was falsely reported.
4. The live Chromium browser harness in `tests/browser/dungeon-physical-feedback-preview.spec.cjs` now records the bounded, clearly synthetic positive-control metadata alongside the authentic 3D session. It does not feed this canvas into the real gameplay renderer, screenshots or audio.
5. The final code candidate is `c75f5abb22fdab1fb273d46c3931f9a8dabcbc7b`. [CI workflow](https://github.com/my-edutu/Ai_games/actions/runs/42992885498) executes the native regression contracts, build, SHA-verified CC0 model retrieval and real Dungeon Playwright smoke.

## Evaluation boundary and remaining work

These checks distinguish encoder *capability* in a shared browser from actual WebGL track delivery; they do not prove a browser/GPU root cause, measure in-game sword-tip contact, recover missing encoded video, or align authored sound onset to game frame/PCR or PCM timestamps.

The real production-side contract remains unchanged: legacy spectator by default; `?feedback=d04` opt-in; original WebAudio must follow fresh gesture; mute persistence; reduced motion/flash; no invented attacker; injury only from actual HP loss; bounded pooled effects, concurrent voices, deduplication and disposal.

Still required: three-camera matched moving clips at 1440×900 and 390×844, Warden warning/release/recovery/earned counterattack, genuine miss/block/dodge/projectile/spell/HP-confirmed damage, real blade-tip trajectory from animated licensed GLB assets, genuine dual-track synchronization, background/WebGL recovery and 20-minute saturation/cleanup soak.

**Rollback:** revert only this isolated D04 capture-diagnostic/test set. **Next action:** inspect the positive-control result in the exact CI manifest and, depending on its outcome, compare GPU-enabled headed Chromium with software rendering without altering authoritative gameplay.
