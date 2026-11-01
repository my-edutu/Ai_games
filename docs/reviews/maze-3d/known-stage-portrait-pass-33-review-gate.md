# Game 2 pass 33 — known-stage portrait balance (November 1, 2026)

**Status: source + pure-helper regression test CANDIDATE; exact-source CI, original pass33 image and detached visual acceptance OPEN.**

## Real defect and immutable benchmark

Actual pass32 [Actions artifact 13072073770](https://github.com/my-edutu/Ai_games/actions/runs/41278115875/artifacts/13072073770) was inspected at 1280×900 and native 390×844 with original SHA-matched manifests, seed `maze-visual-reference-13`, tick21, legitimately observed closed door-2 and carried matching key. The higher camera aim restores some desktop crown space but leaves the **right edge of the public upper arch clipped in native portrait**, too much lagoon, and an unconvincing tiny glove/keyhole pairing. Official Nintendo images and fixed SHA-256 identities remain [pinned](./reference-manifest.json); Captain Toad still wins. No independent critic.

## Builder: one judgeable change

Only in the existing `composePublicKeyLockFocus` helper when the caller already requires a publicly disclosed matching key and closed gate, change **portrait** known-stage weight **0.22 → 0.35**. Keep gate weight 0.49, maximum shift 1.5, desktop weight 0.52, orthographic zoom, real scene/characters/pose, gate state, other cameras, terminal/guardian priority and autonomous deterministic authority unchanged. The expected effect is to shift the camera toward known stage and bring more of the cropped right arch into the portrait viewport, trading a little left-lagoon area for stage density. It must not suggest a traversal through the closed barrier or draw hidden cells.

## Separate source critic and render gates

The existing independent pure-helper test now asserts a meaningful move toward public terrain versus pass32 without loosening the existing actor/obstacle, finite, snapshot non-mutation or camera limit tests. The full cross-game CI remains informative but currently fails three unrelated Tiny Kingdom checks; a narrow Maze visual workflow is added to collect the **same genuine seed/tick** without repeating other games' CPU-heavy browsers. A green test is not aesthetic evidence.

A fresh-context visual critic must see untouched pass32/pass33 desktop **1280×900** and native portrait **390×844** captures, verify their date, same public state and PNG SHA-256 against manifests, and compare blind when possible. Inspect upper/right public arch visibility, Pip and physical closed-bar lock, truly carried key, floor coverage/lagoon balance, and cropped lower level. Reject if gate or Pip is pushed out or the right arch remains truncated; evaluate the unchanged pinned Nintendo images separately. Critic must state if independent worker was unavailable rather than pretending. No representative GPU-FPS or benchmark win is claimed. Draft PR #53 must remain unmerged and undeployed.
