# Tower PR68 — source-real guardian/shutter arena on the playable sixth deck

**Date:** 2026-11-04 · **Transformation:** OPEN · **Quality:** NOT EVALUATED.

## Source diagnosis

A direct comparison of `generateTowerChunk`, `generateTowerContent`, the 12-tick physical shutter stage, and previously recorded 20Hz gameplay identified a systemic disconnect: random hazards are anchored to rise slots 1–5, while the guardian is authored to patrol the *sixth* support deck. The cinematic climber–guardian–closing-shutter crossfire could scarcely occur as a genuine same-deck event, regardless of camera, light or sound improvements. Green source-video jobs cannot prove a mechanic which its level generator rarely/never puts together.

## Connected real-game change

A new **explicitly opt-in**, fixed-step `guardianArenaHazards` source-generation option places one periodically closing crusher on the **actual guardian's penultimate ascent deck**, with two body-width clear ground exits. It has a real collision body, damage, published 12-tick charge countdown and deterministic named RNG phase; no invented attack, collision, route or camera event. The active live Three.js stream host opts in, whereas the old source and the frozen baseline remain unchanged. Existing autonomous 12-tick counterplay now has a genuine source-world hazard beside a real guardian. Existing stage machinery, skinned evasive animation, action-first lens/lighting and optional audio respond to that authentic threat. Source config opt-out remains byte-equivalent in chunk generation to the original.

The real authored shutter uses the existing hazard budget, replacing a regular hazard slot if full. No new rendering pass, geometry type, asset download, seeded untracked randomness, remote service or HUD label. Physics, health and score remain authoritative. Supported-device rendering and whether the crossfire is visually compelling **remain unmeasured**. Historical seeds/configs missing the opt-in retain their previous deterministic level generation, replay and checksum semantics.

## Evidence status and acceptance veto

The immediately preceding [original-host capture](https://github.com/my-edutu/Ai_games/actions/runs/41917302381) completed **9/9 jobs** and preserved original frozen source `1731b380851162741761c5569e2bc152a0869ca9`, candidate `590a8b56dbe613894c31d50f5df9ecdf6f0aa97c`, normal speed, desktop 960×600, portrait 390×844, and seed `tower-transformation-capture-v1`. These videos **predate this real arena** and have not been event-matched or independently viewed. Follow-up capture must show at least 60s of the new real combat, the source-observed charge, attempted escape, impact and recovery, including an intact result and restart. Blind independent randomized reviewers must watch all scenes and give at least 4/5 candidate preference in EACH LOOKS, FEELS and PLAYS. Genuine supported-device frame p50/p95/p99, memory, accessibility and replay must pass. Reviewer/worker browser connection returned `NOT_FOUND`; independent votes remain missing 0/5 in each pillar. Exact-head CI pending until it runs. A new test does not create a quality PASS.

## Safety and rollback

Tests cover opt-in legacy hash noninterference, config validation, determinism, physical exit widths, hazard caps 0/1/2 and source-observed tactical retreat. Static source review suggests no new privacy surface: all added data are preexisting public hazard fields. Rollback is a simple fast-forward revert of the opt-in flag and authored arena generation; no history rewrite, merge, deployment or change to draft PR58. New source gameplay may need AI/boss balance adjustment after normal-speed capture. The main remaining quality gap is authentic, readable mobile combat choreography with independent evidence, not another cosmetic test-only patch.
