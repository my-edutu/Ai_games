# Game 2 Gauntlet pass 19 — genuine sealed-gate/hero recentering evidence

**Status: small measured on-screen repositioning, with a visible water/scene trade-off. Fixed Captain Toad benchmark remains NOT PASSED.** [Draft PR #53](https://github.com/my-edutu/Ai_games/pull/53) stays open, unmerged and undeployed.

## Source and complete test result

- Camera implementation [`396ceb6`](https://github.com/my-edutu/Ai_games/commit/396ceb6f46a6d359825c4d8eeb5c191208b7aad8) changes the balance of *previously disclosed* coastal terrain and a *physically modeled, previously disclosed closed gate*, with its existing desktop/portrait offset bounds. Regression [`384f7b2`](https://github.com/my-edutu/Ai_games/commit/384f7b25917d08bc8abf7e2daa5c1b730bfb07a6) checks reduced extreme terrain-only displacement with stage retention. No AI policy, RNG, map discovery, movement, gate status or route was changed.
- [Exact-source Autonomous Games CI 41189735556](https://github.com/my-edutu/Ai_games/actions/runs/41189735556) **completed successfully**: **524/524 Node tests**, **25/25 real Playwright browser checks**, build, four stream-host self-tests, authoritative nondeterminism scan, evidence generation. Three same-source Eko workflows also completed successfully. This proves technical regression coverage, **not** art-quality parity.
- [Original real source-bound artifact 13038422543](https://github.com/my-edutu/Ai_games/actions/runs/41189735556/artifacts/13038422543) was downloaded and both native PNGs and JSON manifests decoded and SHA-256 matched; each was taken on the **unaltered production public** `maze-visual-reference-13` seed, tick **21**, actually closed disclosed `door-2`, with one physically rendered closed gate and the explorer on screen. Screenshot source hashes changed only for `map-view.mjs`: `762def547abeac61c4f413349750f60b336cbdec0747bf79199163afc0668042`; `scene.js` remained `9c1fce4d58b54b63835eacabb3a1d8e5b4c8ee4356697986d757bf54f0c3145b`.

| Real source-bound frame | Previous pass 18 | New pass 19 |
| --- | --- | --- |
| Desktop 1280×900 capture UTC | 2026-10-31T08:37:09.971Z | **2026-10-31T09:49:38.913Z** |
| Desktop PNG SHA-256 | `cea444431f35ff409c32b67aefe447c4231fca9aad73dfa3722d601d8f16c9b6` | **`3b1fe041889964c3699f7ecb2d5622c52ba17437a2764a73c0de220c1b2627e3`** |
| Desktop closed gate normalized x | -0.45917 | **-0.38868** |
| Desktop Pip normalized x | -0.32761 | **-0.25713** |
| Portrait 390×844 capture UTC | 2026-10-31T08:37:13.673Z | **2026-10-31T09:49:42.604Z** |
| Portrait PNG SHA-256 | `3cca0e4f13367a5b8ec4c5fb1622c7419c841016aeebf662fc347d5c402ed058` | **`02549d09399f24c55ef5bab262103065e1ea5fb589ad6b7fa70fd7957bb075ac`** |
| Portrait gate / Pip normalized x | -0.48518 / -0.24304 | **-0.45710 / -0.21496** |

## Direct native-image critique — honest trade-off

I inspected the full real pass18 and pass19 desktop and portrait images at native size. The known sealed gate and Pip move **0.07049 normalized units right on desktop** and **0.02808 on portrait**, keeping both actual subjects in the frame. This is visible but modest: it does not make the gate/next action instantly understandable without the sidebar.

A fixed, crude turquoise-like color mask over the **same** desktop gameplay rectangle (x=30..977, y=100..814) puts water-like area at **46.413% → 47.064%** (+0.651 percentage points); left-third water-like pixels rose **60.389% → 67.398%** (+7.009 points). Portrait water-like pixels on the same x=13..376, y=95..616 crop rose **26.449% → 27.030%**. The exact simple RGB mask uses R<100, 90<G<180, 95<B<180, G>1.4R and B>1.2R. This is a reproducible scene-occupancy proxy, **not a perceptual-art score**. Recentring the actors therefore costs some of pass18's scene occupancy.

**Lead-only verdict:** a small composition correction is source-verified, but a distinct and physical blocked-gate interaction, stronger authored environment, expressive character acting and the fixed [Nintendo Captain Toad imagery](./reference-manifest.json) remain superior. No benchmark win or independent blind A/B can be claimed. [Pass-19 review-gate checklist](./gate-composition-pass-19-review-gate.md) still needs separate fresh-context critique.

## Next smallest pieces

Preserve the real actor/gate positions while increasing their relative size **without** losing known stage and without cropping gate/arch on narrow screens; test actual 1280×900 and 390×844 output before acceptance. Then strengthen obstacle animation/material and wordless world-space cause/action storytelling using only public doors, known keys and legal routes. Independent fresh-context builder/critic and Ultracode remained unavailable because the shared-workspace tunnel again returned `Tunnel-client has not been seen for 300 seconds`. CPU-throttled SwiftShader output is **not** representative GPU hardware FPS and cannot by itself establish a product graphics defect. **No merge or deployment.**
