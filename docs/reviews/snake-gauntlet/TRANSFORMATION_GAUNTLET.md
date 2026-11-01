# Autonomous Snake — Transformation Gauntlet (supersedes micro-improvement cycles)

**Decision date:** 2026-11-01  
**Scope:** existing draft PR #52, `feat/autonomous-snake-3d-gauntlet`. Keep unmerged and undeployed.  
**Fixed creative comparison:** real gameplay of **Snake Pass** (primary) and **ASTRO BOT** (secondary scene-art reference). These references are for quality judgement only; all game assets must be original.

## The new north star

> Accept work when **the running game itself looks, feels, animates, and plays substantially better as a coherent whole**. A newly green test, a shader instruction, a tiny screenshot delta, a new SVG, a commit, or another round number is **not a Gauntlet victory**.

The old cadence of one isolated micro-improvement followed by “round passed” is **retired as the outcome metric**. A small technical fix is legitimate *inside* a large transformation milestone, but it does not count as a milestone. Continue the same milestone across as many work sessions and cohesive commits as necessary.

## Four interdependent transformation pillars

### 1. Environment: authored living garden, not a decorated grid

Deliver a recognizable original world with purposeful composition at full board overview and close character scale: sculpted terrain and shoreline, coherent ruins/architecture, diverse vegetation silhouettes and density, layered distance and atmospheric perspective, natural water boundaries, ground material/geometry relief and believable integration. Stop using repeated cylinders, flat checkerboard stone, empty teal horizons or floating islands as stand-ins for a finished scene. Keep every authoritative cell, fruit, hazard, obstacle and portal distinctly readable without changing their real coordinates or outcomes.

**Proof scene:** authentic uninterrupted footage showing full garden overview, approach to a structure, movement alongside water/vegetation and back to the board. The world's shape must look materially transformed in matched 1080p and phone captures.

### 2. Character: production-quality expressive hero

Make the serpent one cohesive animal rather than separate spheres and tubes: purposeful skull/neck/body/jaw joins, scale and belly transitions, subtle movement mass, believable turn banking and follow-through, anchored head and tapered tail, eye focus/blinks, anticipation and recovery around fruit contact, danger responses and safe portals. Maintain low/high-detail consistency and original procedural asset ownership. A simple 0.05-cell wiggle alone is not acceptance.

**Proof scene:** continuous authenticated snake footage through turn, food contact/eating, hazard anticipation and portal or restart where the seeded runtime produces those states; close/full-board views must both hold up.

### 3. Materials, lighting and atmosphere: coherent physically grounded finish

Give stone its weathering and edges, foliage its volume and subsurface/value variation, water depth and movement, and the snake a layered scale/skin response. Art-direct key/fill/rim light, ambient occlusion/contact, shadows, fog and weather so the environment is legible, lush and spatially credible. Build fidelity with appropriate LOD, batching and stable resource ownership, not indiscriminate expensive passes. One baked texture edit, shadow-atlas tweak or small color difference alone is not a win.

**Proof scene:** matched close/wide/portrait screenshots with visible light direction, depth separation, convincing material response and no lighting or shading discontinuities.

### 4. Gameplay feel, interface and sustained presentation

The autonomous hero remains the focus. Make growth, route choice, danger, portal transitions, collection, achievement, ending, intermission and recovery immediately understandable as a living game, not a debug display. Use smooth coherent camera choreography and restrained HUD hierarchy; preserve mobile legibility, mute, clean feed, reduced motion and accessibility. The stream must render smoothly without hiding geometry, decreasing scene fidelity artificially or counting RAF callbacks as rendered frames.

**Proof scene:** representative real, unedited gameplay footage including goal, intent, hazard/food, meaningful result/restart, both desktop and mobile. Validate actual render submissions and real-device presentation separately.

## Transformation milestones (cross-functional, not per-line rounds)

| Milestone | Deliverable | Status |
|---|---|---|
| **T0 — lock real baseline** | Capture same-seed/same-snapshot desktop 1920×1080, phone portrait/landscape, direct/overview/detail, 45–90 seconds of real play, baseline profiler and honest comparison rubric. | **BUILDING** — historical evidence exists, missing a single current matched comparison package |
| **T1 — living-world rebuild** | A richly authored 3D garden/ruins set with authored depth, varied ecosystems, believable geometry and light, kept readable at board scale; integrates material and render-budget work. | **BUILDING — first original four-sector coast/ruin/foliage scene integrated as an unaccepted candidate, exact-source real-browser proof/critical review pending** |
| **T2 — hero serpent + animation system** | Cohesive anatomy and clear expressive movement, eat/turn/danger/portal motion across actual gameplay, body contacts and head-follow camera; no phantom collision/AI changes. | **PLANNED** |
| **T3 — cinematic gameplay experience** | Complete spectator UX, event feedback, camera, sound/transition states, mobile/desktop composition and visible AI decisions across an uninterrupted play sequence. | **PLANNED** |
| **T4 — integrated final scene and stable playback** | Combine T1–T3, optimize only measured dominant CPU/GPU paths, verify repeatable smooth frames, bounded resources, recovery, deterministic replay, independent whole-game visual and gameplay acceptance. | **PLANNED** |

