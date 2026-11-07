# Pass184 — genuine public pressure staging survives object rebuilds (2026-11-06 UTC)

## Player-visible production defect and fix

The source-bound Pass183 physical relay → hinged shutters → elevated piston uses a bounded real render-time timeline. However, `world.update()` computes an object cache signature from **all publicly discovered cells**, keys, inventory and doors. Every new public cell or key/door state change legitimately calls `rebuildObjects()`, which cleared and recreated `trapSignals`. That discarded `pressureSince`, resetting the visible mechanism to its early warning even when Pip remained near the same published pressure hazard. With 360ms gameplay ticks and active exploration, this could prevent the full three-phase physical scene from completing naturally.

This source patch carries **only already-witnessed same-run pressure-clock timestamps** through a rebuild, gated by that exact hazard being public and **visible in both consecutive public snapshots**. No undisclosed tiles, private AI state, collision, attack, route decision or fabricated event are accessed. A hidden-between-updates hazard cannot resume an old actuation; changing runs already clears the old signals before the rebuild. Memory-only hazards stay idle. The existing clock-rollback and retreat checks in `animate()` remain authoritative for the physical presentation. No new geometry, materials or per-frame GPU allocations; a temporary map is used only on a genuine scene-object rebuild.

## Executable regression gate

`tests/phase6/maze-public-pressure-relay.test.cjs` now demands an actual installed-Three physical shutter continues past its intermediate pose and the piston enters its later phase **after a legitimate same-run publicly disclosed cell rebuild**. The test also demands noninheritance following a hidden interim snapshot and a new run. Existing strict resource, discovery, mobile crop and accessibility tests are untouched.

## Evidence limitations and required validation

This is an **implementation candidate**, not a visually approved Pass184. JS syntax/source checks can be performed outside the disconnected game workspace, but no installed Three, real WebGL screenshot, hardware GPU or independent blind visual critic is claimed. At this checkpoint current-head [Pass183 focused WebGL](https://github.com/my-edutu/Ai_games/actions/runs/42159866635) and [full CI](https://github.com/my-edutu/Ai_games/actions/runs/42159866616) remained queued. The previous six-transition geometry failure (102 against unchanged <100) is **not independently cleared**. Require exact-new-HEAD Node/whole CI; native dated SHA-verified real 320×740, 390×844, 844×390, 1280×900 captures during sustained public encounter, complete actor/hazard margin ±0.95 and >=0.70 visible width, 44px touch, no hidden leakage, no cropped frames, and independent visual critique against [official Nintendo Captain Toad](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/).

Fixed benchmark NOT MET. Keep [PR #53](https://github.com/my-edutu/Ai_games/pull/53) OPEN DRAFT, unmerged and undeployed.
