# AI Dungeon — Gauntlet Round 031: truthful restorative magic in real 3D combat

**Date:** 2026-10-31. **Draft PR:** [#49](https://github.com/my-edutu/Ai_games/pull/49), remains open, draft and unmerged. **Exactly tested implementation and test commit:** [`33c4da66a7a4513eb4bceced3d399bf2d33beae4`](https://github.com/my-edutu/Ai_games/commit/33c4da66a7a4513eb4bceced3d399bf2d33beae4). **Visual verdict:** authentic *Diablo IV* fidelity **NOT MET**; production readiness **NOT MET**.

## Proven regression and independent increments

The Round 30 Three.js combat director triggered a visual projectile at the closest hostile whenever the Mystic had an authoritative `action='cast'`. Code inspection of `games/ai-dungeon/src/index.ts` proved this action also represents genuine restorative healing: when a wounded teammate is healed, the same public snapshot carries the semantic event `{kind:'healing',tick:s.tick}`. Thus the spectator could see the Mystic appear to shoot a foe during real healing, a misleading portrayal of autonomous gameplay.

Two separate increments solve this narrow correctness problem without altering combat: (1) the pure `public/ai-dungeon/combat-intent-plan.js` classifies healing only on a same-tick public semantic event for a party Mystic, never from localized text or guessed hit points; (2) the existing live `combat-director.js` emits a bounded, friendly, body-height green flash for a real healing cast and **does not emit a hostile projectile**. The director adds `combatStage.healingCues` diagnostics capped at one million. The strict same-origin Node route includes the new plan. All code remains presentation-only; no hit points, AI, RNG, physics, save/checkpoint format, game version, external assets or source licenses changed.

**Limitations:** The current authoritative public event does not expose a structured target ID; this code therefore marks the healer, not an invented healed target. The single flash is not proof of believable casting animation, accurate hand motion, PBR material quality or Diablo IV visual parity.

## Test-first and debugging audit

1. **Test-first RED commit:** [`4ccd47b`](https://github.com/my-edutu/Ai_games/commit/4ccd47b531c4b0fe2f029c059101513c9d724245) added four foundation assertions, real deterministic heal witness search, a genuine WebGL heal regression and enrolled both test suites. [RED workflow 41208982126](https://github.com/my-edutu/Ai_games/actions/runs/41208982126) showed **63/67 pass and 4 expected new tests fail** because the new pure module and renderer route did not yet exist.
2. **First implementation:** [`5c4d09e`](https://github.com/my-edutu/Ai_games/commit/5c4d09ecdb3f6687e18f9c69be9982f6f6f8f63a) added the renderer-only semantic fix. Actual [workflow 41209174801](https://github.com/my-edutu/Ai_games/actions/runs/41209174801) caught a misplaced static route outside the Map constructor, causing an actual Node syntax failure. Fixed in [`b95c9af`](https://github.com/my-edutu/Ai_games/commit/b95c9af1468de12c79f7fd376c113bc9699097ad).
3. The next [workflow 41209290839](https://github.com/my-edutu/Ai_games/actions/runs/41209290839) correctly exposed one remaining failure: test source hygiene matched a forbidden `DungeonRuntime` token in a comment rather than executable logic. The comment was reworded in [`33c4da6`](https://github.com/my-edutu/Ai_games/commit/33c4da66a7a4513eb4bceced3d399bf2d33beae4), without relaxing assertions, to permit exact-head successful verification. Failed runs are retained, not relabeled as green.

## Exact-head acceptance

| Check | Verified result |
| --- | --- |
| [Focused Dungeon + real browser workflow 41209358782](https://github.com/my-edutu/Ai_games/actions/runs/41209358782), authority | **67/67 focused Dungeon pass**; **17/17 presentation pass** |
| Same dedicated workflow, three genuine Chromium/software-WebGL shards | **49/49 browser pass** = 17 + 16 + 16; new true-authority healer browser test passed |
| Same dedicated workflow, headless | **24 seeds × 900 ticks**; **zero replay mismatches**, Floor **9**, **401** floor advances, **89** restarts |
| [Integrated CI 41209358760](https://github.com/my-edutu/Ai_games/actions/runs/41209358760) | **589/589 software pass**; **15/15 shared browser pass** |
| [Separate visual review 41209358797](https://github.com/my-edutu/Ai_games/actions/runs/41209358797) | **Completed successfully** |
| [Original browser archive 13045767241](https://github.com/my-edutu/Ai_games/actions/runs/41209358782/artifacts/13045767241) | Actual `artifacts/dungeon-healing-clarity-round31-real-webgl.png` screenshot **1440×832**; 11.24-second real browser `dungeon-heal-clarity-*/video.webm`; both inspected |

The WebGL browser constructs `DungeonRuntime.create(seed)` from declared deterministic seeds, searches for an actual healing event, serves real public `before` / `after` snapshots to the running game, waits for genuinely textured authored GLBs and observes `combatStage.healingCues >= 1`. It also checks bounded hit flashes, queue size, hero visibility and no browser exceptions. It does **not** force/mimic a healing event by altering game rules.

## Harsh visual review

The new 1440×832 screenshot shows the original Warden/hero group surrounded by overlapping cyan/pink rings near rectangular corridor walls. Three-dimensional figures are low-detail and partly crowded, room surfaces repeat gridlike stone blocks, and the upper scene is almost black. A separate frame from the 11.24-second authentic Chromium video confirms this is actual game presentation, not a mockup. Semantic truth improved by preventing the false hostile shot, but the screenshot alone does **not** independently show a better art preference; there is no same-seed/tick pre-change healer-shot comparison. Realism and combat feel remain far below the *Diablo IV*, *No Rest for the Wicked* and *Path of Exile 2* reference bars.

Independent fresh-context builder/harsh-critic agents and ultracode were **not available** because the connected worker tunnel was unavailable. No blind matched A/B, independent art acceptance, multi-seed visual sweep, midrange phone p95, sustained GPU/memory soak, accessibility certification or production-readiness claim. These limitations are not green gates.

## Safe rollout and next highest priority

The change is restricted to `combat-intent-plan.js`, `combat-director.js`, `serve-dungeon-stream.cjs` and tests/configuration. Same-origin CSP remains unchanged; pinned CC0 KayKit textures/models and asset hashes are untouched. Roll back Round 31 presenter commits on the draft branch only, without save migration. **Do not merge PR #49.**

**Largest visual blocker:** believable original, high-detail anatomically plausible rigged heroes and monsters; hand-aligned grips with staged real melee, ranged and restorative cast motion, including contact and recovery. Next: authored room architecture with erosion and material detail, stable foreground lighting/composition, fixed-state multi-seed browser/video and device performance measurements, and an independent matched blind critique.
