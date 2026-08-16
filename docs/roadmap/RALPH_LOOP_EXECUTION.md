# Ralph Loop Execution Protocol

## Purpose

This protocol keeps the autonomous AI games programme moving from specification to production without repeatedly asking for direction. The controller always selects the safest highest-value next action, executes it, validates it, records evidence, and continues until the current phase gate is complete or a genuine external blocker makes completion impossible.

## Core Loop

1. Read the active game phase and its acceptance criteria.
2. Find the first unmet acceptance criterion, prioritising foundational blockers before cosmetic work.
3. Select the specialist skills required for that criterion.
4. Write or update the smallest implementation plan that can produce a testable increment.
5. Implement using test-first development for behaviour changes.
6. Run focused tests, then integration, determinism, performance, accessibility, and reliability checks proportional to the change.
7. Perform a specification-compliance review and a separate quality review.
8. Fix all load-bearing findings and re-run affected checks.
9. Record the evidence bundle, commit the completed increment, and update the phase ledger.
10. Repeat from step 1 until every phase criterion passes.

## Decision Policy

The controller does not ask for preferences when a best professional choice can be made from the product goal, architecture, policies, and evidence. It chooses the option that best preserves:

1. viewer comprehension and entertainment value;
2. deterministic and auditable gameplay;
3. uninterrupted operation and recoverability;
4. fair, disclosed, policy-safe audience influence;
5. reusable platform leverage;
6. implementation simplicity and maintainability;
7. measurable production readiness.

When two choices are effectively equal, prefer the one with fewer dependencies and the smaller irreversible commitment.

## Stop Conditions

The loop stops only when one of these conditions is true:

- every acceptance criterion for the active phase passes and its evidence bundle is committed;
- a required external credential, legal/platform decision, paid asset licence, or inaccessible third-party system prevents safe progress;
- continuing would destroy data, expose secrets, violate platform rules, or create a materially unsafe production state;
- two approved specifications directly conflict and neither contains an explicit precedence rule.

A lack of convenience, large scope, test failures, review findings, or implementation difficulty is not a stop condition. Those conditions trigger another diagnosis-and-fix loop.

## Phase Ledger

Each phase owns `games/<slug>/phases/PHASE-XX-LEDGER.md` during implementation. The first line identifies the exact phase document. The ledger records:

- current phase status: `not-started`, `in-progress`, `blocked`, or `complete`;
- acceptance criteria and pass/fail state;
- implementation commits;
- test commands and results;
- simulation seeds and replay checksums;
- performance and soak-test evidence locations;
- review findings and resolutions;
- known non-blocking risks with owner and due phase;
- rollback point;
- next criterion selected by the loop.

A criterion may be marked complete only when evidence exists. A phase may be marked complete only when all criteria pass and no load-bearing review finding remains.

## Evidence Bundle

A phase evidence bundle contains, as applicable:

- unit, property, integration, UI, and end-to-end test reports;
- deterministic replay comparison;
- accelerated simulation distribution report;
- frame-time, tick-time, CPU, GPU, memory, and queue-depth measurements;
- screenshots or recordings at desktop and mobile viewing sizes;
- audio loudness and missing-cue checks;
- accessibility review;
- moderation, rate-limit, idempotency, and reversal tests;
- crash recovery, provider outage, corrupted snapshot, and watchdog tests;
- security and privacy review;
- rollout and rollback instructions;
- final specification-compliance and code-quality reviews.

## Review Loop

Every implementation increment receives two reviews:

1. **Specification compliance:** confirms the implementation satisfies the exact criterion without adding conflicting behaviour or silently reducing scope.
2. **Engineering and experience quality:** checks correctness, maintainability, determinism, performance, game feel, accessibility, broadcast readability, fairness, observability, and recovery.

Findings are ranked:

- `P0`: corrupts data, breaks deterministic truth, creates security/policy exposure, or prevents unattended recovery; must be fixed immediately.
- `P1`: violates a phase criterion or creates major gameplay/reliability failure; must be fixed before the criterion passes.
- `P2`: meaningful quality issue with a safe bounded workaround; fix in the current phase unless explicitly owned by a later criterion.
- `P3`: non-blocking refinement; record with an owner and planned phase.

## Portfolio Ordering

When no game phase is active, select work in this order:

1. shared blockers required by multiple games;
2. Autonomous Snake end-to-end reference implementation;
3. Marble Survival viewer participation loop;
4. Infinite Tower progression loop;
5. AI Maze procedural-content loop;
6. AI vs 1,000 Floors milestone loop;
7. AI Battle Royale tournament loop;
8. AI Escape Room reasoning loop;
9. Endless AI Dungeon RPG loop;
10. AI Zombie Survival wave loop;
11. Tiny AI Civilization persistent-world loop;
12. AI Traffic Experiment large-agent systems loop;
13. AI Ant Colony ecosystem loop.

The order can change only when evidence shows a shared dependency, platform policy, technical risk, or validated audience result makes another item higher value.

## Definition of Done

“Implemented” means code exists and focused tests pass.

“Phase complete” means every acceptance criterion has evidence, deterministic and failure paths have been exercised, reviews are clean of load-bearing findings, documentation matches reality, and the commit is reproducible.

“Production ready” means every phase is complete, the game passes the catalogue production-readiness standard, unattended recovery is proven, required soak and canary periods pass, operational ownership exists, and rollback has been rehearsed.
