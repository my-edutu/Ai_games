# Tiny Kingdom — Experience Transformation Gauntlet

**Effective 2026-11-01.** This contract supersedes the old G001–G088 micro-improvement acceptance method on draft PR #64. Read root `AGENTS.md` first. Use this file with the existing chronological `public/tiny-kingdom/progress.html` ledger. This is a change to *what counts as success*, not a claim that the current game has already improved.

## Primary promise

An uninstructed person who sees and interacts with the new running game should clearly prefer it to the old one because its world looks richer, its motion and controls feel more natural, and its autonomous society behaves more believably. **An additional mesh, shader tweak, UI color, green CI run, source commit, or changed-pixel percentage is not evidence of transformation.** Those are supporting implementation steps only.

## Fixed evidence baseline and references

- Locked pre-transformation source: `2f6deb43feb1a1557848d44def53a6109deb1ab1` (G088, 2026-11-01). Do not slide the baseline forward to manufacture progress. The actual running game source blob is unchanged from G088 implementation `2491dce7fcaf3118f48aebb280db3a4b7eb99549`.
- Exact-source real WebGL screenshots: [G088 GPU run 41301740489](https://github.com/my-edutu/Ai_games/actions/runs/41301740489), [artifact 13081531738](https://github.com/my-edutu/Ai_games/actions/runs/41301740489/artifacts/13081531738).
- Exact-source 120-day world growth and screenshot: [run 41301740495](https://github.com/my-edutu/Ai_games/actions/runs/41301740495), [artifact 13081222556](https://github.com/my-edutu/Ai_games/actions/runs/41301740495/artifacts/13081222556). The baseline had 28 citizens/35 structures, about 158,774 scene triangles and roughly 1.7 observed SwiftShader FPS, which is **not** measured hardware performance.
- Primary external art/motion comparison: [official Manor Lords game](https://www.hoodedhorse.com/games/manor-lords). Supporting comparisons: [Foundation](https://www.polymorph.games/) and [Farthest Frontier](https://www.farthestfrontier.com/). Use publisher-provided real gameplay or screenshots, never copied models/textures.

## One coherent transformation, not 100 incremental approvals

Choose the largest *complete playable experience* gap revealed by real footage. Work on a cohesive, scene-scale, cross-system transformation that can extend across many hourly runs and multiple commits. The lead may select approach, architecture, assets, code organization and number of iterations. Examples of possible outcome areas, not a mandated decomposition: a convincingly inhabited workday village, a terrain- and foliage-rich walk through the settlement, or a lived-in grown city with understandable production and social life.

**Preserve a workstream across runs:** carry its goal, baseline, integrated tasks and failed critic notes forward. Do not declare a checkpoint completed simply because one component turned green. Small tests/fixes can support the bigger result, but should not get standalone victory headlines. Do not increase visual complexity if the game stops running meaningfully or performance collapses.

## Experience acceptance — the three simultaneous gates

| Gate | What a viewer must actually observe | Status today |
| --- | --- | --- |
| **LOOKS substantially better** | Recognizable transformed original 3D environment, buildings, vegetation, people, shadows and lighting in both a wide settlement and close workday view; concrete comparison against the old game and the Manor Lords bar. | **FAIL / NOT PROVEN** |
| **FEELS substantially better** | Continuous moving in-game footage shows natural animation, camera movement, visual feedback and legible responsive controls, including small-screen operation; not a static camera or slideshow. | **FAIL / NOT PROVEN** |
| **PLAYS substantially better** | In real autonomous gameplay, citizens visibly decide, travel, work, exchange resources, build and react in coherent sequences; visitors can follow and understand those outcomes without relying on printed counters. | **FAIL / NOT PROVEN** |

These gates are **AND**, never OR: a transformation checkpoint passes only when **all three** materially improve with proof and none has a serious regression. Technical integrity is required but cannot substitute for a look/feel/play win. Keep the separate **ULTIMATE commercial-reference gate** as FAIL until the running game actually stands up against official Manor Lords imagery and comparable action.

### Minimum playable demonstration

- Record *genuine uncut* browser gameplay with motion and interactions, plus matched camera stills, from the **same stable seed, world-state stage, camera and resolution** in the baseline and candidate. Show at least: (1) Day-1 world/settlement view and camera traversal; (2) a close-up citizen workday demonstrating real decisions/actions; (3) a populated Day-120 scene with houses, economy and social dynamics. Inspect a 390px mobile viewport and controls. A short edited highlight may supplement but never replace raw proof.
- Use independently sampled fresh-context critics when actually available. Randomize baseline/candidate labels for blind A/B. For a **verified transformation win**, require at least 4 of 5 independent reviewers to judge the candidate *materially stronger* in each LOOK/FEEL/PLAY category, with their reasons grounded in actual footage, and no unresolved critical blocker. If reviewers, videos or identical test conditions are unavailable, report **NOT PROVEN**, not PASS.
- Reviewers must identify the biggest remaining visual/gameplay failure and send it to the lead for the next integrated revision. If the candidate is barely distinguishable without a diff mask or annotated explanation, the quality gate automatically fails.

## Non-negotiable engineering guardrails, not victory metrics

- Preserve authoritative fixed-step simulation, seeded randomness, valid save/restore and byte-identical replay, full citizen/structure representation, safe navigation, browser/GL error-free behavior, bounded resources and nonnegative economy. Do not script fake work or substitute a prerecorded image for gameplay.
- Keep existing under-160,000 scene triangle gate until a *profiled, reviewed* replacement budget proves better real device experience; do not create fake fidelity through huge geometry and uncontrolled overdraw. Do not make this arbitrary cap the overall success target.
- Measure actual workload, p50/p95/p99 CPU and, when available, GPU frame times and memory growth for Day-1, active workday and Day-120, on stated hardware and resolution. SwiftShader is software and is **not** evidence of sustained physical-GPU FPS. Performance regressions block experience acceptance.
- Preserve 390px mobile legibility, keyboard access, reduced-motion and accessible status feedback. Test interaction transitions, not just DOM presence. Distinguish accelerated 120-day *simulation* from real-time unattended soak.
- TDD and CI remain necessary. Tests passing and technical budget PASS must never be phrased as art/UX/playability success.

## Reporting and stop condition

Keep `public/tiny-kingdom/progress.html` prominently showing the **Transformation Scorecard** rather than number of iterations. Each integrated milestone needs both baseline and candidate playable links, source SHAs, matched screenshots/video, blind reviews (or clearly unavailable status), observed look/feel/play difference, reliability and performance, and an explicit strict PASS/FAIL/NOT PROVEN verdict. Append history instead of rewriting evidence.

Report real experience milestones and critical blockers. Continue improving the same transformation until the experienced game's quality genuinely wins independently evaluated comparisons and all gameplay, accessibility, determinism, stability and measured performance gates pass, or the user explicitly stops. Keep PR #64 draft; never merge without separate user approval.
