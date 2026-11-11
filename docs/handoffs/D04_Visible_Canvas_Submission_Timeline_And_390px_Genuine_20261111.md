# D04 — Visible real-canvas delivery, receipt timing and genuine 390px witness (11 November 2026)

**Verdict: IN PROGRESS / A/V SYNC UNVERIFIED / DO NOT MERGE.**

**Scope:** ONLY `feat/dungeon-d04-combat-feedback-realism-20261108`. Inspected `AGENTS.md`, `docs/handoffs/D04_Real_3D_Preview_Acceptance.md`, pinned BEFORE `281735d0910c6b2443648af976003d50412ee324`, previous canvas-muted artifact and live D04 browser source. Starting HEAD `a0853bad55b85e19ba991ff76d9961646f48b74f`. Do not change main, PR #49, authoritative `games/ai-dungeon/src/**`, character rigs, camera, global lighting or any other session.

## Dominant observable defect

The previous *transparent/offscreen* monitor observed no `requestVideoFrameCallback`, but was possibly compositor-culled. Simultaneously, the real WebGL canvas generated genuine renderer receipts, and both explicit/native video-only plus combined A/V recorders returned zero bytes while the original opted-in audio captured correctly. There was insufficient evidence to distinguish transport starvation from the hidden monitor itself.

The browser diagnostic now uses a genuinely visible, fixed, **2×2 pixel** muted video consumer of the **same real `canvas.captureStream()` track**. It registers `requestVideoFrameCallback` before `play()`, records DOM/visibility proof, and removes the consumer/listeners when recording ends. It never draws substitute frames or alters combat.

The frame sampler records up to **32 monotonic `performance.now()`-relative observations** of actual incrementing renderer-submission receipts and successful/failed `requestFrame()` attempts. A pure classifier checks same-clock proof, visible consumer, real track provenance, monotonicity, bounded event/frame counts and real transport callbacks. It distinguishes pre-mute submissions with no presented frames from post-mute submissions and verified consumer callbacks, **without upgrading sample synchronization or inventing damage**. All classifications are diagnostic, not parity scores.

A second incremental browser check captures a **genuine 390×844 viewport screenshot** from the *same continuously delivered seeded DungeonRuntime stream* using the existing spectator camera and D04 opt-in. It does **not** pretend that the screenshot is a matched moving mobile clip.

## Test-first and native review

