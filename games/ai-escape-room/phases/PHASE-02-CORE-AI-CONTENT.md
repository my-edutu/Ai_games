# Phase 2 — Core AI, Content and Progression

## Objective

Deliver an autonomous symbolic solver that reasons only from public observations, survives bounded hazards, progresses across room themes and challenge bands, and remains measurable through deterministic seeded campaigns.

## Completed scope

- [x] Serializable observation boundary with no hidden solution, unopened-content, future-draw or oracle fields.
- [x] Bounded facts, hypotheses, contradiction tracking and public belief projection.
- [x] Deterministic best-first action policy with a 64-expansion ceiling.
- [x] Information-gain inspection, prerequisite ordering, tool use, code/switch execution and legal fallback.
- [x] Repeated-action and no-progress pathology detection with bounded recovery.
- [x] Safety hierarchy: active-hazard reflex cannot be overridden by loop recovery.
- [x] Deterministic theme rotation and bounded difficulty, puzzle-depth, decoy and hazard growth.
- [x] Telegraph, active, idle and suppression hazard phases with causal fair failure for unsafe actions.
- [x] Continuous result/intermission/next-room progression using an immutable base configuration.
- [x] Stratified deterministic campaign with fair/technical outcome separation, feature diversity and dramatic-pattern metrics.

## Observation boundary

The production policy receives visible object descriptors, inspection/carry/solve state, public hazards, inventory, known puzzle structure, discovered facts, legal affordances, timer and progress. It does not receive `solution`, `hiddenFact`, solver routes, future hazard state or named RNG internals. Public intent exposes goal, observation, action summary, confidence band, fallback state and plan-change reason—not raw clue values or chain-of-thought.

## Difficulty model

Challenge grows through puzzle dependency depth, decoy count, hazard concurrency and theme rotation before relying on timer pressure. All values remain within the Phase 1 configuration bounds. Technical invalidity and fallback generation remain separately classified and never count as legitimate game losses.

## Campaign evidence

The release campaign used four seeds, four themes and four difficulty strata (2, 7, 12, 18), for 64 autonomous runs using the same runtime, rules, generator and planner as streamed play.

- Runs: 64
- Escapes: 64
- Technical failures: 0
- Invalid rooms: 0
- Rejected actions: 0
- Unique feature signatures: 64
- Maximum planner expansions: 20 / 64
- P50 ticks: 19
- P95 ticks: 26
- Maximum ticks: 33
- Summary checksum: `0e73c932`
- Dramatic patterns: decoy investigation, final-vault escape, hazard hold, mechanism breakthrough, multi-stage chain, opening discovery and tool breakthrough.

## Exit evidence

- `node --test tests/escape-room/phase2-ai.test.cjs` — 8/8 PASS.
- `node --test tests/escape-room/phase2-campaign.test.cjs` — 6/6 PASS.
- Phase 1 regression suite — 15/15 PASS.
- Phase 1 + Phase 2 focused total — 29/29 PASS.
- `npm run escape-room:campaign` executed twice with byte-identical JSON and checksum `0e73c932`.

## Readiness

Phase 2 is complete at R2 software evidence. This does not claim production soak, live-provider validation or R5 readiness.
