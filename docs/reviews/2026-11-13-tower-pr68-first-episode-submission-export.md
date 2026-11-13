# P0 — preserve genuine first-episode GPU doorway diagnostics (13 November 2026)

**Leading verdict: NOT EVALUATED; P0 OPEN.** Frozen playable baseline: `1731b380851162741761c5569e2bc152a0869ca9`. Inspected PR68 head: `80a87f43c3995624b739c136ca8e946a1e52d2d9`. No PR58 or baseline changes.

## Directly inspected original-gameplay evidence

The exact-source [nine-job recording](https://github.com/my-edutu/Ai_games/actions/runs/43428237425) completed all eight real 60+s baseline/candidate movies. Source-event pairing still **failed 0/2 viewports**. The representative prior normal-speed original footage shows the hard bronze Floor8 → violet Floor9 camera/world discontinuity at approximately 24–26s. The real source does record guardian defeat and grounded progression, but that is not a video acceptance result.

In the newly inspected 80a87f43 capture, first **browser-accepted** Floor9 snapshot was tick451 (desktop) / tick452 (portrait); first **returned Three.js WebGL frame** was tick459 / tick457. The desktop first F9 GPU return cost 463.3ms (564ms scene+render); portrait GPU return 100.2ms (163.3ms scene+render). This 8-/6-tick sampling gap is a credible competing systemic cause of the missing continuous physical passage. Renderer return is *not* proof of an actual encoded native frame.

## Verified blocker and implementation

The source renderer already exposed `physicalDoorwaySubmissionAudit.frames`: one source-owned returned-WebGL projection per distinct tick, containing original GPU gate ownership, full hero projection, real original gateway projection, occlusion-core rays, lens eligibility and actual camera azimuth. But the real Playwright recording sampled only `d.world.retainedSourceCap` once per second and **never extracted the new rolling audit** into any artifact. Consequently, the last run could not establish whether the gateway vanished from the scene, fell outside the camera, or remained projected but was masked in WebM pixels.

This change connects the existing passive audit to the actual unmodified WebM recording harness and saves `physical-doorway-submissions.json` for BOTH viewports. A bounded, tested first-episode reducer deduplicates genuine returned frames by `runToken:crossingTick:sourceTick`, preserves the first crossing even when the same 60+s video contains a second post-restart crossing, and explicitly differentiates missing GPU owner, projected off-camera gate and solid core-ray obstruction. A projected-safe gateway is **not** deemed a native-video pass. No renderer update, invented screenshot, source tick manipulation, presentation interpolation, replay change or additional camera pass.

Exact-head [quality](https://github.com/my-edutu/Ai_games/actions/runs/43428237435) was RED: phase3-0 and phase3-2 contained stale source-regex expectations (camera `dt` versus intentionally correct `cameraDt`, optional crossing witness); these contracts have been reconciled without weakening runtime checks. Phase3-3 lost its hosted runner while executing `tower-retained-source-cap-world.test.cjs`; this does **not** count as passing.

## Acceptance still missing

New immutable-source 960×600 and 390×844 original 60+s native footage and saved first-episode audit have not been run on this commit. Demand same bronze original doorway, actual full-body character through opening, physically continuous Floor9, complete result and restart, source/PTS match and satisfied real-device frame-time/memory gates. Independent randomized blind critics LOOKS 0/5 · FEELS 0/5 · PLAYS 0/5. Next highest-impact action is to use the exported per-source-frame projection and native video to distinguish first-F9 GPU backlog from actual gate occlusion, then fix the *responsible physical renderer/camera subsystem*; another unobserved fade is not warranted.

PR68 stays open/draft on PR58, with no deployment/merge/force push/other-game edits.
