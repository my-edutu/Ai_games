# AGENTS.md — Autonomous AI Games Catalogue

## Mission

Build and operate a catalogue of autonomous games that can entertain livestream viewers continuously, recover without human intervention, and accept fair, disclosed audience influence. Every change must improve or preserve gameplay truth, replayability, engagement clarity, accessibility, reliability, and operational safety.

## Operating Method

Use the repository’s Ralph loop:

1. Open the active phase document and ledger.
2. Select the first unmet acceptance criterion.
3. Load every applicable specialist skill from `skills/` before designing or implementing.
4. Write a focused plan for multi-step work.
5. Use test-driven development for behaviour changes.
6. Implement the smallest vertical increment that can be exercised end to end.
7. Run focused and proportional catalogue checks.
8. Perform separate specification and quality reviews.
9. Fix load-bearing findings, record evidence, commit, and continue.

Do not ask for preference when architecture, requirements, policy, evidence, or standard professional practice determines the best choice. Do not mark work complete without evidence.

## Source-of-Truth Order

When instructions differ, use this precedence:

1. legal, platform, privacy, security, and safety constraints;
2. approved design specification in `docs/superpowers/specs/`;
3. catalogue architecture and standards in `docs/architecture/` and `docs/standards/`;
4. the active game PRD and game-design documents;
5. the active phase plan;
6. implementation plans and task briefs;
7. existing code conventions.

Record unresolved same-level conflicts in the active ledger. Never silently choose a behaviour that weakens fairness, determinism, recovery, security, or production evidence.

## Repository Boundaries

- `apps/` contains deployable launchers, overlays, dashboards, and stream-facing applications.
- `games/` contains game-owned rules, agents, content, presentation adapters, configurations, tests, and documentation.
- `packages/` contains provider-neutral reusable engines and contracts.
- `skills/` contains reusable expert operating guides; project-specific decisions belong in docs, not skill frontmatter.
- `docs/` contains architecture, standards, plans, decisions, runbooks, roadmaps, and review evidence.
- `infra/` contains deployment and operational configuration.

A game may depend on public `packages/` interfaces. Games may not import another game’s private implementation or a YouTube/Twitch/payment SDK. Provider adapters belong behind the audience gateway.

## Non-Negotiable Engineering Rules

- Use fixed-step simulation where authoritative state changes over time.
- Route all gameplay randomness through named seeded random streams.
- Record version, configuration hash, seed, normalized external events, and checksums needed for replay.
- Presentation code consumes immutable render snapshots and cannot mutate authoritative state.
- Remote AI/model calls are optional, asynchronous, bounded, cached where safe, and never required for real-time continuity.
- Every external event is schema-validated, authenticated where applicable, rate-limited, idempotent, moderated, auditable, and replay-safe.
- Paid influence grants only an eligible disclosed effect or voting weight; it cannot guarantee a winner, loss, prize, or cash-equivalent result.
- Optional service failure must degrade gracefully while the game continues whenever gameplay truth can be preserved.
- Secrets never enter source, logs, telemetry attributes, replay files, screenshots, or client bundles.
- Do not hide errors. Emit structured context, surface operator state, and define retry or terminal behaviour.

## Test Rules

For behaviour changes, use red-green-refactor:

1. write one focused failing test;
2. run it and confirm the expected failure;
3. implement the minimum behaviour;
4. run the focused test;
5. run affected integration tests;
6. refactor while keeping tests green.

Use the relevant mix of:

- unit and contract tests;
- property/invariant tests;
- deterministic replay tests;
- accelerated simulation campaigns;
- statistical balance tests with declared sample sizes and confidence intervals;
- UI, accessibility, and mobile-legibility tests;
- performance, memory, load, soak, and chaos tests;
- moderation, idempotency, reversal, security, privacy, recovery, and rollback tests.

A flaky test is a defect. Do not rerun until green and call it passing.

## Documentation Contract

Every game directory contains:

- `README.md`
- `PRD.md`
- `GAME_DESIGN.md`
- `AI_SYSTEM.md`
- `VIEWER_INTERACTION.md`
- `AUDIO_VISUAL.md`
- `TECHNICAL_ARCHITECTURE.md`
- `TESTING_STRATEGY.md`
- `PRODUCTION_READINESS.md`
- executable phase documents in `phases/`

Documents must use measurable acceptance criteria and exact ownership. Prohibited placeholders include `TBD`, `TODO`, “handle appropriately,” “add tests,” “optimize later,” and any production claim without evidence.

## Change and Review Expectations

Every meaningful commit should be cohesive, independently reviewable, and use Conventional Commit style. Every pull request or direct programme commit must state:

- requirement and phase criterion addressed;
- files and interfaces changed;
- test commands and results;
- determinism and replay impact;
- performance and memory impact;
- stream UX, audio, accessibility, and moderation impact;
- security/privacy considerations;
- observability and recovery behaviour;
- rollout and rollback plan;
- remaining risks with owner and target phase.

Review in two passes: exact specification compliance, then engineering and viewer-experience quality.

## Production Claims

A feature is not production-ready because it works once. Production readiness requires the game’s complete readiness checklist, measurable SLOs, clean load-bearing reviews, deterministic evidence, failure recovery, bounded resources, provider-degradation tests, security/privacy checks, moderation auditability, accessibility evidence, required soak/canary results, incident ownership, and a rehearsed rollback.
