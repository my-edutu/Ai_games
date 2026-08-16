# Autonomous Snake Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans task-by-task.

**Goal:** Replace the Phase 1 fallback as the normal policy with deterministic layered survival AI and add validated topology/hazard/progression systems that produce diverse complete headless runs.

**Architecture:** Phase 1 authority remains the only reducer. Phase 2 adds deterministic board descriptors to authoritative state, a pure generator/validator, a production decision pipeline that returns an action plus public intent, and progression metadata derived only from authoritative state. Fallback remains a degraded path.

**Tech Stack:** TypeScript 5.x, Node.js 22+, dependency-free deterministic tests/campaigns.

## Global Constraints
- Phase 1 determinism/replay compatibility remains mandatory.
- No provider/presentation/wall-clock/global randomness in authority.
- Generator, planner and recovery work is bounded and deterministic.
- Invalid content is repaired or falls back; it is never counted as a normal loss.

## Tasks
1. [x] Extend versioned config/state with board profile, obstacles, hazards, portals, AI strategic state and progression band while preserving open-profile behavior.
2. [x] Add deterministic generators for open, corridors, rings, chambers and portals plus connectivity validation, repair and extracted features.
3. [x] Integrate obstacles/hazards/portal transforms and objective exclusion into the authoritative reducer/generator.
4. [x] Add layered production AI: legal/safety filter, bounded BFS objective path, reachable-space/tail-access scoring, bottleneck penalty, high-occupancy preserve/cycle mode, stable tie breaking and fallback-only degraded path.
5. [x] Add serializable AI intent/confidence/replan/repeat/fallback state and deterministic stuck recovery.
6. [x] Add progression bands, milestone events and dramatic-pattern classification.
7. [x] Add debug decision traces and deterministic campaign reporting across topology profiles.
8. [x] Run full regression + adversarial fixtures + profile validity + campaign/performance evidence; review and merge only with no known P0/P1.
