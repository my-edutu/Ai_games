# Game Documentation Standard

## Purpose

Make every autonomous game independently understandable, implementable, testable, operable, and reviewable. Documentation is executable programme control, not marketing copy. A future engineer or agent with no conversation history must be able to determine what to build, why, in what order, how to test it, and what evidence proves readiness.

## Required Game Directory

```text
games/<slug>/
├── README.md
├── PRD.md
├── GAME_DESIGN.md
├── AI_SYSTEM.md
├── VIEWER_INTERACTION.md
├── AUDIO_VISUAL.md
├── TECHNICAL_ARCHITECTURE.md
├── TESTING_STRATEGY.md
├── PRODUCTION_READINESS.md
└── phases/
    ├── PHASE-01-FOUNDATION.md
    ├── PHASE-02-CORE-LOOP.md
    ├── ...
    └── PHASE-XX-LAUNCH.md
```

Additional focused documents are encouraged when a system would otherwise exceed one clear responsibility. Do not remove a required document by claiming its content exists elsewhere; instead, link to the shared source and document game-specific decisions.

## Common Front Matter

Each game document begins with:

- game title and stable slug;
- document purpose;
- status: `draft`, `approved`, `in-implementation`, or `verified`;
- owning phase or catalogue scope;
- authoritative related documents;
- last material review date;
- version or decision identifier where applicable.

Do not list a human owner that has not been assigned. Use a role, package, or phase owner.

## README.md

The game entrypoint states:

- one-sentence premise and viewer hook;
- visible goal and run-ending conditions;
- autonomous loop summary;
- audience interaction summary;
- unique identity versus other catalogue games;
- expected run-duration bands;
- folder and package map;
- local/headless/stream/operator commands once code exists;
- current phase and evidence links;
- known limitations that affect use.

## PRD.md

Required sections:

1. executive summary;
2. problem and opportunity;
3. target viewers, operators, and platform stakeholders;
4. viewer promise and stream premise;
5. product principles and non-goals;
6. primary, secondary, and audience-interaction loops;
7. functional requirements with stable IDs such as `FR-GAME-001`;
8. non-functional requirements with stable IDs such as `NFR-REL-001`;
9. monetization and platform-policy constraints;
10. analytics and success metrics with definitions;
11. accessibility, safety, privacy, moderation, and regional requirements;
12. dependencies and integration boundaries;
13. risks, mitigations, and stop-ship conditions;
14. launch scope and explicit exclusions;
15. acceptance criteria and evidence required.

Requirements use `MUST`, `SHOULD`, or `MAY`. Every `MUST` maps to at least one phase and test/evidence item.

## GAME_DESIGN.md

Document:

- fantasy, theme, emotional arc, and visual readability;
- authoritative world model and rules;
- entities, resources, hazards, objectives, and state machines;
- second-to-second, minute-to-minute, run, session, and long-term loops;
- progression, milestones, checkpoints, records, and restart;
- difficulty dimensions and escalation schedule;
- win, loss, draw, abort, quarantine, and soft-failure outcomes;
- dramatic-pattern catalogue and anti-repetition rules;
- procedural content grammar and validation;
- catch-up, anti-stall, and recovery mechanics that preserve fairness;
- content budget and expansion seams;
- game-balance targets expressed as distributions, not one ideal run;
- edge cases and rule precedence.

Never describe hidden forced outcomes as AI behaviour. Any director intervention must be eligible, disclosed where relevant, bounded, replayable, and testable.

## AI_SYSTEM.md

Document:

- agent types and responsibilities;
- permitted observations and hidden information;
- action schemas and legality;
- hard constraints, tactical policy, strategic planner, stuck detector, and fallback;
- planning horizon, decision frequency, CPU/time/token budgets;
- deterministic tie-breaking and random streams;
- pathfinding, search, utility, behaviour-tree, planner, learned-policy, or model-backed method with rationale;
- memory and state retained by agents;
- visible intent and confidence summaries;
- remote model boundary, timeout, validation, cache, privacy, cost, and offline fallback;
- adversarial and pathological scenarios;
- evaluation metrics and benchmark seeds;
- reproducibility and debugging tools.

The system must continue without remote inference.

## VIEWER_INTERACTION.md

Document:

- interaction goals and viewer roles;
- free votes, chat commands, reactions, gifts, memberships, redemptions, and operator events;
- effect catalogue and disclosed bounds;
- eligibility, cooldowns, caps, conflicts, queueing, expiry, and reversal;
- rate limits, anti-spam, moderation, identity, privacy, regional and platform-policy handling;
- paid-event fairness and non-guarantee wording;
- acknowledgment states and broadcast presentation;
- idempotency and replay representation;
- abuse cases, brigading, harassment, prohibited text, chargebacks, and provider outage;
- Chat vs AI compatibility;
- tests and audit evidence.

## AUDIO_VISUAL.md

Document:

