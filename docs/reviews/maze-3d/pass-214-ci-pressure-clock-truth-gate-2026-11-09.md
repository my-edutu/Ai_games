# Pass214 — full physical jaw stroke requires real public clock completion (2026-11-09 UTC)

## Grounded Phase-0 regression

An **actual GitHub Actions run on earlier commit `6cbcedc`**, [Autonomous Games CI 42436991713](https://github.com/my-edutu/Ai_games/actions/runs/42436991713) (completed 2026-11-08 22:17 UTC), failed **four** pressure-system tests. [WebGL workflow 42436991608](https://github.com/my-edutu/Ai_games/actions/runs/42436991608) failed its source test before image capture. Two remaining stale assertions in the current source expected the full pressure jaw to open immediately or at 0.60 seconds after first contact. The actual installed-world choreography is deliberately **warning → moving ivory shutters → full paired jaw extension**.

The production `observedPressureProgress` contract defaults to 1.25 seconds and starts at progress .20. On the physically connected real jaws, **0.60 seconds** of continuous contact produces **0.6344444444 radians**, *not* the former full **0.66 radians**; after **0.65 seconds**, the actual floor-opening phase is complete and the exact **0.66 radians** is earned. A newly witnessed contact is an honest **0.20rad warning**, not a full `0.66rad` throw.

## Atomic correction — ONLY actual installed-Three test choreography

- `tests/phase3/maze-3d-tide-shear.test.cjs`: first on-contact 0.20rad warning, an intermediate connected partial hinge, then continued same-visible-contact exactly 0.66rad full opening; true later withdrawal, reduced-motion static pose, secret/unseen and resource-release checks stay intact.
- `tests/phase6/maze-public-pressure-shutters.test.cjs`: complete the existing real contact sequence at `t=.70` instead of `t=.65`, with 0.66rad jaws and 1.11rad ivory shutters **both exact and unchanged**; withdrawal follows at `t=.75`, retaining all visibility/privacy and allocation assertions.
- Previously failing `maze-public-tide-shear-hazard.test.cjs` test source was already changed between `6cbcedc` and current HEAD; do **not** loosen or rewrite it without a new exact-head failure. No game authority, actors, geometry, art, camera, stage, HUD or shader changed.

**Verification boundary:** Source-bound arithmetic above was independently recomputed, but no installed-Three, Chromium, exact-HEAD WebGL, six-run resource test or new Nintendo reference image comparison was executed in this session: coding/critic tunnel `NOT_FOUND`; current HEAD workflows [42523541287](https://github.com/my-edutu/Ai_games/actions/runs/42523541287) / [42523541290](https://github.com/my-edutu/Ai_games/actions/runs/42523541290) queued at inspection. **This is a specific CI regression repair, NOT a rendered gameplay win.** Strict `<100` geometries, spread `<=8`, original `±.95` NDC, guardian `>=.70`, true source-bound full-frame images, 44px controls, determinism, privacy and accessibility remain mandatory.

Next gate: obtain new exact-head CI and continuous same-run original native full-frame WebGL evidence, check physical stroke and 6-run resource budget, independently compare with the official Nintendo benchmark. PR #53 remains open draft, never merge, deploy or force-push.
