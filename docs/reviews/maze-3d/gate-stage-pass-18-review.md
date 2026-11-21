# Game 2 Gauntlet pass 18 — real coastal sealed-gate composition

**Status: genuine render improvement; the fixed Captain Toad: Treasure Tracker benchmark remains NOT PASSED.** [Draft PR #53](https://github.com/my-edutu/Ai_games/pull/53) is open, unmerged and undeployed.

## Smallest independent visual slice

Pass 17 left a large empty lagoon beside Pip and the truly closed, previously disclosed gate. [Implementation commit `4b74885`](https://github.com/my-edutu/Ai_games/commit/4b7488523cceebe052187095fdeb65b1c7218cf3) rebalances only the *public-only* `composePublicSealedGateFocus` camera helper toward known walkable terrain rather than an edge-of-scene gate. Source-disclosed stage weight is 1.05 desktop/.48 portrait, gate contribution .23/.24; combined lateral drift is bounded to 2.6 world units desktop and 1.1 portrait. A focused unit/contract check now guards the balance, bounds and a gate-only camera contribution. No game authority, AI movement, hidden map, geometry, door state, simulated route or deterministic rule changed.

## Actual source-bound evidence and engineering verification

[Autonomous Games CI run 41184813290](https://github.com/my-edutu/Ai_games/actions/runs/41184813290) for gameplay commit `4b74885` **completed successfully**: **524/524 Node tests**, **25/25 Playwright browser checks**, build, four stream host self-tests, authoritative nondeterminism scan and real WebGL screenshots. The [original pass-18 capture artifact 13037025673](https://github.com/my-edutu/Ai_games/actions/runs/41184813290/artifacts/13037025673) preserves actual PNGs and their JSON source SHA-256 metadata; the previous pass is [artifact 13034534406](https://github.com/my-edutu/Ai_games/actions/runs/41180638308/artifacts/13034534406). The downloaded screenshots were decoded and hash-compared with the artifacts, not fabricated or drawn from hidden states.

| Actual production seed `maze-visual-reference-13` / tick 21, known **closed** `door-2` | Previous pass 17 PNG SHA-256 | New pass 18 captured UTC / SHA-256 |
| --- | --- | --- |
| 1280×900 desktop | `6572c9ac86e9b3348999a6dc47c4e1e5a0bdffe4613cefb77e32f45f4cf610e3` | **2026-10-31T08:37:09.971Z** / `cea444431f35ff409c32b67aefe447c4231fca9aad73dfa3722d601d8f16c9b6` |
| 390×844 portrait | `9cd7c40bd8c6aca309aa7ad7544e66fef2707aa7dc6eae97a9362107a37d8157` | **2026-10-31T08:37:13.673Z** / `3cca0e4f13367a5b8ec4c5fb1622c7419c841016aeebf662fc347d5c402ed058` |

Current source-manifest hashes include `map-view.mjs` = `5ff0e604bedae406f6ffae4d65b2aed89f4e0f2207e871cbbe4e90200df66bda`, `scene.js` = `9c1fce4d58b54b63835eacabb3a1d8e5b4c8ee4356697986d757bf54f0c3145b`. The browser measured one real closed gate and Pip in both cameras. Desktop normalized gate/Pip x=-0.4592/-0.3276, portrait -0.4852/-0.2430. Nothing claims the locked passage is traversable or safe.

## Actual image critique and acceptance boundary

I directly inspected both 17→18 native-image pairs. **Desktop now shows more of the existing sandstone terrace rather than blank turquoise water**. A crude fixed RGB mask over the *same cropped gameplay viewport* puts water-like pixels at **53.059% → 46.457%** (-6.602 percentage points), left-third water-like pixels **89.089% → 60.042%** (-29.047 points), and sandstone-like pixels **30.562% → 35.440%** (+4.878 points). These are deliberately weak color-occupancy proxies, **not perceptual quality metrics or proof of Nintendo parity**. Portrait improvement is slight.

**Lead-only verdict:** authentic stage occupancy improved on desktop, but Pip and the real sealed gate have shifted farther left; their physical next-action relationship is still unclear at normal gameplay scale. The original official Nintendo Captain Toad images pinned in `reference-manifest.json` remain the stronger artistic quality, material, staging and legibility bar. No blind independent benchmark A/B or independently verified win occurred. The shared-workspace tunnel and separate fresh-context critics/builders were unreachable (`Tunnel-client has not been seen for 300 seconds`); Ultracode was not available. CPU-throttled software renderer timing is **not hardware GPU FPS**.

**Next independent piece:** retain added public-stage occupancy while moving the genuine Pip/locked-gate encounter toward a clearer shared focal region; inspect new same-seed/tick native desktop and portrait screenshots before judging, and seek independent actual-render comparison with both unchanged Nintendo references. Preserve the deterministic privacy boundary. No merge/deploy.
