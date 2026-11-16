# D04 — Primary original Dungeon A/V pixel-decoder evidence (2026-11-16)

**Status: ISOLATED EVIDENCE IMPROVEMENT; NEW-HEAD GENUINE CHROME UNVERIFIED; COMBAT REALISM NOT ACCEPTED.**

Ownership: browser-only evidence capture, authenticated independent pixel decoder, and focused contracts. No authoritative `games/ai-dungeon/src`, character rigs, camera, lighting, scene rendering, sound recipes, shared soundstage, main, Draft PR #49, or other session branches changed. Legacy spectator remains default; D04 remains `?feedback=d04`.

## Actual failure observed before this change

Reviewed the completed original Chrome workflow [43778353650](https://github.com/my-edutu/Ai_games/actions/runs/43778353650) and its [45.6 MB evidence artifact](https://github.com/my-edutu/Ai_games/actions/runs/43778353650/artifacts/14187594248). Six real Dungeon camera/viewport recordings (cinematic/tactical/chase at 1440x900 and 390x844) retained 12 matched authoritative ticks including five shared HP-loss ticks, but **zero HP ticks with drawable injury in all six**. Four additional real comparisons passed their diagnostic contracts; the strict WebGL trial failed `AUTHENTIC_DAMAGE_NOT_VISUALLY_ADMITTED`. The old run recorded original opted-in VP8/Opus canvas/soundstage WebM, yet its **independent browser pixel classifier returned `BROWSER_DECODE_UNVERIFIED`** because it only read the *serial* readback encoder, which had no usable recording. No runner ffmpeg was available.

On the true tick-4 injury, observation-to-submission was 2000ms, including 1643ms in the renderer interval, versus 8ms in measured D04 visual work. That authentic sound was correctly refused as stale under the unmodified 400ms deadline. Other 57–107ms injuries had frame receipts, **not** decoded contact or synchronized audio. None of this attributes the multi-second renderer stall to D04.

## Implemented in this isolated branch

- Snapshot original soundstage track liveness and real user audio consent **at primary capture start**, then preserve those fields with the actual primary MediaRecorder WebM and frame-acknowledged pump record.
- When the separately recorded serial readback file is unavailable, submit the **existing unchanged primary real canvas + opted-in original soundstage WebM** to the existing browser-native Chromium seek/pixel decoder. No new recorder, redraw, synthetic game damage, audio node, or WebGL operation is started.
- Authenticate source, precise VP8/Opus MIME, one video and one original audio track, opt-in and live track, bounded bytes, genuine sequential frame acknowledgments and no failed frame requests. Reject synthetic 2D control footage, unconsented tracks, forged receipts, unsupported codecs, invalid counts and over-budget files.
- Keep the page-evaluated decoder's source checks **self-contained**: Playwright serializes the decoder alone, not its Node module-level functions. An independent read-only classification retains `BROWSER_DECODED_MOVING_PIXELS_UNALIGNED` only for multiple valid sampled pixel signatures; never claim sample sync, decoded-frame count, PTS, actual blade contact or audible original PCM onset. Separate serial and primary diagnoses are retained.

Changed files:
`tests/browser/dungeon-d04-decoded-video-proof.cjs`,
`tests/browser/dungeon-physical-feedback-preview.spec.cjs`,
`tests/foundation/dungeon-d04-readback-decoder-proof.test.cjs`.

## Verification and truthful limitations

A direct V8 runtime fetched both historical and corrected GitHub source: historical head `337c8f0` rejected the genuine-primary fixture as `BROWSER_DECODE_UNVERIFIED`; corrected source classified the SAME deliberately synthetic contract fixture as `BROWSER_DECODED_MOVING_PIXELS_UNALIGNED` **without** claiming sync. Parsed all three changed files and executed 13 targeted pure assertions covering consent, source, soundtrack, frame accounting, codec, byte budget, and standalone page-realm sampler behavior. This was **isolated source contract execution, not the repository Node runner, WebGL playback, or review of newly decoded pixels**. The focused regression was committed before production changes, but an independent failing-red CI test was not observed.

The coding tunnel was unavailable ("Tunnel-client has not been seen for 300 seconds"). GitHub connector could inspect and safely commit to D04; the available connector did not expose a workflow-dispatch method. No native/build/real-Chrome tests ran on this new branch head in this run. Prior native 391/391 and build pass belong **only** to earlier GitHub Actions run 43778353650, whose browser acceptance was red.

## Next dominant weakness

Collect a new-head genuine browser run; determine whether PRIMARY original WebM now yields changing *decoded* pixels in the same audio capture. Even if it does, verify moving injury/contact across all six viewpoints with decoded original PCM onset, complete actual missed swing/block/dodge/projectile/spell and Warden warning/release/recovery/earned counter footage, and perform the 20-minute cleanup soak. The dominant authentic visual defect remains late WebGL frame delivery and missing universally drawable HP injury: refer broader render submission stalls to that session's owner, without editing their code or stretching D04's 400ms gate.

Release/rollback: keep legacy spectator default and experimental switch `?feedback=d04`; revert these three test/evidence files only if the isolated decoding path regresses. Seven GPU pools, at most 104 instances and seven VFX draws, eight original foley voices, bounded receipts, opt-in/mute, reduced motion/flash, deduplication, cleanup and 400ms submission constraints are unchanged.