- art direction, shape language, palette roles, materials, lighting, camera, and background strategy;
- entity readability, danger hierarchy, progress visualization, and mobile-size checks;
- HUD information architecture and safe zones;
- animation states, anticipation, impact, recovery, celebration, failure, and replay moments;
- particles/VFX budgets, reduced-motion/flash variants, and degradation tiers;
- adaptive music states, transitions, stems, tension mapping, and silence policy;
- SFX taxonomy, priority, voice limits, ducking, spatialization, captions, and missing-asset fallback;
- loudness, mixing, loop, and long-session fatigue requirements;
- asset naming, licensing, source, version, memory, and replacement rules;
- broadcast scenes, intermission, clean feed, operator preview, and screenshot/recording evidence.

“Premium” must be translated into concrete visual and audio behaviours.

## TECHNICAL_ARCHITECTURE.md

Document:

- game module interfaces and package ownership;
- authoritative state and schema;
- systems order and tick rate;
- algorithms and complexity constraints;
- named random streams;
- snapshots, events, migration, replay, checksums, and records;
- renderer/audio/presentation adapters;
- shared platform dependencies and forbidden imports;
- configuration and content-pack schemas;
- error classes, degradation, recovery, and safe state;
- security, privacy, moderation, and secrets boundaries;
- operational telemetry;
- CPU, GPU, memory, network, storage, queue, and latency budgets;
- deployment, feature flags, compatibility, and rollback;
- architecture tests and acceptance.

## TESTING_STRATEGY.md

Document a test pyramid and evidence matrix covering:

- rule and utility unit tests;
- schema and contract tests;
- property/invariant tests;
- deterministic replay and random-stream isolation;
- procedural generation validity and diversity;
- agent benchmark, stuck, fallback, and adversarial tests;
- accelerated simulations and statistical balance analysis;
- interaction eligibility, idempotency, moderation, reversal, and provider reconnect;
- render snapshot, UI, mobile-legibility, accessibility, VFX, audio, and output tests;
- integration and end-to-end broadcast flows;
- performance, memory, load, soak, chaos, restore, and rollback;
- security and privacy checks;
- required fixtures, seeds, sample sizes, thresholds, failure triage, and artifact retention.

“Test thoroughly” is prohibited. Commands, expected results, and evidence destinations must be explicit when implementation begins.

## PRODUCTION_READINESS.md

Document:

- service objectives and error budgets;
- dashboards, alerts, runbooks, and ownership;
- failure-domain and degradation matrix;
- recovery-point and recovery-time targets;
- snapshot, restore, replay, and quarantine procedure;
- capacity and reference-hardware results;
- soak, canary, chaos, moderation, security, privacy, accessibility, and platform-policy evidence;
- deployment, feature flag, content rollout, rollback, and incident drills;
- launch-day controls and emergency stop;
- known risks with severity, owner, trigger, mitigation, and due phase;
- sign-off matrix for gameplay, engineering, broadcast, audio, safety, operations, and product;
- exact production-ready definition and prohibition on unsupported claims.

## Phase Document Standard

Each phase is a vertical, independently testable increment and contains:

1. objective and viewer-visible outcome;
2. scope and explicit non-scope;
3. prerequisites and consumed interfaces;
4. files/packages expected;
5. functional and non-functional requirements addressed by ID;
6. exact implementation workstreams;
7. test-first sequence and required fixtures;
8. telemetry and operational work;
9. accessibility, moderation, security, and policy work;
10. acceptance criteria as pass/fail statements;
11. evidence bundle and storage paths;
12. review gates and stop-ship findings;
13. rollback or safe-disable plan;
14. phase exit and next-phase handoff.

Phases may not be organised as “backend first, UI later” when that produces no runnable viewer-visible increment. Shared foundation phases must include a headless demonstrator and operational probes.

## Requirement Traceability

Maintain a table mapping:

- requirement ID;
- source document and section;
- owning phase;
- implementation package/file;
- test/evidence artifact;
- status;
- deviations and approved decision record.

A requirement cannot be closed by prose alone when it describes runtime behaviour.

## Language Rules

Use exact, testable language. Replace:

- “fast” with a latency or frame/tick budget;
- “engaging” with observable pacing, novelty, comprehension, retention, or interaction targets;
- “robust” with failure modes, recovery, bounded resources, and soak evidence;
- “AI-powered” with agent observations, actions, policy, budget, fallback, and evaluation;
- “real-time” with an interval or deadline;
- “secure” with threats, controls, tests, and ownership.

## Prohibited Placeholders

The following fail review unless quoted as examples:

- `TBD`, `TODO`, `FIXME`;
- “implement later” or “future-proof everything”;
- “handle errors appropriately”;
- “write tests” without cases and thresholds;
- “optimize” without profile evidence and budget;
- “support all platforms” without enumerated targets;
- “use AI” without architecture and fallback;
- “production-ready” without the catalogue evidence gate.

## Documentation Review Gate

A game documentation set passes when:

- every required document exists and has one clear responsibility;
- requirements are measurable, uniquely identified, and traced to phases;
- rules, AI, interaction, audiovisual, architecture, tests, and operations agree;
- no provider SDK or presentation mutation leaks into the game contract;
- no paid effect promises an outcome;
- all randomness, replay, snapshot, failure, and fallback behaviour is explicit;
- phase plans produce runnable vertical increments;
- every readiness claim requires evidence;
- placeholder and terminology scans are clean;
- a reviewer with no conversation history can execute Phase 1 without guessing.
