# M1 character-physicalization candidate — unverified

Date: 2026-11-02
Draft PR: https://github.com/my-edutu/Ai_games/pull/49
Candidate: a20bf79e0f55dd5a1acd543411c0a1ecff86a284
Unchanged baseline SHA: 281735d0910c6b2443648af976003d50412ee324
Verdict: IN PROGRESS / NOT TRANSFORMED.

## Main problem and implemented remedy

Previous real imagery showed toy-like armor/body proportions. During genuine fatal events the skinned characters were primarily rotated as rigid blocks, an especially obvious visual weakness in the boss-to-defeat scene. An original pure damage planner now translates actual HP-zero truth to differentiated skeletal shoulder/elbow/leg/spine poses; the renderer applies these after genuine GLB animation, sharing the same reversible quaternion bookkeeping as attack and gait. A full-party terminal intermission holds the resulting static skinned bodies; reduced-motion never makes additional animation mandatory.

Actual grouped/bone-bound armors now receive deterministic original steel/bronze/bone/leather/cloth embossing via at most five shared 96px RGBA textures, reusing existing draw groups and vetted offline CC0 GLB assets. The game authority, replay, AI and hitboxes remain unchanged. Original browser fixture still navigates a naturally reached terminal state and now requires at least one actual skinned defeated model rather than a mocked splash. Both desktop and mobile PNGs are requested in the fixture.

## Evidence still missing

No source change, passing type check, static test, texture count or screenshot alone is an M1 transformation. Exact-head CI foundation, visual, and catalogue runs were queued when first queried. Authentic candidate gameplay/animation videos and original audio, matched BEFORE/AFTER across real traversal/combat/boss/descent/loss, independent blind reviewers, mobile legibility, GPU p95 and soak are all UNVERIFIED. A disconnected coding workspace prevented independent critic subagents and local browser artifact inspection. No critic vote is recorded. Prior baseline artifact: https://github.com/my-edutu/Ai_games/actions/runs/41302939553/artifacts/13081734898 .

## Next integrated task

Open exact-candidate CI screenshots and video, inspect first the Warden confrontation and the real three-body defeat on wide and portrait views, particularly elbow/knee articulation, material shimmering, armor clipping, occlusion, low-end frame-time and visible AI tactics. Correct the largest real flaw. Then obtain continuous same-seed before/after journey footage and 3+ fresh blind critics who vote on LOOKS, FEELS and PLAYS, while maintaining CI/replay/accessibility gates.
