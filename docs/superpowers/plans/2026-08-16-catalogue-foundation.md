# AI Games Catalogue Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the complete documentation and specialist-skill foundation for a twelve-game autonomous livestream catalogue, with one shared platform architecture and production-readiness phase plans for every game.

**Architecture:** The monorepo separates shared platform capabilities from game-specific rules and presentation. Reusable specialist skills define how future agents design and review each domain; every game receives a consistent documentation contract and phased production path while retaining game-specific mechanics, AI, engagement, audiovisual, reliability, and testing requirements.

**Tech Stack:** Markdown specifications, Agent Skills-compatible `SKILL.md` files, pnpm/Turborepo target architecture, TypeScript/Node.js, React/PixiJS, optional Rapier physics, PostgreSQL, OpenTelemetry, Vitest, Playwright, OBS/FFmpeg integrations.

## Global Constraints

- The catalogue contains twelve initial autonomous games plus an optional shared Chat vs AI mode.
- Runs must restart automatically and remain entertaining through visible progress, escalating stakes, wins, losses, records, near-misses, and novelty.
- Audience influence must be bounded, disclosed, moderated, idempotent, rate-limited, and must never sell a guaranteed outcome.
- Game rules and simulations must be replayable from version, configuration, seed, and normalized event log.
- Presentation must be legible in 16:9 livestreams and at mobile viewing sizes.
- Every game must have explicit long-running reliability, recovery, accessibility, telemetry, security, moderation, soak-test, and rollback requirements.
- No phase is complete without acceptance evidence; no document may contain unresolved placeholders.

---

## File Map

- `README.md`: catalogue entrypoint, commands, repository map, delivery status.
- `AGENTS.md`: repository-wide execution and quality rules.
- `skills/*/SKILL.md`: reusable specialist operating guides.
- `skills/tests/*.md`: pressure scenarios and compliance checks for specialist skills.
- `docs/architecture/*.md`: shared platform architecture and decision records.
- `docs/standards/*.md`: production, engagement, interaction, audio, visual, testing, and documentation standards.
- `docs/superpowers/specs/*.md`: approved designs.
- `docs/superpowers/plans/*.md`: executable implementation plans.
- `games/<slug>/*.md`: complete product, game, AI, interaction, audiovisual, technical, testing, and readiness specifications.
- `games/<slug>/phases/*.md`: independently testable implementation phases.
- `.github/*.md`: contribution, pull-request, and issue templates.

### Task 1: Repository Governance and Architecture Foundation

**Files:**
- Modify: `README.md`
- Create: `AGENTS.md`
- Create: `docs/architecture/PLATFORM_ARCHITECTURE.md`
- Create: `docs/architecture/GAME_MODULE_CONTRACT.md`
- Create: `docs/architecture/EVENT_CONTRACTS.md`
- Create: `docs/architecture/RELIABILITY_MODEL.md`
- Create: `docs/standards/DOCUMENTATION_STANDARD.md`
- Create: `docs/standards/PRODUCTION_READINESS_STANDARD.md`

**Interfaces:**
- Consumes: approved design specification.
- Produces: repository structure, game module contract, shared event envelopes, reliability states, documentation schema, and catalogue-wide quality gates.

- [ ] **Step 1: Write governance and architecture documents** with exact package boundaries, ownership rules, lifecycle states, normalized events, deterministic replay requirements, error classes, degradation behavior, and evidence-based completion rules.
- [ ] **Step 2: Review for contradictions** between the root README, module contract, event schemas, and readiness standard.
- [ ] **Step 3: Verify placeholders are absent** by scanning for `TBD`, `TODO`, `later`, `appropriate`, and unspecified acceptance criteria.
- [ ] **Step 4: Commit** with `docs: establish catalogue governance and architecture`.

### Task 2: Specialist Skill Test Harness

**Files:**
- Create: `skills/README.md`
- Create: `skills/tests/BASELINE_PRESSURE_SCENARIOS.md`
- Create: `skills/tests/SKILL_ACCEPTANCE_MATRIX.md`
- Create: `skills/tests/REVIEW_PROTOCOL.md`

