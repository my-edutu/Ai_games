# Infinite Tower Climb — Gauntlet 34: truthful standing contact against moving and landing decks

**Branch:** `codex/infinite-tower-climb-3d-gauntlet` · **Pre-edit head:** `34551d024c370071e0c21d34cb8a10bbb1b69cb6` · **Scope:** scene presentation only · **Review:** SELF-REVIEW, independent critic/Ultracode workspace unavailable.

## Pre-edit, source-bound evidence

Reviewed the previous exact-source 01590866 WebGL Ruins 960×600 GPU screenshot with stone surfaces fully loaded, and the existing 72.28-second actual gameplay guardian WebM captured on an earlier Tower source. They establish current presentation and broad animation limitations, **not** sustained hardware FPS, continuous grounded contact, or a winner against the official Jusant and ASTRO BOT Rising Heat benchmarks. G33's proof-quality capture gate is separately PASS: 3/3 decoded-stone manifests in successful Tower Landing Evidence CI 41239431905. At current pre-edit doc-only head 34551d024c370071e0c21d34cb8a10bbb1b69cb6, Tower Realism Evidence run 41239820624 and Continuous Motion Evidence run 41239820602 succeeded; the broad catalogue CI 41239825752 was **CANCELLED**, not passed.

## One source-derived defect and repair

In `scene.mjs`, the climber's root position was lerped in x/y/z during *every* state, including authoritative `standing`. The snapshot's actual soles Y is `p.y - p.halfHeight`, mapped to world Y; when a landing arrives or the collision platform moves, vertical easing can leave the visible feet hovering above or below the deck despite the game being grounded.

`followClimberContact()` retains the original x/z interpolation and the original complete 3D interpolation for airborne, dashing, hurt and dead states. Only during authenticated `standing` does it align the presentation root's Y to the same snapshot-derived surface Y in that frame. It never changes player physics, RNG, AI, collision, public state, replay, resources, HUD or camera control. It does not claim to add hand IK, animation clips or true free-roaming wall climbing.

## Test and review evidence

**RED**: focused local Node 22 test exited 1 when the helper was absent (`ERR_MODULE_NOT_FOUND`). **GREEN**: new tests 4/4 passed after the helper was added, including instant grounded Y alignment, up/down moving decks, unchanged airborne/dash/hurt/dead interpolation, and scene wiring. `node --check` passed for the helper. The wiring test used an isolated scene fixture with the same replacement call; full shipped scene and WebGL browser behavior require post-commit CI and GPU inspection. Test and helper were verified locally before Git write.

**Self-review — specification:** grounding uses the actual immutable simulation position, never an inferred platform target; no visual grip is fabricated. **Quality:** abrupt standing Y correction is intentional to eliminate transient floating and can be visible when snapshots jump; requires real-time motion capture. Model feet may still penetrate due to authored crouch/pose; this change corrects root placement, not the complete contact animation. No independent review was available because the shared coding-worker tunnel returned NOT_FOUND (tunnel-client unseen for 300 seconds).

**Not passed or not measured:** full build and cross-phase tests, exact-new-commit browser screenshots, hands-on moving-platform frames, complete climbing animation, 90% commercial visual preference, accessibility, intended-device FPS, long soak and independent critic. A green logical test does not establish any of these.

**Automatically recommended next priority:** inspect exact-commit Landing/Motion GPU artifacts and compare real moving-platform/standing foot contact in motion; then develop truthful near-ledge hand/foot pose transitions and environment richness against Jusant/ASTRO BOT. **Overall GAUNTLET 90 NOT ACHIEVED.** Draft PR #58, no merge/deploy/force push.