- [Expected red, 46/49](https://github.com/my-edutu/Ai_games/actions/runs/42984018661): three focused receipt-timing contracts failed before the classifier was installed.
- [Intermediate targeted failure](https://github.com/my-edutu/Ai_games/actions/runs/42984114952): 48/49 after implementation exposed a test-fixture omission of actual `requestVideoFrameCallback` mode. The fixture was corrected, not quarantined.
- [Green native and authentic browser probe](https://github.com/my-edutu/Ai_games/actions/runs/42984241051): 49/49 native tests, production build, SHA-verified model retrieval and one real Chromium/Three.js Dungeon browser test passed.
- [Green native, authentic browser and real 390px evidence](https://github.com/my-edutu/Ai_games/actions/runs/42984575494): 49/49 native tests, production build and genuine browser test passed. [Full retained artifact](https://github.com/my-edutu/Ai_games/actions/runs/42984575494/artifacts/13838797296).

Files changed are limited to `tests/foundation/dungeon-d04-av-capture-evidence.test.cjs`, `tests/browser/dungeon-d04-av-evidence.cjs`, `tests/browser/dungeon-physical-feedback-preview.spec.cjs`, and this handoff. **No production runtime, model, audio synthesizer, authoritative rules, camera or lighting changed.**

## Actual first real browser evidence (run 42984241051)

- One actual visible 2px track consumer, `consumerVisibleAtStart:true`, document `visible`, video playback `PLAYING`, source dimensions 853×493 and `readyState=4`.
- Actual WebGL renderer receipts: **1 → 6**, with **5 successful explicit frame requests and 0 request exceptions**.
- Same-page-clock submission samples at approximately **1225.8, 1252.0, 1270.1, 6616.9 and 6723.2 ms**. Track mute at **6625.6 ms**, unmute at **6735.8 ms**.
- **Zero** presented-frame callbacks. Consumer playback time only approximately **0.044 seconds**.
- Combined WebM and both independent real-canvas video-only WebMs: **zero encoded bytes**.
- Separate original opted-in Opus audio-only WebM: **106,421 bytes**; genuine original WebAudio PCM WAV: **485,144 bytes / 5.5 seconds**.
- Independent Playwright compositor video exists, but is **not** a synchronized canvas+soundstage proof.
- Conservative assessment: `PRE_MUTE_SUBMISSION_WITHOUT_PRESENTATION`, `VIDEO_ONLY_ENCODER_UNVERIFIED`, `sampleSynchronized:false`.

## Second real browser / same-run mobile evidence (run 42984575494)

- Real video-track consumer remains `PLAYING`, visibly composited, dimensioned 688×397; nevertheless **0 callback-confirmed presented frames** and **0 encoded canvas-video bytes**.
- Genuine renderer receipts grew from **1 to 4** with **3 successful frame requests**, at approximately **4244.4, 8369.1 and 8474.4 ms**. Track mute occurred at **4277.6 ms** without a corresponding unmute before stop; the first actual sample precedes mute.
- Original soundstage audio-only WebM **134,435 bytes**; original live PCM WAV **485,144 bytes**. Separate real-game Playwright VP8 remains video-only.
- A true **390px-wide live browser screenshot** was retained at `artifacts/dungeon-d04-real-mobile-390.png`, with corresponding real-state receipt. This is *one mobile still*, not proof of multi-angle matching, coherent animation or sample-level A/V alignment.
- Overall A/V assessment remains **UNVERIFIED**.

The independently verified 2px visible consumer **rules out the earlier fully transparent placement as a sufficient explanation**, but it does *not* establish the root cause of track muting, compositor starvation or encoding failure. Browser media PTS and original PCM are not aligned; audio amplitude does not establish contact synchronization.

## Safety and budgets

No original combat event, HP loss, attacker identity, sword attempt, block, Warden danger cell or game seed was altered. The spectator stays **legacy by default**; D04 only via `?feedback=d04`. Audio still requires actual opt-in; mute/reload and reduced motion/flash behavior remain as before. There are no new emitted sounds, meshes, textures, capture streams in production, shader pools or downloaded/borrowed media. Test-time recording, event arrays and receipt timeline are bounded at 32 observations, and video/audio file byte limits remain in force. Existing **7 visual pools, <=104 reserved instances, <=7 extra draw calls and <=8 foley voices** are unchanged; those are budget assertions, not an independently measured 20-minute soak.

**Specification review:** the visible track uses authentic WebGL and original opted-in audio without altering authority; no A/V synchronization claim is promoted. **Quality review:** browser screenshots still reveal a visibly stylized cast and unclear blade-tip-to-HP-contact presentation. Neither prior transparent monitoring nor today's visible monitoring obtains a playable combined A/V file. A screenshot is insufficient for motion-quality signoff.

## Still-open acceptance gates

1. Reproduce the exact canvas recording with a GPU-capable headed browser, capture real canvas track frames and original sound together, and distinguish actual WebGL capture starvation from decoder/compositor/encoder trouble. Require time-aligned frame/audio evidence before declaring sync.
2. Compare legitimate misses, HP-confirmed impacts, block, dodge, projectile, spell, and Warden warning → release → recovery → earned counterattack → defeat/restart in the *actual* game, using the same authoritative seed/checksum; collect three camera directions and both 1440×900 desktop and 390×844 **moving** playback.
3. Measure actual animated weapon-tip geometry against the skinned GLB, not wrist trajectory proxies; no invented attacker attribution.
4. Verify WebAudio opt-in/mute persistence, reduced flash/motion, background/foreground, WebGL recovery, pending-effect dedupe and full 20-minute soak.

**Rollback:** revert only these isolated D04 diagnostic/preview-test commits. **Next dominant weakness:** canvas track delivery and real A/V alignment remain blocked; physical blade-tip contact evidence still cannot pass the independent realism gate. Do not merge or promote default.
