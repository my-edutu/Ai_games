# Next Execution — Autonomous Snake Phase 1

## Goal

Deliver the deterministic headless Snake vertical slice defined in `games/autonomous-snake/phases/PHASE-01-FOUNDATION.md` and stop only when every R1 criterion has reproducible evidence.

## First Implementation Sequence

1. Inspect and confirm the current branch or worktree and create an isolated feature branch for Snake Phase 1.
2. Translate the phase requirements into an exact file and task plan using the Superpowers writing-plans workflow.
3. Scaffold only required monorepo and runtime packages after failing contract tests exist.
4. Implement seeded RNG and public game, simulation and event contracts test-first.
5. Implement Snake configuration, state, rules, food, lifecycle and result test-first.
6. Implement the minimal deterministic fallback agent.
7. Implement events and signals, snapshots, checksums, replay and headless CLI.
8. Run property, replay, corruption, render-schedule-independence, performance and bounded-state evidence.
9. Conduct specification-compliance review, then code, architecture and quality review.
10. Store evidence, update the ledger and close Phase 1 only when the universal and game-specific exit checklists pass.

## Hard Constraints

No renderer, provider, database or operator work in Phase 1. No production code before a focused failing behavior test. No alternate headless rules. No ambient randomness. No silent fixture updates after divergence. No status claim above R1.

## Handoff

Phase 2 begins only from stable public contracts and the verified Phase 1 evidence bundle. It replaces the minimal policy with the layered survival AI and adds validated content and progression without duplicating rules.
