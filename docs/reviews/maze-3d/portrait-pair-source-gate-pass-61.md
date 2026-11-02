# Pass61 — native portrait pair camera: real image rejection, corrected composition candidate (2026-11-02 UTC)

## Fixed art comparison and acceptance

**NOT PASSED.** Fixed primary art bar: genuine Nintendo [Captain Toad: Treasure Tracker official gameplay](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/), with Luigi's Mansion 3 and ASTRO BOT only supporting. This is a real source-and-render review, not a game-quality victory.

## Evidence: Pass60b rendered zero visible change

The existing head before this pass was `31a4f8bcf00a6451dfdffd32afc3e7df5d6286a1` (Pass60b game source `3cfd2e`). I downloaded the actual CI [Pass60b screenshot artifact 13106295383](https://github.com/my-edutu/Ai_games/actions/runs/41361814299/artifacts/13106295383) from [successful exact-source visual run 41361814299](https://github.com/my-edutu/Ai_games/actions/runs/41361814299). It contains **10 original production Playwright WebGL PNGs**, each with a dated source-hash/PNG-hash JSON sidecar. Independently recomputed SHA-256 hashes matched **all 10/10** sidecars. Captures were made **2026-11-01 23:36:07–23:37:05 UTC**, including actual seeded tick-13 guardian shots in 1280×900, 390×844, 320×740 and 844×390. No screenshots were invented, resized into acceptance, or presented as hardware-GPU FPS.

I separately downloaded independently hashed [Pass59 actual source-bound artifact 13105020624](https://github.com/my-edutu/Ai_games/actions/runs/41359791341/artifacts/13105020624) (**10/10 verified**). **All ten Pass60b PNGs are bit-for-bit identical to their corresponding Pass59 PNGs** (same native resolutions, same seed/tick, zero changed RGB values). In particular:
- 320×740 guardian: both dates SHA-256 `51edceae6a103a900b548d459df5a96ea2607172cce39aed25566e82d4805bbf`.
- 1280×900 encounter: both dates SHA-256 `fee5884c6190a82e54cb85a913c1574f8eb3f94a1e9480a15343d47d8bfdd8ef`.
- 844×390 guardian: both dates SHA-256 `f78a14d29992bbaa993434efdf3d5088325fb366e4fd013f4fb6ac31d3fe5222`.

**Direct rendered-image critic verdict: REJECT Pass60b as a visual improvement.** Its safety-only portrait zoom helper may be mathematically valid on a nearby synthetic unit pair, but on the actual scene it yields the old native composition. In real 320×740, Pip and Thornback are present with whole visible bodies, and the bottom captions, four 44px actions, low-text goal and full-screen stage are present; nevertheless both models occupy small portions of the screen and the relationship is dramatically weaker than the fixed Nintendo diorama. The 1280×900 render has clearer silhouettes but still repetitive courtyard tiling and no legible physical consequence to the guardian approach. A green visual pipeline does not establish an artistic gain.

## Builder response to the actual gap

The public-only Follow focal weight was only `publicAttention*0.22` on every viewport. On a tall full-viewport phone, one actor remains far off-center and the full-physical-silhouette 1.35-unit reserve often vetoes any tighter shot. Instead of **lowering the physical in-frame threshold** or inventing actors, builder source commit [e53d01c](https://github.com/my-edutu/Ai_games/commit/e53d01c1d07653f4bbb0c9abb8cd14fb13023fe8) allows at most **46% focus transfer toward the already disclosed real guardian** when the aspect is 0.35–0.60, only in active Follow and only with nonzero public guardian attention; desktop, landscape, result, undisclosed and other camera cases keep their original values. Actual modeled pair/transition zoom guard remains unchanged. Regression commit [e2fe24c](https://github.com/my-edutu/Ai_games/commit/e2fe24cccd5cf0fa8ebd8bfed88b92fc6bb2e7a0) asserts the 320/390 pair bound, landscape/desktop neutrality, invalid pathological aspect, no-threat state and terminal reset without weakening older camera, viewport, privacy or 44px checks.

**This newer Pass61 source remains a visual candidate, not a verified improvement** until its own original 320/390/844/1280 WebGL PNGs and actual full-model in-frame margins are reviewed. Reject any cropped claw, helmet or stage action, and compare all actual source-bound pixels against Pass60b/Nintendo. A focus shift by itself is not a Gauntlet win, even if render CI passes.

## Wider CI and review independence

On the prior `31a4f8b` head, the [full monorepo CI run 41361814290](https://github.com/my-edutu/Ai_games/actions/runs/41361814290) failed **3 unrelated Tiny Kingdom browser checks** (two shader version expectations `procedural-060` versus actual `procedural-063`, and a river tint source-count expectation of two versus actual one). The Game 2 native browser smoke, WebGL evidence, low-text HUD, public privacy, recovery and viewport tests in that same suite **passed**. Do not state whole CI passed, or alter another game's acceptance to hide the failures.

Fresh-context subagents and Ultracode could not be used because the shared workspace tunnel returned `Tunnel-client has not been seen for 300 seconds`; this review was direct and unblinded, **not an independent critic / blind A/B victory**. Shared SwiftShader was CPU-throttled; its frame timings cannot establish a shipped-hardware defect or real hardware GPU performance. PR #53 stays **OPEN DRAFT**. No merge or deploy.

Next independent gate: exact `e2fe24c` source-bound native 320/390/844/1280 renders, both model silhouettes with real margins through transition, screenshot-based comparison versus original Nintendo, then invest in physically legible and causally animated authored set pieces.
