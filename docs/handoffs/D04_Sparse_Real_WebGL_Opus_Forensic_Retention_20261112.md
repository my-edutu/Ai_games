# D04 — Preserve sparse genuine WebGL + original Opus evidence (12 November 2026)

**Status: IN PROGRESS / NOT PHYSICALLY ACCEPTED.** Isolated branch `feat/dungeon-d04-combat-feedback-realism-20261108`; frozen BEFORE `281735d0910c6b2443648af976003d50412ee324`. No main, Draft PR #49, authority, rigs, camera, global lighting or other session changes.

## Real-world failure that triggered this repair

The successful authentic Dungeon Chrome workflow [43125363283](https://github.com/my-edutu/Ai_games/actions/runs/43125363283) passed **137/137 native tests**, production build, SHA-verified CC0 assets and real Chrome/Three.js smoke. Its genuine browser log reported `BROWSER_DECODE_UNVERIFIED`, `sameWindowMovingAV:false`, and `sampleSynchronized:false`.

Its downloaded and independently inspected artifact includes a real `dungeon-d04-real-canvas-original-sound.webm` (103,291 bytes). Local `ffprobe -count_frames` independently identified **one VP8 frame (688×397) plus an Opus audio stream** (91 decoded audio packets/frames per tool output). A genuine 5.5-second WebM and four observed submission/encoder frame requests do NOT establish multiple encoded moving frames. The original sound recording and positive PCM energy also do NOT prove D04 impact-onset synchronization.

More importantly, the existing same-window receipt-readback recording was independently reported as `RECORDED`, with **111,654 bytes of the real WebGL+original-soundstage source**, but the persistence function intentionally discarded it because moving video had not passed FFmpeg validation. This hid the most useful artifact for diagnosing video encoder starvation and sample alignment. Its separate synthetic 2D control was never genuine Dungeon footage and must not be used as a substitute.

## Test-first repair and implementation

- Introduce a strict, independent archival decision `shouldArchiveUnalignedOriginalReadback` in `tests/browser/dungeon-d04-av-evidence.cjs`, requiring the exact genuine readback source, `RECORDED` status, bounded WebM, single video/audio tracks, active original opted-in soundstage, post-primary serial capture, and bounded duration/bytes. This is **forensic storage permission only**, not motion/audio certification.
- Preserve those genuine bytes even when motion is unverified, under a distinct filename `dungeon-d04-real-webgl-readback-original-sound-UNVERIFIED.webm`. The existing `sameWindowAVWebm` remains null unless the established strict motion classifier passes. Never promote saved media to accepted gameplay audio/video on the basis of persistence.
- Retain explicit `unverifiedSameWindowAVWebm` in the manifest and return value, without storing base64 copies in JSON. Never persist unrelated synthetic control captures as Dungeon moving video.
- Add two test-first contracts to `tests/foundation/dungeon-d04-av-capture-evidence.test.cjs`: store valid genuine-looking forensic fixture without certifying motion; reject fabricated source, no audio consent, nonexistent tracks, bad phase, bytes or status.
- Save a bounded `artifacts/dungeon-d04-chromium-decoded-real-webgl-pixels.json` with the browser decoder's **actual failure reason** and separate unaligned classification. Previously it existed only as a Playwright attachment, not a file under the artifact collection. This aids source-level diagnosis without recording any private/synthetic material.

The first test-only commits preceded the implementation; intermediate GitHub Actions may be cancelled by D04-only CI concurrency. The latest candidate has a new CI run [43126416601](https://github.com/my-edutu/Ai_games/actions/runs/43126416601), queued when inspected. Do not claim the new persistence contract or fresh browser artifacts verified until that run completes.

## Ownership, safety, resource bounds, and limitations

Only D04 browser evidence utilities, D04 browser smoke, D04 native tests and this handoff changed. The legacy spectator is default; `?feedback=d04` remains opt-in. No changes to the genuine game source or frame submission path, audio engine, input, gameplay ticks, simulated outcomes, animation/rig, material or camera.

No additional gameplay draw calls, VFX instances, long-lived audio voices, buffers or WebGL objects. Forensic bytes are saved **only during D04 CI**, capped at 20MiB (matching existing original media budget), with original opt-in. Previous 7-pool / 104 instances / ≤7 draw calls, 8 voices, 400ms stale foley, deduplication, accessibility, and restart cleanup remain untouched.

**Important separation of proof:**
- Native contracts: mocked/synthetic bytes establish strict evidence-retention code paths, NOT actual VP8/Opus behavior.
- Authentic Chrome smoke: verifies the original Dungeon app did render and that WebM/audio tracks existed; does NOT establish synchronized combat audiovisual playback.
- Independent local `ffprobe`: verifies **one** encoded VP8 frame in the original 5.5s clip; this is a current *negative* moving-video result.
- No real-game three-viewpoint+390px *moving* comparison, complete Warden warning/release/recovery/counter, verified blade-tip contact, miss/block/dodge/projectile/spell, decoded impact PCM onset or 20-minute soak has been accepted.

## Next dominant weakness

Real WebGL frame submission delivers to browser compositor but **MediaRecorder encodes only one actual video frame** under this headless CI workload; the same-window readback source needs independent FFmpeg/Chrome inspection now that it is preserved. Diagnose actual after-submit pixel changes versus encoder/composition throttling. Preserve any sparse media honestly; never fake frames or relax the 400ms foley deadline to make A/V appear successful. Only after genuine moving frames exist should WebAudio sample-onset calibration against the HP-confirmed event and frame receipt be attempted. The wrist proxy is still not verified GLB blade-tip geometry.

**Rollback:** revert the readback forensic archival decision, test/attachment and report on the isolated D04 branch only. The normal spectator and authoritative game behavior will be unaffected.
