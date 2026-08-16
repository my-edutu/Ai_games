# AI Maze Escape — Testing Strategy

**Status:** Approved strategy

## Test Layers

- unit/contract: movement, doors, keys, clues, traps, timers, threat perception, lifecycle, result, schemas, events, snapshots, render/influence contracts;
- property/invariants: connected valid graph, required dependencies reachable in order, explorer/threat legal cells, map-memory consistency, bounded resources, immutable result, ordered events;
- generation: solution existence/count, shortest/alternate route features, safe start/exit, lock-key depth, hazard/threat response, bounded repair/fallback, feature/diversity and performance tails;
- partial-observation integrity: hidden cells/exit/future threat data never enter observations or public snapshots;
- AI: known-space paths, frontier scoring, dependency plans, threat evasion, belief revision, stuck/oscillation/fallback, maximum-maze budgets;
- deterministic replay: repeated process, different render schedules, uninterrupted versus restore, provider event reorder/duplicate, supported versions/hosts;
- interaction: each effect preserves a valid solution and response window; vote/idempotency/moderation/reversal/outage/load;
- audiovisual/accessibility: map-state readability, orientation, fog, chase, route replay, mobile/low bitrate, color-safe, muted, reduced motion, loudness and output recovery;
- performance/reliability/security: generation/search/render/audio/snapshot/load, bounded state, 24/72-hour soak, chaos, provider failures, restore/quarantine, roles/secrets/text/privacy, rollback.

## Seed and Scenario Corpora

Stratify by size, tree/loop/chamber/layer topology, solution length, branching, dead ends, chokepoints, dependency depth, visibility, timers, traps, threat count/behavior, alternate routes, audience pressure, and pathological regressions. Preserve every discovered bad seed and normalized event log.

## Statistical Evidence

Predeclare sample size/sequential rule, confidence intervals, practical thresholds, feature strata, exclusions, and tail criteria. Measure escape/failure/time/discovery/backtrack, dependency success, route efficiency versus oracle after result, AI latency/fallback/stuck, generator validity/fallback/diversity, dramatic patterns, interaction shifts, and resource/performance stability. Inspect representative median/tail/failure replays.

## Required Assertions

- invalid/unsolvable generation is a defect, never a fair loss;
- identical recorded inputs produce identical truth/belief/action/result checksums;
- snapshot restore equals uninterrupted execution;
- optional renderer/audio/provider/model/telemetry failure cannot change outcomes;
- duplicate authoritative interaction application is zero;
- technical failures are excluded from game metrics/records;
- no flaky/ignored test closes a requirement.

## Evidence Cadence

Focused TDD per behavior; PR smoke and replay corpus; nightly stratified generation/AI campaigns; scheduled performance/resource compatibility; R4 full campaign and 72-hour candidate soak; R5 seven-day canary and rollback drills. Store reproducible manifests under `evidence/ai-maze-escape/<release-id>/`.