**Interfaces:**
- Consumes: Agent Skills frontmatter rules and catalogue quality constraints.
- Produces: repeatable pressure scenarios, expected failure rationalizations, pass criteria, and a review protocol for all new specialist skills.

- [ ] **Step 1: Define baseline scenarios** that tempt an agent to omit deterministic replay, overuse model calls, create unfair paid effects, ignore sound/accessibility, fake engagement, skip soak testing, or declare production readiness without evidence.
- [ ] **Step 2: Record expected baseline failures** and the exact specialist skill that must prevent each failure.
- [ ] **Step 3: Define acceptance checks** for trigger quality, invariants, workflow completeness, outputs, anti-pattern coverage, and cross-skill handoffs.
- [ ] **Step 4: Commit** with `test: add specialist skill pressure scenarios`.

### Task 3: Core Game-Creation Specialist Skills

**Files:**
- Create: `skills/game-creative-direction/SKILL.md`
- Create: `skills/game-architecture/SKILL.md`
- Create: `skills/autonomous-agent-design/SKILL.md`
- Create: `skills/gameplay-progression/SKILL.md`
- Create: `skills/procedural-generation/SKILL.md`
- Create: `skills/deterministic-simulation/SKILL.md`
- Create: `skills/game-physics/SKILL.md`

**Interfaces:**
- Consumes: skill test harness, platform architecture, game module contract.
- Produces: design decisions and artifacts required before implementation plans can be approved.

- [ ] **Step 1: Write each skill** with trigger-only frontmatter, scope, invariants, workflow, required outputs, review gates, failure modes, and cross-skill handoffs.
- [ ] **Step 2: Apply pressure scenarios** and revise any skill that permits hidden scripting, unbounded decision cost, non-replayable randomness, invalid procedural content, or frame-rate-dependent physics.
- [ ] **Step 3: Review cross-skill terminology** so lifecycle, seed, event, action, observation, progression, and evidence names match architecture documents.
- [ ] **Step 4: Commit** with `feat: add core game creation skills`.

### Task 4: Presentation, Audio, Engagement, and Interaction Skills

**Files:**
- Create: `skills/game-audio/SKILL.md`
- Create: `skills/game-feel-vfx/SKILL.md`
- Create: `skills/livestream-hud/SKILL.md`
- Create: `skills/viewer-retention/SKILL.md`
- Create: `skills/audience-interaction/SKILL.md`
- Create: `skills/game-economy-rewards/SKILL.md`
- Create: `skills/difficulty-failure-balancing/SKILL.md`
- Create: `skills/crowd-moderation/SKILL.md`

**Interfaces:**
- Consumes: normalized audience events, render snapshots, accessibility constraints, paid-influence policy.
- Produces: broadcast composition, sound state machines, feedback hierarchy, pacing plans, fair interactions, moderation policy, economy constraints, and calibrated difficulty targets.

- [ ] **Step 1: Write each skill** with concrete budgets, priority rules, disclosure requirements, accessibility checks, cooldowns, and evidence outputs.
- [ ] **Step 2: Apply pressure scenarios** against sensory overload, unreadable mobile HUDs, pay-to-win guarantees, coercive dark patterns, repetitive pacing, unfair difficulty manipulation, and unmoderated payloads.
- [ ] **Step 3: Review handoffs** from gameplay events to HUD, VFX, audio, analytics, and audience acknowledgement.
- [ ] **Step 4: Commit** with `feat: add broadcast and engagement skills`.

### Task 5: Reliability, Performance, Analytics, QA, and Release Skills

**Files:**
- Create: `skills/long-running-reliability/SKILL.md`
- Create: `skills/performance-optimization/SKILL.md`
- Create: `skills/game-analytics-experimentation/SKILL.md`
- Create: `skills/simulation-qa/SKILL.md`
- Create: `skills/production-readiness-review/SKILL.md`
- Create: `skills/security-privacy/SKILL.md`

**Interfaces:**
- Consumes: runtime lifecycle, telemetry contracts, target SLOs, testing standard.
- Produces: watchdog design, performance budgets, metrics, experiment guardrails, statistical test campaigns, security review, release evidence, and rollback decision.