Milestones may overlap technically. The **status is not incremented** merely because CI passes. Use `PLANNED → BUILDING → VISUAL_REVIEW → ACCEPTED`; use `REJECTED` if actual images/film show no obvious improvement or regressions. Keep working on a rejected milestone rather than assigning an inflated round number.

## Acceptance rubric: experience first, engineering necessary

### A. Materially better than the prior complete build

For the same unmodified public seed/state and roughly matched camera/framing, present *actual running WebGL* before-and-after images and motion, not renders from ImageGen, marketing art or mockups. Judge **five categories** on an anchored 0–5 rubric:

| Category | 1/5 | 3/5 | 5/5 |
|---|---|---|---|
| Environment and scene depth | empty/primitive/repeating | coherent but visibly procedural | distinctive, varied, fully authored and spatially convincing |
| Character/anatomy | assembled or floating | expressive but obvious seams | cohesive, polished, readable in motion |
| Motion and gameplay feel | rigid/jerky/unclear | workable feedback | organic, impactful, clearly causal without obscuring truth |
| Materials and lighting | flat/inconsistent | varied with some believable light | compelling material response and deliberate lighting throughout |
| Presentation and legibility | crowded/unreadable | functional responsive UI | effortless goal/AI/danger comprehension across cameras/mobile |

A transformation milestone needs **visible, unmistakable improvement in the full frame**, with strong gain in its target category **and** no significant loss in other categories. Ideally at least two fresh-context critics independently score the anonymized before/after and reference footage; record their disagreements. If independent critics cannot actually run, mark `SELF-REVIEW / ACCEPTANCE PENDING`—never invent a win. Do not use a percentage of changed pixels as quality evidence. The official Snake Pass bar stays explicit; acknowledge where it still wins.

### B. It plays substantially better

Record **45–90 seconds or longer** of unmodified autonomous gameplay (and separate valid scenario clips if needed). Include turn, growth/fruit, threat, portal, result/restart sequences only as generated by the real runtime. Review temporal continuity, animation, camera, cues and intuitive play comprehension. A still image or CSS-only preview cannot validate this.

### C. It stays correct and usable

Preserve fixed-step deterministic game authority, immutable snapshot schema, public information boundaries, collision/scoring, portal discontinuities, errors/fallback, recovery, accessibility/reduced motion, portrait/landscape legibility and bounded resources. Use red-green focused tests and a full relevant CI run, but **all green tests by themselves do not earn acceptance**.

### D. It is genuinely smooth

Keep the existing desktop browser gate **≥17 actual renderer submissions** per its one-second measurement (and existing timing/gap checks). RAF callbacks, diagnostic partial scenes, WebM nominal fps, and GPU fence completions **do not** establish displayed FPS. Require repeated full-scene passes and p50/p95 GPU/CPU costs on a consistent reference setup; aim for stable **≥30 delivered FPS** on documented target real hardware before calling the experience smooth. Verify performance with all gameplay-relevant geometry and cues enabled. If not met, label the visual milestone *provisional* and the integrated Gauntlet **NOT ACCEPTED**.

### Whole-game exit gate

Only declare **GAUNTLET ACHIEVED** after all four pillars are coherent at full-scene scale, independent reference reviewers find the *complete* game substantially better than its baseline and competitively close to the fixed quality references, real recorded play is compelling and comprehensible, and all correctness/performance/soak/recovery gates have solid evidence. No evidence means **OPEN/FAIL**, not a tie or presumed pass.

## Lead-agent execution protocol

