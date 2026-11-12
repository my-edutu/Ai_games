# D04 — Authentic WebM video packet PTS without FFprobe (12 November 2026)

**Gate: IN PROGRESS / NOT PHYSICALLY ACCEPTED / DO NOT MERGE.**
Only isolated branch feat/dungeon-d04-combat-feedback-realism-20261108. Frozen BEFORE 281735d0910c6b2443648af976003d50412ee324. Legacy spectator remains default, D04 remains opt-in ?feedback=d04. No authority or other-session edits.

## Dominant observed defect

Successful real Chrome/Three.js workflow [43126416601](https://github.com/my-edutu/Ai_games/actions/runs/43126416601) reported "Chromium could not decode WebM metadata", but the actual preserved WebM *does* contain decodable video. I downloaded artifact 13902104113 and independently inspected its unchanged genuine receipt-gated WebGL+original opt-in audio recording with FFprobe/FFmpeg.

- Genuine VP8: **3 video frames**, 640x400, packet times **1.830, 2.648, 3.441 seconds**.
- Genuine Opus: **97 decoded audio packets**. This does not demonstrate contact-onset synchronization.
- Same recording shows **10 real renderer-receipt-gated frame requests** (receipts 24–33), no request exceptions, and changing actual readback pixel signatures. Only three frames reached encoded VP8.
- Independently decoded VP8 pixels genuinely differ: 17.8% of pixels change by >8/255 between the first and second frame; 16.1% between second and third.
- The separate original canvas+audio recording has **2 encoded VP8 frames** despite 5 successful requests. Playwright compositor video is genuine gameplay but video-only.

Thus the current dominant issue is **encoded-frame starvation**, not complete absence of moving source frames. Sparse encoded packets do not qualify as smooth combat playback. Earlier one-frame findings remain true for their original earlier runs.

## Test-first changes

- New tests/browser/dungeon-d04-webm-pts-proof.cjs: bounded read-only EBML TrackEntry and Cluster/SimpleBlock parser, including unknown-size MediaRecorder clusters, Matroska TimestampScale and exact video packet PTS. No FFprobe dependency.
- Exact genuine WebGL+original soundstage provenance; opt-in and live audio track required. Rejection of fabricated sources, missing tracks, invalid bytes, laced video, impossible or nonmonotonic packet times.
- A separate classifyEncodedFrameYield checks actual acknowledged frame-request counts. It never upgrades encoded video packets to proven moving pixels or sample-synchronized foley.
- Five synthetic native parser tests (not gameplay media). The isolated workflow executes them.
- Authentic preview stores the independent webmPacketTiming and encodedFrameYield results in its existing WebM diagnostic JSON alongside the separate Chromium decoder verdict.

**Expected red**: [43132853990](https://github.com/my-edutu/Ai_games/actions/runs/43132853990) had 139 passes and five new expected failures against deliberately unimplemented parser. [43133244952](https://github.com/my-edutu/Ai_games/actions/runs/43133244952) had 142 passes and two fixture failures because mocked video bytes fell below the intentional >1KiB minimum; fixtures were corrected.

**Final candidate**: [43133366803](https://github.com/my-edutu/Ai_games/actions/runs/43133366803). Its native contract job was successful when checked; its authentic browser job had not finished when this handoff was composed. Do not claim green browser packet evidence until a completed artifact is inspected.

The local Node prototype of the same parser independently extracted three authentic VP8 packet times from the archived original WebM, matching FFprobe, yielding SPARSE_ENCODED_VIDEO_PTS_UNALIGNED. Its file-fixture tests demonstrate parsing only, not game video quality.

## Scope and budgets

Only isolated D04 browser evidence, native tests, its workflow and this handoff. No modifications to games/ai-dungeon/src, global rendering, rigs, camera, lighting, sound synthesis or other branches. No gameplay changes, authored hits or audio imports. No new draw calls/visual pools, voices, or timers; parser runs offline after capture, bounds input to 20 MiB, 25,000 EBML elements, 4,096 blocks and depth 12. Existing 400ms audio staleness gate, opt-in, mute, reduced flash/motion, deduplication and cleanup remain intact.

## Next dominant weakness

Trace why actual readback requests 4–10 are not followed by encoded video packets under slow software WebGL. Compare encoder chunk timestamps, video-track delivery and bounded serial recording on a GPU-capable browser. Preserve media and event clocks; do not pad video with fabricated frames or relax sound deadlines.

Three matched moving views, 1440x900/390x844 mobile A/V, genuine miss/block/dodge/projectile/spell and actual HP loss, complete Warden warning/release/recovery/counter, decoded original impact onset, twenty-minute soak and frozen BEFORE independent critique remain unaccepted.

Rollback: revert only the new forensic parser, its contracts, spec report additions, workflow registration and this handoff on the isolated D04 branch. Never merge to main or Draft PR #49.

## Completed integration verification — later same-day evidence

The final integrated candidate [43133366803](https://github.com/my-edutu/Ai_games/actions/runs/43133366803) finished **SUCCESS**: **144/144 native tests**, production build, SHA-verified CC0 models and the real Chrome/Three.js Dungeon Playwright smoke all passed.

The **new** authentic artifact [13906770498](https://github.com/my-edutu/Ai_games/actions/runs/43133366803/artifacts/13906770498) contains the original genuine readback WebGL + live opted-in Opus WebM (not a generated animation). The added pure-Node EBML PTS probe ran inside GitHub CI and reported **9 encoded video blocks** at **0.836, 1.269, 1.720, 2.159, 2.619, 3.053, 3.492, 3.950, 4.392 seconds**, from **15** genuine receipt-gated frame requests, with sampleSynchronized:false, pixelMotionVerified:false and audibleImpactVerified:false.

I independently downloaded that artifact and verified **9 VP8 frames + 99 Opus audio packets** using a separate local FFprobe. Local FFmpeg decoded all nine genuine 640x400 frames. Consecutive pictures show real changed pixels (8/255 threshold), pairwise **16.39%, 13.58%, 13.86%, 15.22%, 8.99%, 12.50%, 11.74%, 10.76%** of the frame. These percentages describe *pixel differences in the actual recording only*, NOT a realism rating, verified blade contact, a full continuous frame rate, or combat cue sample synchrony.

The separate original real-WebGL receipt-readback video-only path encoded only **3 frames** in the same run. The Chromium HTMLVideoElement seek fallback still reported BROWSER_DECODE_UNVERIFIED; the Node packet probe and independent FFprobe agree on the nine captured blocks despite this fallback failure. Playback remains too sparse and original foley onset cannot be proven from the Opus packet count alone. The specific next bottleneck is the **6 receipt requests without corresponding encoded packets** in the 15-request combined readback run and calibrating delivery/media timebases before contact-onset claims. No more work on unrelated sessions is authorized by this result.