- [ ] **Step 1: Write skills** with measurable acceptance thresholds and explicit stop-ship conditions.
- [ ] **Step 2: Apply pressure scenarios** against memory leaks, silent provider failure, vanity metrics, statistically weak balancing, missing secrets controls, replay corruption, and unsupported production claims.
- [ ] **Step 3: Verify production review is independent** and requires evidence from all other specialist domains.
- [ ] **Step 4: Commit** with `feat: add reliability and release skills`.

### Task 6: Shared Platform Specifications

**Files:**
- Create: `docs/platform/SIMULATION_ENGINE.md`
- Create: `docs/platform/AI_ENGINE.md`
- Create: `docs/platform/PROCEDURAL_CONTENT_ENGINE.md`
- Create: `docs/platform/EVENT_DIRECTOR.md`
- Create: `docs/platform/AUDIENCE_GATEWAY.md`
- Create: `docs/platform/STREAM_PRESENTATION.md`
- Create: `docs/platform/AUDIO_ENGINE.md`
- Create: `docs/platform/ANALYTICS_AND_RECORDS.md`
- Create: `docs/platform/OPERATOR_DASHBOARD.md`
- Create: `docs/platform/REPLAY_RECOVERY_WATCHDOG.md`
- Create: `docs/platform/CHAT_VS_AI_MODE.md`

**Interfaces:**
- Consumes: architecture contracts and specialist skill outputs.
- Produces: platform capability PRDs and APIs referenced by every game.

- [ ] **Step 1: Specify each platform subsystem** with responsibilities, non-responsibilities, input/output schemas, state transitions, failure behavior, security, observability, test strategy, and acceptance criteria.
- [ ] **Step 2: Verify provider independence** and ensure game packages never import provider SDKs.
- [ ] **Step 3: Verify degradation paths** keep games running when optional subsystems fail.
- [ ] **Step 4: Commit** with `docs: specify shared autonomous game platform`.

### Task 7: Game Wave A Documentation

**Files:**
- Create complete documentation contracts and phase plans for:
  - `games/autonomous-snake/`
  - `games/ai-maze-escape/`
  - `games/marble-survival/`
  - `games/infinite-tower/`

**Interfaces:**
- Consumes: shared platform specifications and game documentation standard.
- Produces: implementation-ready game specs for the fastest path to an end-to-end catalogue proof.

- [ ] **Step 1: Write all required documents** for each game.
- [ ] **Step 2: Define six to eight vertical delivery phases per game**, each ending with a runnable increment, tests, telemetry, and acceptance evidence.
- [ ] **Step 3: Cross-review mechanics** for distinct identities, run-duration targets, audience effects, fail/win distributions, and broadcast readability.
- [ ] **Step 4: Commit** with `docs: add wave A game product and delivery specs`.

### Task 8: Game Wave B Documentation

**Files:**
- Create complete documentation contracts and phase plans for:
  - `games/ai-1000-floors/`
  - `games/ai-battle-royale/`
  - `games/ai-escape-room/`
  - `games/endless-ai-dungeon/`

**Interfaces:**
- Consumes: shared platform specifications and Wave A terminology.
- Produces: implementation-ready specs for progression, tournament, puzzle reasoning, and RPG systems.

- [ ] **Step 1: Write all required documents** for each game.
- [ ] **Step 2: Define vertical phases** covering core simulation, AI, content, presentation, interaction, persistence, hardening, and launch.
- [ ] **Step 3: Review model-backed reasoning boundaries** so no game depends on remote inference for real-time continuity.
- [ ] **Step 4: Commit** with `docs: add wave B game product and delivery specs`.

### Task 9: Game Wave C Documentation

**Files:**
- Create complete documentation contracts and phase plans for:
  - `games/tiny-ai-civilization/`
  - `games/ai-zombie-survival/`
  - `games/ai-traffic-experiment/`
  - `games/ai-ant-colony/`

**Interfaces:**
- Consumes: persistent-world, agent, physics, event, analytics, and reliability platform specs.
- Produces: implementation-ready specs for long-horizon worlds and high-agent-count simulations.

