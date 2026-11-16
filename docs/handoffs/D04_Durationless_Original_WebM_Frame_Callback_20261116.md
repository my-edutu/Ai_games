# D04 — Durationless authentic WebM frame-callback decode (2026-11-16)

**Status: D04-ONLY EVIDENCE INCREMENT; NEW-HEAD REAL CHROME AND AUDIOVISUAL REALISM UNVERIFIED.**

## Real obstruction and source evidence

The prior completed real-Dungeon Chrome artifact (\`d04-prior-authentic.zip\`, actual previous-run WebM) contains a genuine opted-in original soundstage and real WebGL canvas. Independent local \`ffprobe\` inspection of \`dungeon-d04-real-canvas-original-sound.webm\` saw VP8 video plus Opus audio, **but no finite format-duration field**. Independent \`ffmpeg -vf scale=24:16 -f framemd5\` inspection found **two distinct decoded video pictures at PTS 2994ms and 3816ms**. The separate genuine readback-original-A/V WebM likewise had only two pictures (PTS 2211ms and 3167ms). These picture counts are sparse and are not contact evidence. Original-PCM timing, synchronization and visible injury remain unverified.

The existing Chromium fallback required a finite \`video.duration\` between 0.2s and 30s before inspecting any pixels. MediaRecorder WebM without a Duration element can report nonfinite duration even when its VP8 frames are decodable. Merely having a \`RECORDED\` label, audio track, bytes, frame receipts, or Opus stream does **not** establish decoded contact. The previous actual Chrome report still recorded \`Chromium could not decode WebM metadata\`; this change does not prove that failure is resolved because Chrome may fail before duration inspection.

## Owned implementation and tests

- Added a **muted, bounded browser-native playback-frame-callback decoding path** when metadata is present but duration is nonfinite, plus one bounded muted metadata-recovery attempt when the initial WebM metadata event times out. It reads at most four actually decoded video pictures through \`requestVideoFrameCallback\` and the same 24×16 pixel hash sampler, with a maximum 5.3-second window. It performs **no seek to Infinity**, does not create an AudioContext, does not play audible audio or redraw Dungeon, and tears down frame callbacks, element and object URL.
- Kept the existing finite-duration seek sampler. The strict classifier accepts \`durationSeconds:null\` **only** when the sample's explicit \`samplingMode\` is \`playback-frame-callback\`, with ordered finite nonnegative frame media times no later than 30s, bounded geometry, samples and luminance. A single, repeated, malformed or spoofed frame does not become moving-gameplay evidence.
- Maintained \`sampleSynchronized:false\`, independent video/audio admission, and refusal to assert decoded PCM onset, contact PTS, actual hit, attacker attribution or accepted injury.
- Committed a **test-first failing regression** exposing the prior finite-duration guard, followed by the implementation and an isolated-page-realm mock DOM contract. Pure runtime checks exercised five positive/negative classifications plus the muted durationless branch (mocked DOM **not Chrome**); both modified JavaScript files parsed cleanly. A subsequent mocked page-realm regression also exercised an initial metadata timeout followed by muted playback recovery. **Three focused regression functions and JavaScript parsing passed when executed directly in the tool V8 runtime**, but these are NOT the repository Node test runner or genuine Chrome. The repository Node suite, production build, and corrected-head genuine Chrome playback **have not been independently verified here**.
- Changed exclusively \`tests/browser/dungeon-d04-decoded-video-proof.cjs\` and \`tests/foundation/dungeon-d04-readback-decoder-proof.test.cjs\`. This document is the third D04-only file.

## Remaining gates and next ownership

Run the corrected-head GitHub Actions D04 workflow (native tests, TypeScript build, real Chrome). Collect matched authoritative playback from cinematic/tactical/chase viewpoints, at 1440×900 and 390×844. Distinguish a browser metadata timeout from nonfinite-but-usable duration, then inspect actual sampled pixels; decode original PCM and align it to authentic hit/whoosh/block/dodge/release events against **frame submission**, not action plans. If original video has only two decoded frames again, report inadequate motion evidence, do not mark visual acceptance.

Dominant authentic combat defect remains WebGL frame-delivery stalls and missing universally drawable HP-injury pixels, **not** the decoder. The D04 visual/audio 400ms deadline is unchanged; late cues remain silent. Required Warden warning/release/recovery/counter, missed swing, block, dodge, projectile, spell, actual impact and 20-minute cleanup/soak trials remain outstanding.

## Isolation / rollback

No changes to main, Draft PR #49, authoritative \`games/ai-dungeon/src\`, rigs, camera, global lighting, other branches, VFX/voice budgets, audio opt-in/mute persistence, reduced motion/flash, deduplication or reset cleanup. Legacy spectator remains default; D04 is strictly \`?feedback=d04\`. Revert these D04-only test/decoder commits if Chrome decoding regresses. Do not claim full transformation, sample-synchronized sound, or Diablo-IV parity.
