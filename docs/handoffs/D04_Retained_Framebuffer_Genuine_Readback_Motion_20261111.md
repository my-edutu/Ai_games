# D04 — Opt-in retained WebGL readback and decoded-motion evidence (11 November 2026)

**Status:** CANDIDATE EVIDENCE / NOT ACCEPTED / DO NOT MERGE. Only branch `feat/dungeon-d04-combat-feedback-realism-20261108`. Baseline for this increment: `94b3930af8f7105bb6b6ff7264fb7d6c4b99dbae`. Frozen BEFORE remains `281735d0910c6b2443648af976003d50412ee324`.

## Why this increment

In real headless Chromium playback, normal WebGL canvas capture returned zero bytes or just one video frame and delayed readback copies were all one flat color despite genuine renderer submission receipts. An encoder output's byte count alone could falsely promote the footage to *moving* audiovisual evidence. The previous decoder only assessed the serial canvas recorder, not authenticated receipt-gated WebGL readback.

## Implementation: provenance before quality claims

1. `public/ai-dungeon/app.js` retains the genuine Three.js drawing buffer **only** at `/dungeon?feedback=d04&captureProbe=retain`. Both ordinary `/dungeon` and `?feedback=d04` keep `preserveDrawingBuffer:false`. No gameplay authority, camera mode, rig, global lighting or mainline setting changes.
2. Authentic Chromium D04 browser capture explicitly opts into that forensic route and requires `getContextAttributes().preserveDrawingBuffer === true` on the real `#world` WebGL context. The actual opted-in original soundstage is recorded; original audio remains opt-in and muted by user choice.
3. `dungeon-d04-decoded-video-proof.cjs` adds bounded ffprobe VP8 verification + ffmpeg `framemd5` on the first 64 real WebGL readback video frames, in addition to existing serial capture. It rejects malformed, over-budget, absent, synthetic, or wrong-track sources.
4. `dungeon-d04-av-evidence.cjs` distinguishes `REAL_WEBGL_READBACK_MOVING_VIDEO_UNALIGNED` from static/one-frame/invalid output. This is stronger than a WebM byte count. It **never** marks sample-level audio/video synchronization as passed.
5. The isolated D04 CI checks both capture gates and installs ffmpeg/ffprobe for actual binary decoding. Detached unit fixtures test parser logic but **are not** genuine in-game recordings.

## First genuine Chromium result at commit aabc18ace

GitHub Actions: https://github.com/my-edutu/Ai_games/actions/runs/43022172614

- D04 foundation tests: **70/70 passed**; production build passed; 20 SHA-verified CC0 GLB assets retrieved; genuine Three.js browser playback passed.
- Authentic canvas + original opted-in soundstage: **101,512-byte WebM**, with a real Opus audio track but only **one decoded VP8 video frame**. **Not a moving or sample-synchronized combat clip.**
- Actual independent original soundstage: **88,067-byte Opus WebM** plus **5.5-second 44.1 kHz mono PCM WAV**, source-identifiable but no measured damage-to-PCM onset comparison.
- Actual frame-receipt-gated readback: **48,720-byte VP8-only WebM** of the original Dungeon WebGL canvas, **four decoded and distinct video frames** verified separately using native ffprobe/ffmpeg, using progressive source frame receipts and non-flat pixels. The readback recording was made **after** the earlier sound recording and must never be treated as synchronized with that audio.
- Desktop 1440×900 and mobile 390×844: two changing genuine compositor pixel screenshots per viewport from the seeded game, **not** matched camera-angle moving clips.
- Independent direct canvas video tracks each encoded about 13,543 bytes but yielded only one video frame; serial real-WebGL direct capture remained empty. This is a partial diagnostic recovery, not proof of true continuous original gameplay A/V.
- Synthetic diagnostic encoder controls remain excluded from game-footage evidence.

Evidence artifact: https://github.com/my-edutu/Ai_games/actions/runs/43022172614/artifacts/13854959646

The stricter production-like CI at the later branch head must also pass; do not reuse this first run as verification of later decoder/manifest changes. The latest decoder evidence is expected in `artifacts/dungeon-d04-live-av-evidence.json` under `decoder.readbackVideo` and `assessment.receiptReadbackVideoMotionQualified`, and must be checked against the matching commit.

## Ownership, budgets, rollback

Only D04 preview renderer **forensic flag**, D04 test/capture scripts, narrow test workflow, and this handoff changed. No modifications to `games/ai-dungeon/src/**`, authoritative ticks/snapshots, characters, camera, global lights, PR #49, main or other active branches. Event causality, frame-gated audio, mute persistence, deduplication, reduced-motion/flash, seven retained visual pools, 104 reserved instances max, and eight-voice foley cap were **not modified**.

`preserveDrawingBuffer:true` can increase GPU memory/bandwidth and should stay *disabled* in production/default preview. This increment did **not** measure its sustained cost. Reproduce diagnostic only with the explicit `captureProbe=retain` URL; remove that query flag to immediately return to legacy buffering. Do not promote the default setting.

## Unmet mandatory acceptance gates

No original frame-to-audio sample-clock synchronization proof. No continuous, convincing combined game WebM with multiple combat video frames and corresponding sampled original impact sound. No matched three-direction moving recordings at desktop and 390px; no complete verified Warden warning/release/recovery/earned-counterattack; no exhaustive real miss/block/dodge/projectile/spell/HP-loss audiovisual comparison; no measured animated GLB blade-tip contact (wrist proxy remains); no 20-minute resource soak, accessibility stress, or independent blind BEFORE/AFTER critique.

**Next dominant issue:** prove that two or more decoded genuine combat frames in a single video+original-audio track correspond to bounded real renderer submission timestamps and real authority HP event timing. Only after that can latency, contact geometry, audio-onset alignment and three-viewpoint cinematography be judged credibly.

**Final claim:** opt-in forensic framebuffer retention is a useful reproducible capture aid, not physical-combat realism acceptance. Keep legacy spectator default; D04 remains opt-in and unmerged.
