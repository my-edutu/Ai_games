# Infinite Tower Climb — Transformation-First Gauntlet Design
**Decision:** 2026-11-01 · Supersedes the micro-improvement acceptance method, not existing simulation safety standards.

## Intent
The player and viewer must experience a **materially different and better game**, not a stream of successfully tested micro-changes. The benchmark is the running Infinite Tower Climb at identical representative gameplay situations, with its prior playable candidate frozen as a baseline. CI is a prerequisite to shipping, **never a proxy for improved game quality**.

## What changes
- **Unit of work:** A cohesive, transformative playable vertical slice. A slice may require a series of individually tested tasks; code commits and Ralph-loop iterations are implementation mechanics, not acceptance milestones. Carry the same slice across scheduled runs until it can be evaluated as a whole. Prefer coherent cross-cutting improvements to scattered local patches.
- **Scope of comparison:** A frozen current baseline, the new actual playable game, and official reference footage. Create matched, independently inspectable pairs from **real continuous gameplay**, not render-only mockups, static screenshots or an attractive landing page.
- **Three non-negotiable outcomes:** **LOOKS** (characters, materials, lighting, worlds, composition), **FEELS** (physical movement, camera, animation, feedback, sound), **PLAYS** (compelling autonomous decisions, route readability, meaningful hazards/combat, progression, recovery, repeatable fun).
- **No UI clutter:** Gameplay shows only objective/height, essential health/danger, contextual choices, and accessible captions when needed. The development tracker belongs exclusively on /tower/gauntlet.
- **No engine rewrite for its own sake.** The lead agent chooses the approach. Correct fixed-step deterministic authority, snapshots, replay, disclosure, security, accessibility and graceful recovery remain binding.

## Frozen baseline and required observation set
At the start of each transformation, record the exact baseline SHA, seed(s), graphic quality setting, capture environment and version. No moving the baseline mid-comparison. Freeze at least these three actual-play scenarios:
1. **Everyday ascent:** normal-speed continuous movement through a floor with visible landings, traversals and AI route choices.
2. **High stakes:** moving/hazardous platforms and a real enemy/guardian confrontation including anticipation, contact and recovery.
3. **Complete cycle:** progression to a meaningful milestone, authentic failure or win, then restart or continued ascent.

Capture a matched **baseline and candidate gameplay recording for each scene, at least 60 seconds each**, recorded at identical seed, viewport, tier and capture method; review in desktop and representative phone layouts. Preserve real time, source SHA, evidence artifact, camera and fps metadata; disclose incomplete or truncated captures. A screenshot may *support* a case but cannot replace a clip or full-play observation for FEELS/PLAYS.

## Acceptance — substantially better game (NOT build success)
Require **five genuinely independent, fresh-context, blind randomized reviewers**, each viewing comparable before/after evidence without knowing which build is new or seeing builders' arguments. Each critic must inspect all three scenes and provide concrete observations in all three pillars. In each pillar, at least **4 of 5** must prefer the candidate (with reasoned evidence); ties and no-review votes never count. Critic feedback must name visible, felt or playable changes rather than tests passed. A candidate favored only for LOOKS while FEELS or PLAYS regress is a failure.

Gate a *transformation* only if all of the following hold together:
- All three pillar votes independently cross the substantial-preference threshold.
- There are no unresolved material P0/P1 gameplay, camera, motion or usability problems in the assessed clips.
- The candidate genuinely runs the autonomous simulation in complete scenarios, preserves replay/authority and accessibility, and is sufficiently performant on declared target hardware. Collect hardware frame-time p50/p95/p99 and memory under realistic scenes; renderer submissions are **not** device FPS. Set and publish the target budget for supported devices before grading.
- All technical safety tests pass. They can **veto** promotion, but cannot create a positive transformation verdict on their own.
- A fresh independent quality critic signs a whole-build verdict from actual gameplay. The lead agent cannot self-certify acceptance. If builders/critics/ultracode or live browser are unavailable, report **NOT EVALUATED**, never a guessed PASS.

The official **ASTRO BOT — Rising Heat** footage is the action/readability reference, with **Jusant** for traversal weight and scale and **Returnal: Tower of Sisyphus** for high-end materials, light, scene coherence and intensity. These are references to inspect, not assets to copy. Benchmark competitiveness remains separately open until inspected; a merely green CI run does not advance it.

## Lead-agent method
Inspect the baseline and candidate gameplay first. Choose the **largest systemic quality deficit** likely to change the whole experience; plan a coherent vertical-slice transformation addressing it, potentially spanning character, animation, tower, sound, encounters, feedback and interface. Fan out specialist builders and **separate** fresh-context critics when available. Each critic uses actual output and sends the largest remaining systemic gap back; keep iterating the same slice. Avoid an arbitrary fixed number of rounds.

Each scheduled run should execute substantive work on the current slice (or a bounded, honestly identified blocker), preserve code and evidence, and only update the *quality gate* after full comparable captures and critic opinions exist. Milestones are **playable experiences and matched videos**, not commit counts. A minor test-only patch is a safety fix, not a transformed game.

## Progress page and evidentiary truth
The /tower/gauntlet page leads with the three **LOOKS / FEELS / PLAYS** verdicts, real baseline/candidate clips, current transformation objective and the most consequential remaining gap. A historical engineering journal sits below as supporting detail. An empty clip, incomplete review or pending performance score must visibly say **NOT EVALUATED**. Persist the frozen baseline and evaluator state in `public/infinite-tower-climb/gauntlet/transformation.json` independently of the high-churn legacy `progress.json`.

Never label a run as transformative because of 645 passing tests, successful WebGL initialization, a single corrected pose or a prettier screenshot. Do not merge or deploy without the normal branch review and user authorization.

## Measurable release posture
A **TRANSFORMATION VERIFIED** verdict is for the before/after experience and guardrails, not an automatic AAA/production-ready claim. AAA parity, long-run production-equivalent soak, security, provider validation and final R5 remain independent gates.

**Rejected alternative:** scoring each isolated patch as a Gauntlet win. It rewards optimization of tests while failing the user's actual goal. **Also rejected:** a giant untested engine rewrite; it risks deterministic integrity and cannot show meaningful playable progress.