1. Read the actual current PR head, this charter, approved original spec, progress ledger, latest video/stills and exact-head CI. Ignore stale historic checkpoint claims.
2. Pick the single **largest experience-level defect** across the actual game, not the easiest one-line issue. Write a short transformation milestone brief showing intended whole-scene before/after; define which components change together.
3. Build a **substantial vertical outcome** across character/world/material/lighting/animation/camera where needed. Use specialist builder and separate genuinely fresh critic when tools permit; when not, say so explicitly. The coding lead chooses approach, not a fixed number of tiny rounds.
4. Preserve authority/safety; test red-green; collect actual screenshot *and motion* evidence in default stream, detail and phone modes. Run existing CI and resource/performance gates.
5. Critic decides: `REJECTED`, `VISUAL_REVIEW`, `ACCEPTED` or `PROVISIONAL—PERFORMANCE`. If the experience does not look clearly transformed, continue the *same milestone*. Never announce a micro-tweak as major progress.
6. Update this document's milestone ledger or linked `/progress` status and PR with dated evidence, current exact head, honest conclusion and next biggest whole-scene defect. Do not merge or deploy.
7. Do not replace reference media with unlicensed assets, invent independent reviewers, lower required FPS, skip rendering tests, or move gameplay logic to the presentation layer.

## Current baseline context (not an acceptance claim)

At R56 (`11ffded`, 2026-11-01), the old Gauntlet had dozens of individually verified procedural refinements and functional checks, but its whole-game art/motion benchmark remained **LOSE** and desktop submission gates were still failing. [Exact-head focused run 41303014224](https://github.com/my-edutu/Ai_games/actions/runs/41303014224) failed the unchanged desktop frame-delivery check at **12 actual renders / 1001.8ms** (minimum 17). That is a **starting diagnosis**, not an improvement claim. T0 must capture and freeze the current image/motion baseline, then T1 must produce a visibly different complete garden scene. The previous historic progress captures remain historical rather than overwritten.

**User direction:** “We need to change from a micro-improvement Gauntlet to a transformation-focused Gauntlet. The acceptance criterion should be whether the game itself looks, feels and plays substantially better—not simply whether another small change passed CI.”

## November 1 T0/T1 build continuation — first full-garden candidate (not an acceptance)

**Source baseline:** PR #52 head `108e2e439aab1f3fe4cf49019c1aa9fe5630feb6` before the new production code, renderer Git blob `ae42da49444ae250d98e1e0181e3b2c2ae195dfa`, existing world Git blob `fc01f7a55177456ee1cdbfae348a053c932064c6`. Previous exact-head [Chromium/WebGL run 41304435775](https://github.com/my-edutu/Ai_games/actions/runs/41304435775) passed 44/45 browser tests, but the original desktop 1-second gate **FAILED with 16 actual renderer submissions over 1003.9 ms, minimum 17**. Its 61 animation callbacks are neither renderer submissions nor hardware presents. General current-head run 41304435900 was cancelled. This is baseline diagnostic evidence, not a pass or new performance trend.

**New production candidate:** `public/snake-stream/living-garden.mjs` plus bounded, source-reversible integration in `renderer.mjs`. Four distinct shoreline/planting sectors gain true contoured terrain and water-facing cliff profiles, low broken masonry, ivy/fern/reed silhouettes, large bastion silhouettes and a shared original weathering/vertex-color treatment. Four prebuilt, finite static material batches enter the existing live Three.js camera/lighting/static cache; no WebGL fake backdrop, new gameplay grid, hidden cues, camera trick, commercial textures or simulation edits. Existing world and serpent modules remain byte-identical. This spends additional geometry, fragments and a single procedural texture deliberately; it **may worsen already failing 1080p throughput** and must be profiled before acceptance.

**Exact-source evidence harness included:** a reversible predecessor-renderer Git-blob comparator, new Node model/invariant checks, a same-public-frame actual WebGL original/current capture test at desktop, close hero, portrait and 1920×1080, plus two 55-second *unmodified authoritative autoplay* recordings. The tests and recording scripts being committed **are not equivalent to completed captures or green runs**. Do not claim screenshot wins, actual 55-second footage, smooth rendered/presented FPS, T0 lock, independent acceptance, or material T1 success until the actual updated-head artifacts are produced, inspected and reproducible. Criticism status: **SELF REVIEW / ACCEPTANCE PENDING**.

**Remaining whole-frame gaps:** repetitive pale board geometry and small distant hero remain; original art still lacks commercial-grade volumetric vegetation/ruin lighting and seamless snake acting; new banks may obscure/overcrowd portrait and increase GPU load; movement/cinematic feedback is not yet co-designed with the environment. T0 **BUILDING**, T1 **BUILDING**, T2/T3/T4 **PLANNED**, whole Gauntlet **NOT ACCEPTED**, DRAFT/unmerged/undeployed. Next decision must be based on the real 8-picture A/B and live films, original strict gate, independent review where available, and full-event correctness—**reject and continue T1 if the whole scene is not obviously transformed**.
