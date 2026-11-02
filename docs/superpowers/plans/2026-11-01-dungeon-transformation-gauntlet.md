# AI Dungeon — Transformation Gauntlet Operating Plan

> **For agentic workers:** Use superpowers:subagent-driven-development where available (otherwise explicit direct implementation and independent review); execute milestone work over as many sessions as needed. Small code commits are not accepted transformation rounds.

**Goal:** Move the real Game 9 from visually repetitive prototype to a coherent high-quality 3D autonomous adventure that independent critics clearly prefer over the locked baseline in **LOOKS, FEELS and PLAYS**.

**Spec:** `docs/gauntlet/AI_DUNGEON_TRANSFORMATION.md`

**Architecture:** Existing GitHub draft PR #49, seeded autonomous TypeScript authority and read-only Three.js presentation; no speculative engine rewrite required. Lead agent may choose a different implementation strategy if backed by a real integrated quality result and safe migration.

**Tech stack:** Existing Node 22 + Three.js + Playwright real Chromium + real captured stream state; preserve stable seed/replay contracts, assets with documented licenses and mobile accessibility.

**Locked BEFORE**: source SHA `281735d0910c6b2443648af976003d50412ee324` and screenshot/video [artifact 13081734898](https://github.com/my-edutu/Ai_games/actions/runs/41302939553/artifacts/13081734898).

## Acceptance-driving work (outcome checkboxes, not a fixed number of rounds)

- [ ] **Experience audit:** Observe the genuine baseline and record an equivalent traversal, fight, boss, transition, defeat/restart and mobile sequence with camera and audio. Name the most damaging integrated gap.
- [ ] **One ambitious playable leap:** Pick and implement a connected improvement that changes what a viewer experiences—character proportions/animation, scene composition, combat contact/audio and autonomous tactics as needed. Allow multiple subcommits; no isolated micro-fix counts as a completed milestone.
- [ ] **Integrated playthrough:** Capture the new real game under the same comparable scenarios. Check the actual motion, combat pacing, environmental richness, AI consequences and mobile clarity; revise the entire slice from critic feedback.
- [ ] **Independent judgement:** At least three fresh-context independent critics blindly compare BEFORE/AFTER for LOOKS, FEELS and PLAYS and report specific shortcomings. Do not substitute tests, model self-praise, single screenshots or engine metrics for their verdict.
- [ ] **Safety and release checks:** Keep replay/CI/browser, licensed assets, accessibility, responsive performance and resource stability green. Treat these as guardrails, not the quality win.
- [ ] **Quality acceptance:** Mark `TRANSFORMED_VERIFIED` only if a clear majority prefers AFTER in all three pillars over representative scenes and the integrated playthrough is actually better. Otherwise preserve `IN_PROGRESS / NOT_TRANSFORMED` and resume the milestone on the next run.

**Review focus:** Character anatomy reads as toy-like at distance; authentic animations and weapon-to-target contact; five-minute encounter storytelling rather than idle animations; repetitive square grid and camera occlusion; real browser/mobile rendering; independent before/after bias; performance stability.

**Do not:** Merge PR #49, reset the baseline after each small change, report “90% AAA” without independent evidence, or count technical test numbers as transformation progress.
