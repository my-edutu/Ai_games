# Game 2 Gauntlet pass 17 — closer genuine sealed-gate presentation

**Status:** an actual rendered camera-scale improvement; **the fixed Captain Toad: Treasure Tracker benchmark is NOT PASSED**. PR [#53](https://github.com/my-edutu/Ai_games/pull/53) remains draft, unmerged and undeployed.

## Independently judgeable slice and implementation

Pass 16 left the physically blocked, already-disclosed gate and Pip quite small inside a water-heavy follow shot. This pass targets **only the presentation camera's subject scale**, preserving gameplay, public disclosure, movement authority and deterministic AI. In [scene change 08eb4a0](https://github.com/my-edutu/Ai_games/commit/08eb4a0a16ba0f205a6269e38fbf67a2709c7d94), source-disclosed nearby sealed-gate camera height is 5.65 on ordinary desktop versus 6.55 previously; narrow portrait now correctly selects a specific 5.8 gate height rather than falling through to its generic 6.2 height. Existing small-height and manual detail modes retain their separate behavior. Rendering diagnostics expose actual camera half-height only. [Browser assertions a4d1651](https://github.com/my-edutu/Ai_games/commit/a4d1651ee83ee8adb1154ba075c81bdf03dc060a) guard that both genuine public gate and Pip remain on screen and verify the bound in both sizes. None of this calls a hidden route or suggests that a sealed gate can be traversed.

## Source-bound checks and dated captures

[Exact-source CI 41180638308](https://github.com/my-edutu/Ai_games/actions/runs/41180638308) succeeded: **524/524 Node tests**, **25/25 browser checks**, build, four stream-host self-tests, nondeterminism scan and authentic browser capture. The same-source Eko companion CI workflows also succeeded. Original [maze capture artifact 13034534406](https://github.com/my-edutu/Ai_games/actions/runs/41180638308/artifacts/13034534406) contains these *actual* screenshots and JSON manifests (not synthetic scenes):

| Production seed / tick | View | Exact UTC capture time | Screenshot SHA-256 | Reported half-height |
| --- | --- | --- | --- | --- |
| `maze-visual-reference-13`, tick 21, public closed `door-2` | 1280×900 full-page desktop | 2026-10-31T07:34:16.528Z | `6572c9ac86e9b3348999a6dc47c4e1e5a0bdffe4613cefb77e32f45f4cf610e3` | 5.65 |
| Same seed and actual tick; 390px viewport | 390×844 portrait | 2026-10-31T07:34:19.878Z | `9cd7c40bd8c6aca309aa7ad7544e66fef2707aa7dc6eae97a9362107a37d8157` | 5.8 |

Both PNGs were downloaded, decoded and inspected at native size, and their bytes SHA-256 matched the checked-in-CI JSON manifests. Desktop gate projected `x=-0.1256` and Pip `x=0.0059`, both in frame; portrait gate `x=-0.2300` and Pip `x=0.0121`, also in frame. These are genuine source-disclosed visual diagnostic positions, not independent aesthetic scores or a safe-path claim.

## Rendered visual verdict — lead only

Relative to the genuine pass-16 same-seed/tick images (desktop `e7620535601d1405d738b0521a2e5783cafbb70be23d208672a60955e75c0ed9`, portrait `075450e0201219402109b94fde9f155abc64de1fa1cdc1fa4be79c7be2c3e16e`), both the hero and physically sealed gate occupy somewhat more screen height. On the unchanged desktop gameplay-viewport crop, a basic turquoise-color mask decreases from **56.815% to 53.078%**; this is a *rough water-like pixel occupancy estimate*, **not** quality, image realism or compliance with Nintendo's bar. The view still has a large largely empty water region left of Pip and little visible next-action storytelling. The upper ruin arch is partially cropped and the gate/character silhouettes are still weak at normal viewing scale. The official two SHA-pinned [Nintendo references](./reference-manifest.json) remain stronger in environmental hierarchy, action clarity, material diversity and expressive staging.

**No fresh independent critic or blind fixed-reference A/B** occurred: the shared-workspace agent tunnel still reported `Tunnel-client has not been seen for 300 seconds`, and Ultracode was not available. The CPU-throttled, software WebGL `frameP50Ms=300` for the desktop capture is not GPU/hardware FPS evidence. Passing tests are not benchmark parity.

**Next independent slice:** shift the source-disclosed stage into the follow composition *without losing Pip or the sealed barrier*, then compare actual same-seed/tick source-bound desktop/portrait images. Keep the fixed Nintendo pair and independent acceptance gates unchanged; do not merge or deploy.
