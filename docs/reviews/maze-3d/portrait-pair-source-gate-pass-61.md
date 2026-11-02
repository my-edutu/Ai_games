# Pass61 — real native Follow camera screenshots and honest mode-matched visual review (2026-11-02 UTC)

## Fixed art comparison and acceptance

**NOT PASSED.** Fixed primary art bar: genuine Nintendo [Captain Toad: Treasure Tracker official gameplay](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/), with Luigi's Mansion 3 and ASTRO BOT only supporting. This is a real source-and-render review, not a game-quality victory.

## Evidence: previous captures were Detail-only; Follow visual verdict was unknowable

The existing head before this pass was `31a4f8bcf00a6451dfdffd32afc3e7df5d6286a1` (Pass60b game source `3cfd2e`). I downloaded the actual CI [Pass60b screenshot artifact 13106295383](https://github.com/my-edutu/Ai_games/actions/runs/41361814299/artifacts/13106295383) from [successful exact-source visual run 41361814299](https://github.com/my-edutu/Ai_games/actions/runs/41361814299). It contains **10 original production Playwright WebGL PNGs**, each with a dated source-hash/PNG-hash JSON sidecar. Independently recomputed SHA-256 hashes matched **all 10/10** sidecars. Captures were made **2026-11-01 23:36:07–23:37:05 UTC**, including actual seeded tick-13 guardian shots in 1280×900, 390×844, 320×740 and 844×390. No screenshots were invented, resized into acceptance, or presented as hardware-GPU FPS.

I separately downloaded independently hashed [Pass59 actual source-bound artifact 13105020624](https://github.com/my-edutu/Ai_games/actions/runs/41359791341/artifacts/13105020624) (**10/10 verified**). **All ten Pass60b PNGs are bit-for-bit identical to their corresponding Pass59 PNGs** (same native resolutions, same seed/tick, zero changed RGB values). In particular:
- 320×740 guardian: both dates SHA-256 `51edceae6a103a900b548d459df5a96ea2607172cce39aed25566e82d4805bbf`.
- 1280×900 encounter: both dates SHA-256 `fee5884c6190a82e54cb85a913c1574f8eb3f94a1e9480a15343d47d8bfdd8ef`.
- 844×390 guardian: both dates SHA-256 `f78a14d29992bbaa993434efdf3d5088325fb366e4fd013f4fb6ac31d3fe5222`.

**Important correction to the earlier review:** The 10/10 Pass59 and Pass60b captures ARE real, source-bound and bit-identical, but the Playwright source in `tests/browser/maze-review.spec.cjs` unambiguously opens `/maze?camera=detail&reducedMotion=1`. Its original ten shots all remained in **Detail**, whereas Pass60b modified the **Follow** camera exclusively. Therefore zero pixel differences do NOT mean Follow zoom had no effect. Our earlier claim that the Follow candidate was rendered/rejected by those frames was not supported. This was a genuine evidence coverage gap, now corrected without deleting, weakening or replacing the original Detail acceptance. The images still show a relatively weak actor/action hierarchy against Nintendo and do not prove quality parity.

## Builder response to the actual gap

The public-only Follow focal weight was only `publicAttention*0.22` on every viewport. On a tall full-viewport phone, one actor remains far off-center and the full-physical-silhouette 1.35-unit reserve often vetoes any tighter shot. Instead of **lowering the physical in-frame threshold** or inventing actors, builder source commit [e53d01c](https://github.com/my-edutu/Ai_games/commit/e53d01c1d07653f4bbb0c9abb8cd14fb13023fe8) allows at most **46% focus transfer toward the already disclosed real guardian** when the aspect is 0.35–0.60, only in active Follow and only with nonzero public guardian attention; desktop, landscape, result, undisclosed and other camera cases keep their original values. Actual modeled pair/transition zoom guard remains unchanged. Regression commit [e2fe24c](https://github.com/my-edutu/Ai_games/commit/e2fe24cccd5cf0fa8ebd8bfed88b92fc6bb2e7a0) asserts the 320/390 pair bound, landscape/desktop neutrality, invalid pathological aspect, no-threat state and terminal reset without weakening older camera, viewport, privacy or 44px checks.

## True active Follow camera: tested, real WebGL and directly inspected

The [new browser-source capture commit e19b411](https://github.com/my-edutu/Ai_games/commit/e19b411524aad1a6fba452b10af6e1e7a9911d79) preserves all 10 original Detail screenshots and gates, then clicks the **actual on-screen camera control Detail → Follow** on the same warm real tick-13 production page. It saves **four additional full-resolution native Follow images** (390×844, 320×740, 844×390 and 1280×900) with original dated UTC/image SHA-256/source hashes and checks full model/body margins and 44px accessible controls. No invented guardian, hidden map, separate artificial renderer or cropping workaround.

**Exact Follow source evidence:** [visual GitHub workflow 41365657664](https://github.com/my-edutu/Ai_games/actions/runs/41365657664) **SUCCESS**, [original 14-PNG artifact 13106559848](https://github.com/my-edutu/Ai_games/actions/runs/41365657664/artifacts/13106559848). Independently recomputed original PNG hashes match **14/14** respective sidecars. All four Follow snapshots are dated **2026-11-02 00:10:57–00:11:08 UTC**, and their `map-view.mjs` SHA-256 is `355f79289f6416866917adea9ad3344ccbdaf32c43d7d150e0ac22a35664d6a7`.
- Native **320×740 actual Follow** `guardian-follow-320-portrait.png`, 00:10:59.738 UTC, image SHA-256 `58bfd74600f8d093fa9261e321247aad0ba62b455566085f9740cd3aa0297877`. Full 320×740 physical stage; `explorerInFrame=true`, `wardensWithMargin=1`, `explorerProjection.x=-0.5642`, `cameraHalfHeight=9.2645`, 44px controls in frame.
- Native **390×844 Follow** `guardian-follow-390-portrait.png`, 00:10:57.006 UTC, image SHA-256 `5763359565f0cc44fc788c04c9065ed9b3e1cddf3ae0d5f92839cddc2c1355bc`, full stage, actors uncropped, half-height `8.6700`.
- **844×390 landscape Follow** `guardian-follow-844-landscape.png`, 00:11:02.490 UTC, SHA-256 `8963af5d3c5ca71971b464c0cf76bc8f7c253ecfe6d899fb443744263cbc6fbb`, full stage, both actors with margin, half-height `7.3`.
- **1280×900 desktop Follow** `guardian-follow-1280-desktop.png`, 00:11:08.013 UTC, SHA-256 `477dbf956810cc242fe93b90c5a9c6ab44fcf8d7f28a55b1ff0fe1a401b2e62c`, full stage, both actors with margin, half-height `7.3`.

**Direct unblinded image critic:** New true Follow 320px image visibly centers the actual pair's shared courtyard rather than mislabeling a Detail image; Pip/Thornback and floor are present and uncropped, low-text actionable HUD sits in the corners with an event caption, and no footer swallows the 3D stage. Same-source Detail at 320 has half-height `9.8859375` versus Follow `9.2645061` (around **6.7% larger on-screen objects** under that camera-mode comparison, not a previous-versus-current Follow A/B). At 390, Detail `9.25154` vs Follow `8.66999`; this is a **modest camera composition improvement candidate**, *not* evidence that Pass61 outperforms earlier Follow source—there is no prior same-mode image to compare. Original Nintendo Captain Toad **still wins decisively** on scale/readability, distinctive authored focal environments and legible reactive cause/effect. No independent fresh-context critic or blind A/B available.

## Required next art gate

Capture **prior and current source in the same Follow mode** for a legitimate before/after camera A/B and test moving/turning positions throughout the easing, plus improved original fully modeled guardian/Pip acting and environmental storytelling. Do not claim visual gauntlet victory from source hashes or a green CI pipeline.

## Wider CI and review independence

On the prior `31a4f8b` head, the [full monorepo CI run 41361814290](https://github.com/my-edutu/Ai_games/actions/runs/41361814290) failed **3 unrelated Tiny Kingdom browser checks** (two shader version expectations `procedural-060` versus actual `procedural-063`, and a river tint source-count expectation of two versus actual one). The Game 2 native browser smoke, WebGL evidence, low-text HUD, public privacy, recovery and viewport tests in that same suite **passed**. Do not state whole CI passed, or alter another game's acceptance to hide the failures.

Fresh-context subagents and Ultracode could not be used because the shared workspace tunnel returned `Tunnel-client has not been seen for 300 seconds`; this review was direct and unblinded, **not an independent critic / blind A/B victory**. Shared SwiftShader was CPU-throttled; its frame timings cannot establish a shipped-hardware defect or real hardware GPU performance. PR #53 stays **OPEN DRAFT**. No merge or deploy.

Next independent gate: same-seed before/after **Follow-versus-Follow** captures with genuinely equivalent source snapshots; physical moving encounter coverage; independent fresh-context comparison with official Nintendo and substantive original actor/environment acting.
