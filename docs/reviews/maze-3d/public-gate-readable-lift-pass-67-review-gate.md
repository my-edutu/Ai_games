# Pass67 Gauntlet review — physically visible opening, not a disappearing portcullis

**Date:** 2026-11-02 UTC. **Branch:** `feat/maze-3d-gauntlet`. **Draft PR:** [#53](https://github.com/my-edutu/Ai_games/pull/53). **Quality verdict:** Nintendo benchmark NOT passed.

## Fresh original-image review (before the builder change)

The prior [exact-source Pass66b visual run 41396442586](https://github.com/my-edutu/Ai_games/actions/runs/41396442586), [original 20-PNG artifact 13119522973](https://github.com/my-edutu/Ai_games/actions/runs/41396442586/artifacts/13119522973) and real full-resolution 1280×900 `public-gate-mid-lift-1280.png` were retrieved. All **20 original PNG** SHA-256 hashes match their dated native-image JSON/transition records: 18 individual image manifests plus the before/after entries from the transition manifest. The authentic public run changes door 77–94 from CLOSED at tick 7 to OPEN at tick 8. Mid-lift diagnostics show one retracting 3D gate at capture start age **0.105s** and screenshot completion age **0.595s**, but the screenshot itself appears to show an already **empty arch** almost identical to the settled after image. It is a real WebGL screenshot, not a fake or test stub. In particular the stage's dynamic moving mesh count is **not** enough to prove a visually intelligible action.

Direct visual comparison with frozen [official Nintendo Captain Toad imagery](https://www.nintendo.com/us/store/products/captain-toad-treasure-tracker-switch/) remains unfavorable: Nintendo's wordless physical cause/effect, character/obstacle staging, readable animated hardware and distinct levels are more compelling. Current original Pip, the warm terrace, compact HUD and real moving 3D scene are coherent, but the physical lift is too faint and the level still lacks comparable authored variety. This is a single **lead** critic, **not** fresh independent or blind A/B; workspace tunnel returned disconnected, so subagents/Ultracode were unavailable.

## Builder decisions — smallest judgeable gaps

1. **Mechanical timing:** the prior cubic ease-out raised/squashed the gate by ~97.5% at the actual 0.595s capture, making it disappear long before the 0.85s sequence ended. An original slow-start, accelerating counterweight motion now keeps ~50% visible model height at that same real time. It still clears at 0.85s, does not slow the authoritative game/AI/countdown, and has immediate reduced-motion settlement.
2. **Real mesh telemetry:** add `movingGateMinBarsHeightRatio` from the *actual public moving Three.js grille mesh* in scene stats. This specifically prevents equating nonzero active-animation count with physically visible bars; no secret door or solver state is consulted.
3. **Stronger evidence acceptance:** preserve the 20 original source/date/viewport/interaction checks and require an original full-resolution 1280×900 WebGL mid-lift capture to report greater than **0.30** real modeled bar-height ratio **after** PNG capture, in addition to existing true same-run transition, active camera and image SHA checks. Focused deterministic tests assert a substantial intermediate pose without weakening earlier privacy, full-model framing or mobile tap-target thresholds.

## Independent critic / verification gate still open

The new exact-head focused visual CI and full-monorepo CI must be checked. Retrieve the original dated new-source PNG, recompute SHA-256 and **inspect it at full resolution**: the grille must be visibly halfway lifted, both real pulleys/weights still meaningful, Pip/action unobscured, no visual fake/hidden map disclosure, and 320/390 portrait plus 844 landscape and 1280 desktop untouched. Compare with official Nintendo and prior own capture, reject if still an empty arch despite a passing numeric test. CPU-throttled SwiftShader is not a product hardware GPU FPS verdict. The previous full-monorepo failures in unrelated Tiny Kingdom remain separate.

**Do not mark the Gauntlet achieved, merge or deploy.** No new-source rendered screenshot or independent victory is claimed by this source commit.
