# Game 2 Gauntlet — passes 20–21: real sealed-gate encounter at gameplay scale

**2026-10-31. Status: exact-source functional CI passed; visual benchmark remains NOT PASSED.** This review compares genuine production public snapshots (seed `maze-visual-reference-13`, tick **21**, actual disclosed closed gate `door-2`) against the pass-19 baseline and the fixed official Nintendo Captain Toad: Treasure Tracker image references in [reference-manifest.json](./reference-manifest.json). There is **no new independent critic or blind A/B verdict**: the shared-workspace tunnel rejected the actual subagent invocation with `Tunnel-client has not been seen for 300 seconds`. Ultracode was likewise inaccessible. This is a lead-only direct native-image assessment; it does not close the fixed reference gate.

## Small independently judgeable slices

1. **Increase game-scale subject readability without inventing state** — [pass-20 source 9130a35](https://github.com/my-edutu/Ai_games/commit/9130a35b5b8fd7f0b9caf2766effd990687294e0) reduces genuine nearby sealed-gate camera half-height from 5.65 to **5.05 desktop**, and 5.8 to **5.42 portrait**; tighter browser assertions require both actual gate and Pip to remain visible with normalized x margin <0.8. Gameplay authority, RNG, route legality, door status, map discovery, AI movement and public snapshots are unchanged.
2. **Restore arch visibility after the closer shot** — independent of the zoom, [pass-21 source 2d3e08d](https://github.com/my-edutu/Ai_games/commit/2d3e08da44c87ecefe9f29ed4a6558957559c5ba) raises the camera's aim by 0.36 world units *only* when the current public follow view has a genuinely known sealed gate. The 3D arch top was cropped in the authentic pass-20 desktop render.
3. **Actual-output checks** — both passes ran identical production seed/tick on desktop 1280×900 and portrait 390×844, not a synthetic illustration or manipulated authority frame. The exact screenshots and their unaltered source-bound JSON diagnostics live in the original GitHub CI capture artifacts.

## Source-bound evidence and comparison

| Check | Pass 19 baseline | Pass 20 zoom | Pass 21 arch lift |
| --- | --- | --- | --- |
| Source / CI | [41189735556](https://github.com/my-edutu/Ai_games/actions/runs/41189735556) | [41192941034](https://github.com/my-edutu/Ai_games/actions/runs/41192941034) | [41193675854](https://github.com/my-edutu/Ai_games/actions/runs/41193675854) |
| Original CI capture artifact | [13038422543](https://github.com/my-edutu/Ai_games/actions/runs/41189735556/artifacts/13038422543) | [13039528453](https://github.com/my-edutu/Ai_games/actions/runs/41192941034/artifacts/13039528453) | [13039268530](https://github.com/my-edutu/Ai_games/actions/runs/41193675854/artifacts/13039268530) |
| Desktop screenshot captured UTC | 2026-10-31T09:49:38.913Z | 2026-10-31T10:36:47.933Z | **2026-10-31T10:44:14.289Z** |
| Desktop PNG SHA-256 | `3b1fe041889964c3699f7ecb2d5622c52ba17437a2764a73c0de220c1b2627e3` | `008cf0fe9db812893b8a8e5c34aba975f4451446dc1de1528d0124aa71e37653` | **`175dbe92880684723408b93a717c681095099b546c79b9fc66cfc05d923b9d9e`** |
| Portrait screenshot captured UTC | 2026-10-31T09:49:42.604Z | 2026-10-31T10:36:51.666Z | **2026-10-31T10:44:16.172Z** |
| Portrait PNG SHA-256 | `02549d09399f24c55ef5bab262103065e1ea5fb589ad6b7fa70fd7957bb075ac` | `bf059e090f8081a8cdfaaefd11aaea27f9b52d6a3cce471383e9f90321810b97` | **`49579cd2af952d74ea1da6f50ed4f6779ca1ebc06afe9f246182fcb1a7c99f18`** |
| Camera half-height desktop / portrait | 5.65 / 5.80 | 5.05 / 5.42 | **5.05 / 5.42** |
| Actual gate x (normalized device space), desktop / portrait | -0.38868 / -0.45710 | -0.43486 / -0.48914 | -0.43486 / -0.48914 |
| Actual Pip x (NDC), desktop / portrait | -0.25713 / -0.21496 | -0.28767 / -0.23003 | -0.28767 / -0.23003 |
| Crude water-like fraction of identical fixed cropped pixels, desktop | 47.103% | 42.186% | **44.874%** |
| Crude water-like fraction, portrait | 31.464% | 28.632% | **31.137%** |

All **pass-20 and pass-21 screenshot file SHA-256s were recomputed from original ZIP bytes** and equal their CI manifests. The fixed crude water-like mask on gameplay crops desktop (x30..977,y99..815), portrait (x13..377,y65..586) is: R<100; 90<G<180; 95<B<180; G>1.4R; B>1.2R. This is a consistent area proxy, **not** a scene/art-quality score. It measures a camera trade-off; the pass-21 lift recovers arch but returns more empty water.

## Visual verdict on inspected actual render

Pass 20 visibly makes Pip and the crossed coral barrier larger, but crops the upper arch. Pass 21 makes more of the authored arch legible in actual desktop and phone captures and keeps both actual obstacle and explorer in frame, but both remain grouped on the left with a large, visually undifferentiated lagoon. The essential physical causal relationship (where Pip can go, why the gate is blocked, and what action the key enables) is not independently obvious without the HUD. On visual hierarchy, authored scene richness, expression and immediate playability, the **real Nintendo Captain Toad reference still wins overall**. No blind A/B or five-uninstructed-viewer comprehension gate was completed.

## Technical verification and unresolved constraints

[Exact-source CI 41192941034](https://github.com/my-edutu/Ai_games/actions/runs/41192941034) and [final source CI 41193675854](https://github.com/my-edutu/Ai_games/actions/runs/41193675854) both passed build, **524/524 Node tests, 25/25 browser checks**, four host self-tests, nondeterminism scan and real browser evidence. The final source's new browser assertions verify both hero and gate are in frame with x margin, but **tests cannot prove benchmark parity**. Software-rendered SwiftShader frame timings on the CPU-throttled CI host do not represent hardware GPU FPS and are not evidence of a product defect by themselves.

**Next judged slices:** make the public known key → genuinely closed gate relationship readable in the same sequence and improve gate/barrier silhouette/acting; restore a purposeful stage/lagoon visual hierarchy; use separate fresh-context critics on real same-seed desktop/portrait captures plus unchanged pinned Nintendo images whenever workspace reconnects. Compare source-bound gameplay imagery and behavior rather than mockups. **PR remains draft, not merged, not deployed.**
