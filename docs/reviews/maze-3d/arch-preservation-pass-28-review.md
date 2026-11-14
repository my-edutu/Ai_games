# Game 2 pass 28 — actual arch camera evidence and visual gate (2026-10-31)

**Verdict: small verified camera correction; fixed Captain Toad benchmark STILL NOT PASSED.** This is a lead-side inspection, not a fresh independent blind critic. No pass 29 gameplay code is being claimed.

## Exact source and genuine screenshots

- The recorded scene-only change is [commit 84e1dd7](https://github.com/my-edutu/Ai_games/commit/84e1dd74a47753b5d60b173c18c5d20643d36ef9): only a genuinely carried matching key beside the disclosed closed gate raises follow-camera vertical target from +0.46 to +0.80 world units. Normal threats, ordinary sealed gates and terminal cases remain on their existing rules.
- [Exact-source run 41234490759](https://github.com/my-edutu/Ai_games/actions/runs/41234490759) (head `84e1dd74`) completed **CANCELLED** at 20:00:41 UTC on 2026-10-31. Its archived **actual production browser captures** were published before cancellation in [artifact 13055687573](https://github.com/my-edutu/Ai_games/actions/runs/41234490759/artifacts/13055687573). The cancellation means **NOT** a complete green CI; the browser/layout verification was cancelled.
- The exact unchanged public state is seed `maze-visual-reference-13`, tick **21**, disclosed genuinely closed `door-2`, with `keyLockCloseup: true`, `carriedKeyGateGesture: ~1`, and `closedGatesInFrame: 1`. This is not a synthetic gate or a claim it is unlocked.
- **Original desktop 1280×900:** captured **2026-10-31T19:37:28.999Z**; actual PNG SHA-256 **`082665cb594fd50a638667be6525ad67d1b49bd31cd8efa4c5d45038c6e89b90`**. **Original portrait 390×844:** captured **2026-10-31T19:37:32.346Z**; actual PNG SHA-256 **`142ad23b78bf89792764c2511a1b0e9c1be278599aecbd320ad3803107cda1da`**. The PNG bytes were independently hashed and exactly match the adjacent source-linked JSON manifests; the manifests agree on app/world/map source hashes and differ from pass 27 only in `scene.js`.
- **Pass-27 baseline** from [artifact 13054098156](https://github.com/my-edutu/Ai_games/actions/runs/41230389838/artifacts/13054098156): desktop **18:45:44.784Z** SHA `22945f73afd22dce543f7ccaa1f815bfefd2f1f4483c97666d9a74a84bbe7afe`; portrait **18:45:48.161Z** SHA `057437b5ab323b72158b6abd42912417ac414c510f8ac03f25f3009930688d76`. Same public seed and tick.
- For consistent full-frame comparisons, 22.42% of desktop and 25.68% of portrait pixels changed by more than 12 RGB levels; these reflect a camera reframe, **not** a perceptual quality or benchmark score.

## Actual screen verdict versus fixed Nintendo reference

Raising the aim shifts the whole stage downward slightly in frame. The upper-right sandstone arch gains measurable visual breathing room **in desktop**; the portrait's upper right remains partially cropped, and the lock/held-key causality is still tiny at native 390 pixels. Pip and the lock remain in the same horizontal positions and inside frame, but the gate occupies the left side and a broad teal lagoon dominates the remaining background. Nintendo's SHA-pinned **Captain Toad: Treasure Tracker** temple/maze images in [reference-manifest.json](./reference-manifest.json) still show a substantially clearer actor/action/environment hierarchy and richer foreground-to-background puzzle staging. **The fixed bar wins, not this candidate.**

The source manifests show `cameraHalfHeight` remained 4.70 portrait / 4.55 desktop and that the real carried-key and closed-door cues remain present. This review is not an assessment of 3D animation over time or a hardware performance result. SwiftShader reported ~300 ms P50 in a CPU-throttled shared CI environment; it is not a device-GPU FPS estimate. The new camera aim is a small composition fix, not a complete solution.

## Next smallest independent work pieces

1. **Physical pose/readability:** design a genuinely public matched-key-only outward glove/key gesture that visibly aims toward the real recessed lock; verify unchanged hidden-information, nearby-threat, terminal-state, reduced-motion and deterministic precedence with separate focused source tests. Do not add a fake unlock.
2. **Native portrait relation:** measure the actual distance and occlusion between modeled hand, key bow/shaft and the known lock at 390×844; adjust geometry/animation rather than filling the screen with explanatory HUD copy.
3. **Disclosed-stage framing:** strengthen a visually complete arch, near-shoreline foreground and depth hierarchy using only the publicly revealed world; retain Pip, gate, traversable surfaces and genuine barriers in-frame.
4. **Separate review gate:** run a builder and fresh-context critic per significant independent piece when workspace access resumes; critics must open authentic dated PNGs and compare against both unchanged, fixed SHA-pinned Nintendo screenshots; blind A/B the old/new candidate order when practical.
5. **Validation:** preserve unmodified public-information and deterministic assertions, inspect exact-source full CI and mobile/desktop screenshots before claiming improvement. Treat CI cancellation, software GPU throttling and independent critic availability separately.

The shared workspace and `agents` operations both returned `Tunnel-client has not been seen for 300 seconds` on this run; separate fresh critic and Ultracode were unavailable. **No independent win. No merge/deploy. PR #53 stays draft.**
