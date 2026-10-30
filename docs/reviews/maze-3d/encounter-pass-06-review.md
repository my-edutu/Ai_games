# Sixth-pass actual guardian encounter — source-bound visual check (not independent)

**Date:** 2026-10-30 (UTC). **Fixed benchmark:** the two identical pinned official Nintendo Captain Toad: Treasure Tracker frames in `reference-manifest.json`, supporting Luigi's Mansion 3 and ASTRO BOT. **No benchmark win.**

## Original public-state capture (before amplified pose)

- Source commit `183c5d56d4af7023be1b830f3481f170f0b677e0`, [CI run 41137083533](https://github.com/my-edutu/Ai_games/actions/runs/41137083533), [capture artifact 13017725142](https://github.com/my-edutu/Ai_games/actions/runs/41137083533/artifacts/13017725142).
- Authentic browser capture `encounter-public.png` at **2026-10-30T22:23:43.198Z**, 1280×900, balanced. Seed `maze-visual-reference-13`, tick **13**, public actor separation **2.23606797749979 cells**.
- Image SHA-256 `645cd4b27c142a853cffc672cc03997691a250de3eb51bbcb02eb109fe5363f8`. Attention strength **0.2803265577**. Protagonist and one genuine disclosed beetle both visible.

## Amplified public-only reaction candidate

- Product source `2c2ae6937b31dec46bf4cf2f841e0a4e8f2c19ad`, [CI run 41138125715](https://github.com/my-edutu/Ai_games/actions/runs/41138125715), [capture artifact 13018455473](https://github.com/my-edutu/Ai_games/actions/runs/41138125715/artifacts/13018455473).
- Authentic browser capture `encounter-public.png` at **2026-10-30T22:32:43.499Z**, 1280×900, balanced. **Same real seed, tick, actor positions, viewpoint, page size and public separation**. Screen-space diagnostics: `characterCount=2`, `disclosedThreats=1`, `wardensInFrame=1`, `explorerInFrame=true`; attention strength **0.5606531155**.
- Image SHA-256 `320eaa6f4c4ab1e7711234968b542bd60ce2f7ac0073d420098d5d4abc1da59a`. Production capture manifest pins `scene.js` SHA-256 `1aa079d214697c67baa71a33ff6b27b314f562ee9c5254f57d408e84048a073e` and `characters.js` SHA-256 `864fe5e893e3c4dae761b0ec3ffc0d45cdfcdd8b0e2266aefac05025492d2c84`.
- `2c2ae69` modifies only cosmetic attention strength within the **same 6.6-world-unit public-disclosure radius**. The authoritative game, AI outcomes, public-state/privacy bounds and deterministic transitions are unchanged.

## Actual output assessment

The lead opened both PNGs, not screenshots from another pass. The valid close encounter depicts a sandstone/jade terrace and passages, with Pip at center-left, the beetle on the upper-right terrace, and masonry between them. This establishes a coherent two-actor original 3D world with a disclosed threat and improves on the prior artifact, which displayed the actors far apart. Comparing the two strictly aligned 1280×900 RGB screenshots, **1.24% of all pixels change**; the changes are concentrated in character regions. The adjusted head/look response is subtle at native gameplay size. It does **not** yet communicate a clear causal encounter, what safe route the explorer can take, or where the immediate objective is without HUD exposition.

The real Captain Toad imagery remains clearly stronger in instantly identifiable action, character expression, distinct landmark composition, and visual decision readability. This is an **unblinded lead observation only**, not a newly completed independent verdict. The most recent independent visual reviewers (fourth pass) still prefer the Nintendo bar. Do not claim source version 2c wins from the tests or the pixel difference.

## Verification and remaining gates

- [GitHub CI 41137361394](https://github.com/my-edutu/Ai_games/actions/runs/41137361394) for the on-screen warden gate **passed 516/516 unit and 25/25 browser checks**. [Final gameplay source CI 41138125715](https://github.com/my-edutu/Ai_games/actions/runs/41138125715) **also passed 516/516 unit and 25/25 browser checks** plus build, deterministic scan, self-tests, evidence and workflow stages.
- No independent fresh-context builder/critic or Ultracode was available: the shared workspace connector reported `Tunnel-client has not been seen for 300 seconds`. A masked A/B by a fresh judge with no builder notes remains required, followed by direct pinned-reference comparison. Do not present lead comparison as independent.
- Original CI capture frame-time p50 was roughly 433 ms, current CI capture roughly 500 ms on software graphics; no reliable hardware-frame-rate conclusion, no revised timing limit, no graphics defect finding.
- Remaining smallest visual slices: (1) noticeable protagonist threat reaction at native scale; (2) guardian-facing anticipation without generic idle ambiguity; (3) an immediately readable legal route/refuge for the player, **only when disclosed by actual public state**; (4) a landmark/material silhouette that distinguishes this garden from repeated corridors; (5) fresh blinded A/B and fixed-image critic with explicit criterion-level verdict. Do not fabricate actor positions, passages, routes or screenshots for review.

**Current status:** implemented source candidate, source-bound real browser evidence, completed functional regression, independent visual acceptance still OPEN; PR remains draft, not merged or deployed.
