# Pass210 — stop resetting the actual pressure motion during WebGL acceptance (2026-11-08 UTC)

**Existing draft PR #53**, branch `feat/maze-3d-gauntlet`. Fixed official [Captain Toad gameplay](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/) remains UNMET; Luigi's Mansion 3 and ASTRO BOT support the same quality bar.

## Largest remaining independently measurable blocker

Authentic older 320/390 full-frame renders show Pip's Tide-Shear hazard competing with a large closed gate. Pass204 camera, Pass207 physical gate-wing cutaway and Pass208 grounded Pip performance cannot be accepted until fresh exact-HEAD render evidence exists. The existing browser *chronology* accidentally executed a new `page.goto` for **each** real public approach/contact/withdrawal snapshot. That destroys the live camera, pressure clock and actor continuity. The input frames were authentic, but their arrangement could not demonstrate one action—three reloaded stills are not a continuous real-world motion comparison.

## Implemented source candidate

The production-bound `tests/browser/maze-review.spec.cjs` now navigates ONCE per 320 or 390 viewport, keeps the same WebGL canvas, and changes only the existing route's `activeFrame` through unmodified same-run **public** snapshots. It waits for both the matching published tick and a newly rendered WebGL frame, asserts the original canvas and navigation origin survived, and records the actual renderer-frame counts/origin beside original full-resolution PNG SHA hashes. The existing strict original ±0.95 physical bounds, >=0.70 mobile jaws, 390 Pip size, touch-target bounds, runToken privacy, source SHA, and no-crop assertions remain. No new game authority, hidden state, altered AI choice, synthetic tick, forced encounter, CSS art or GPU budget change.

## Execution and independent criticism

The latest GitHub PR HEAD inspected before this source edit was `c47b7797f4a3e3dcb11f203bec2f2c857539205d`; its authentic screenshot workflow [42469432974](https://github.com/my-edutu/Ai_games/actions/runs/42469432974) and [whole CI 42469432954](https://github.com/my-edutu/Ai_games/actions/runs/42469432954) were QUEUED. The coding workspace `exec_command` and independent `agents` both returned disconnected-tunnel errors. Therefore source parsing is not a Node/Playwright pass, **there are no Pass210 captures yet**, and the current visual parity claim remains REJECTED/NOT TESTED. The six-run geometry budget <100 / spread <=8, exact-source native captures, genuine pressure chronology and independent original-image Nintendo critique are mandatory before marking progress.

Keep PR open/draft. Never merge, deploy, force-push or overwrite concurrent contributors. This work repairs the evidence path; it does not itself deliver a player-visible benchmark win.
