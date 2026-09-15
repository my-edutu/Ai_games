# 22-Skill Review — AI Zombie Survival

## Verdict

Candidate vertical slice improved; **not production-ready**. The 22-skill pass closes several gameplay-integrity and broadcast-readability gaps, but runtime capture-chain evidence, multi-hour soak/chaos, restore/recovery drills, and independent R5 review remain open.

## Skills applied

1. game-creative-direction
2. gameplay-progression
3. difficulty-failure-balancing
4. procedural-generation
5. game-economy-rewards
6. platformer-experience-review (adapted to survival readability/fairness)
7. game-architecture
8. autonomous-agent-design
9. deterministic-simulation
10. game-physics
11. game-audio
12. game-feel-vfx
13. livestream-hud
14. viewer-retention
15. audience-interaction
16. crowd-moderation
17. security-privacy
18. long-running-reliability
19. performance-optimization
20. game-analytics-experimentation
21. simulation-qa
22. production-readiness-review

## Material findings and fixes

### F1 — Progress was too flat
Moment → ordinary long-run survival. Expected → visible nested progress and changing stakes. Observed → time advanced and hordes grew, but there was no explicit milestone grammar. Why → viewer progress relied on HUD counters rather than a structured run arc. Severity → P1 quality gate. Exact improvement → add holdout/secured/scarcity/siege/veteran milestones, next-day target, dramatic-pattern state, resource attrition, and multi-axis horde speed escalation. Verification → deterministic progression tests and broadcast-view assertions.

### F2 — Survivor autonomy was not explainable enough
Moment → AI changes from patrol to combat/scavenge/repair. Expected → visible, bounded goal and intent. Observed → only an action enum. Why → behaviour looked reactive rather than purposeful. Severity → P1 experience. Exact improvement → add goal, intent, confidence, fallback, plan age and stuck recovery fields; keep public text templated. Verification → broadcast intent remains bounded and contains no raw audit/provider identifiers.

### F3 — World generation had no hard validator
Moment → new seeded run. Expected → reproducible valid districts, loot ownership, finite positions, safe-house presence. Observed → deterministic generation but no validation contract. Severity → P1 integrity. Exact improvement → deterministic safe-house clearance plus `validateWorld()` with duplicate-ID, finite-coordinate, orphan-loot, district coverage and safe-house checks. Verification → 10-seed campaign produced zero world-validation failures.

### F4 — Viewer effects lacked pacing semantics
Moment → repeated supply drops. Expected → idempotent bounded influence with cooldown. Observed → duplicate IDs were blocked but new IDs could stack at the maximum immediately. Severity → P1 fairness. Exact improvement → per-effect logical-tick cooldown reduction, resource caps, bounded audit history, explicit audit status/reason. Verification → second supply event within cooldown adds no more than six food units and cannot set terminal outcome.

### F5 — Camera could churn between similarly scored moments
Moment → adjacent combat/defense/scavenge events. Expected → stable broadcast framing. Observed → camera selection had no hysteresis. Severity → P2 presentation. Exact improvement → optional previous-camera contract with score hysteresis and target validity. Verification → regression test keeps a still-valid prior defense shot when the candidate improvement is insignificant.

### F6 — Audio/VFX degradation policy was implicit
Moment → high zombie count or slow frame. Expected → protect danger/goal cues before cosmetics. Observed → no reusable quality/audio policy. Severity → P2 reliability/readability. Exact improvement → semantic audio mode/voice budgets and high/medium/low presentation tiers with critical cue scale fixed at 1. Verification → low tier selected under 500-zombie/30ms conditions while critical cues remain preserved.

### F7 — Technical corruption could masquerade as gameplay
Moment → non-finite entity state. Expected → quarantine, not game loss. Observed → no explicit public health classifier. Severity → P0 integrity. Exact improvement → `healthSnapshot()` checks world validity, resources and bounded events, returning healthy/degraded/quarantine. Verification → Infinity coordinate deterministically returns quarantine.

## Performance evidence

Fresh 10-seed, 250-zombie, 240-tick campaign in the implementation container:
- world validation failures: 0
- quarantine runs: 0
- tick p50: 1.097 ms
- tick p95: 1.144 ms
- worst: 1.380 ms

A broader 40-seed × 900-tick profiling attempt exceeded the execution window. Full-state `structuredClone` remains a known headless performance cost and should be profiled before production scale is claimed.

## Current regression evidence

`npm test` in the reconstructed game package: **23/23 passing** after the 22-skill changes, including deterministic replay, render-delta independence, barricades, infection, day/night, horde spawning, 250-zombie finite-state stress, world validation, safe broadcast view, semantic audio, quality tiers, quarantine detection, viewer cooldown/idempotency, and camera hysteresis.

## Readiness truth

This remains a candidate/draft build. Open evidence gates: actual browser/OBS capture-chain screenshots in this environment, mobile/compressed capture review, audio loudness/capture-chain measurement, restore/snapshot implementation and chaos drill, 24/72-hour soak, seven-day canary, and independent production-readiness review. Rescue/evacuation remains outside the implemented vertical slice and must not be implied by presentation.
