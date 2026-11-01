# AI Dungeon — Transformation-Focused Gauntlet Protocol

**Controlling charter:** [AI_DUNGEON_TRANSFORMATION.md](AI_DUNGEON_TRANSFORMATION.md). Effective 1 November 2026, this replaces micro-improvement acceptance for **Game 9**. The old 14–56 round records remain valid engineering history, but **none individually demonstrate a transformed game**.

**Lead instruction:** Transform the actual **AI Dungeon — Endless Adventure** on existing draft PR #49, not a mockup. Work toward a coherent game that **looks, feels and plays substantially better**, using real Diablo IV dungeon footage as the main quality direction, No Rest for the Wicked for environments, and Path of Exile 2 for combat. Preserve authored/licensed provenance and deterministic authority.

Keep one large, integrated transformation milestone across implementation sessions; the lead chooses technical approach and can subdivide, build, test and commit smaller pieces without claiming those pieces are accepted Gauntlet wins. At every session, read the locked baseline SHA/capture, latest live game, current PR HEAD, reviews and the active milestone in the progress ledger. Prioritize the greatest *viewer-perceived* deficiency, not the next easiest passing test.

## The only quality acceptance gate

The actual game is independently compared **BEFORE vs AFTER**, pinned at equivalent scenes/seed/camera where practical, across **traversal, combat, boss, transition, defeat/restart and mobile**, with real captured movement/audio. Fresh independent critics blindly judge **looks**, **feels** and **plays**, with a clear majority preferring AFTER in all three. Check the candidate against authentic AAA references for remaining quality distance. Only then may the milestone be marked `TRANSFORMED_VERIFIED`—provided safety, fairness, accessibility, performance and replay gates also remain healthy.

**Passing CI is a safety gate, not the transformation criterion.** A mesh-count reduction, CSS adjustment, single effect, colour shift, test pass or isolated bug fix is **implementation progress** and cannot pass this gate. If critical evidence is missing, record `NOT_RUN` or `UNVERIFIED`; default to `IN_PROGRESS / NOT_TRANSFORMED`. No unobserved FPS, visual A/B majority, professional character-asset fidelity or production readiness claims.

## Operating loop

1. Check exact draft PR head, active milestone, pinned baseline, real gameplay and prior critic feedback. Never reset the baseline simply because the PR advanced.
2. Select one ambitious cross-cutting playable leap, not a small testable patch as the end goal; choose builder decomposition autonomously.
3. Use separated builders and independent fresh-context critics/subagents if available; use ultracode only if actually installed. Iterate on substantive criticism.
4. Capture **actual integrated game** on desktop and mobile with motion and audio; compare to the fixed BEFORE plus matched professional references, not only diagnostics.
5. Keep TDD, deterministic authority, licenses, browser/CI, performance and accessibility as **non-negotiable guardrails**. Treat failures as blockers but do not confuse green checks with success.
6. Update `public/ai-dungeon/gauntlet-history.json` milestone + `/dungeon/gauntlet` proof and the active transformation spec. Commit to the existing draft PR only. Continue until accepted by critics or the user stops.

Reference evidence: current locked baseline commit `281735d0910c6b2443648af976003d50412ee324`, [genuine Chromium baseline screenshots/videos](https://github.com/my-edutu/Ai_games/actions/runs/41302939553/artifacts/13081734898). Original official Diablo IV gameplay is the visual benchmark; no copied proprietary assets.

**Important:** The progress page is a live *viewer*, not an autonomous worker executor. The existing hourly automation runs the work and may be paused by the user. No unseen independent critic or ultracode is implied.