- [ ] **Step 1: Write all required documents** for each game.
- [ ] **Step 2: Define vertical phases** including accelerated headless simulation, world snapshots, population limits, long-run balancing, and recovery.
- [ ] **Step 3: Review emergent narratives** for readable causality, named entities, history, records, and audience attachment without fabricated events.
- [ ] **Step 4: Commit** with `docs: add wave C game product and delivery specs`.

### Task 10: Portfolio Roadmap and Dependency Graph

**Files:**
- Create: `docs/roadmap/PORTFOLIO_ROADMAP.md`
- Create: `docs/roadmap/DEPENDENCY_GRAPH.md`
- Create: `docs/roadmap/RELEASE_TRAINS.md`
- Create: `docs/roadmap/CONTENT_OPERATIONS.md`
- Create: `docs/roadmap/MONETIZATION_AND_PLATFORM_POLICY.md`
- Create: `docs/roadmap/RALPH_LOOP_EXECUTION.md`

**Interfaces:**
- Consumes: all game phases and shared platform dependencies.
- Produces: build order, reusable package milestones, continuous execution ledger rules, release trains, content cadence, and policy-safe business model.

- [ ] **Step 1: Map every game phase** to shared platform prerequisites and reusable packages.
- [ ] **Step 2: Prioritize vertical value**: Snake reference implementation, Marble participation, Tower progression, Dungeon depth, then persistent simulations.
- [ ] **Step 3: Define Ralph loop rules**: select first incomplete acceptance item, implement, test, review, fix, record evidence, commit, and repeat until the phase gate passes.
- [ ] **Step 4: Commit** with `docs: add portfolio roadmap and Ralph execution loop`.

### Task 11: Repository Contribution and Review Automation Specifications

**Files:**
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `.github/ISSUE_TEMPLATE/feature.yml`
- Create: `.github/ISSUE_TEMPLATE/bug.yml`
- Create: `.github/ISSUE_TEMPLATE/production-readiness.yml`
- Create: `docs/standards/REVIEW_CHECKLIST.md`
- Create: `docs/standards/COMMIT_AND_BRANCH_STANDARD.md`

**Interfaces:**
- Consumes: quality gates, evidence bundles, Ralph loop.
- Produces: consistent issue intake, PR evidence, phase status, review gates, and traceability.

- [ ] **Step 1: Define templates** that require scope, tests, determinism impact, performance evidence, accessibility, moderation, security, observability, rollback, and screenshots/recordings where relevant.
- [ ] **Step 2: Ensure documentation-only changes** use proportionate evidence without bypassing review.
- [ ] **Step 3: Commit** with `chore: add contribution and review templates`.

### Task 12: Final Catalogue Documentation Review

**Files:**
- Create: `docs/reviews/CATALOGUE_FOUNDATION_REVIEW.md`
- Create: `docs/reviews/TRACEABILITY_MATRIX.md`
- Create: `docs/reviews/OPEN_RISKS.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: every document from Tasks 1–11.
- Produces: final coverage report, requirement-to-document traceability, resolved contradictions, explicitly owned residual risks, and foundation completion status.

- [ ] **Step 1: Run spec coverage review** across all twelve games and shared capabilities.
- [ ] **Step 2: Run placeholder and terminology scans** and correct defects.
- [ ] **Step 3: Verify every game has the complete documentation contract and executable phases.**
- [ ] **Step 4: Verify every production-readiness claim maps to measurable evidence.**
- [ ] **Step 5: Update root status** to mark catalogue documentation foundation complete only after all checks pass.
- [ ] **Step 6: Commit** with `docs: complete catalogue foundation review`.

## Plan Self-Review

- Spec coverage: all approved architecture sections map to Tasks 1–12.
- Placeholder scan: no unresolved implementation placeholders are present.
- Type and terminology consistency: shared terms are `run`, `seed`, `tick`, `snapshot`, `event envelope`, `influence command`, `render snapshot`, `evidence bundle`, and `phase gate`.
- Execution choice: user directed automatic selection of the best approach; subagent-driven continuous execution is selected, with GitHub branch isolation and explicit self-review where native subagent dispatch is unavailable.
