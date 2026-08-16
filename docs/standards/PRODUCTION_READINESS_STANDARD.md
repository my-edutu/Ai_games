# Catalogue Production Readiness Standard

## Purpose

Define the minimum evidence required before any autonomous game is labelled production-ready or entrusted with unattended livestream operation. A passing game must be entertaining, truthful, recoverable, accessible, policy-safe, observable, secure, and operationally owned—not merely feature-complete.

## Readiness Levels

### R0 — Concept

Premise, viewer hook, primary loop, differentiation, risks, and feasibility are documented. No runtime claim is permitted.

### R1 — Headless Prototype

Core rules run deterministically without renderer or providers. Invariants, seeds, results, and basic performance are testable.

### R2 — Playable Vertical Slice

One complete run is watchable with core AI, presentation, audio, result, and automatic restart. Local failures are visible and recoverable.

### R3 — Interaction Candidate

Normalized audience inputs, eligibility, moderation, idempotency, cooldowns, acknowledgements, and replay are integrated in a test environment.

### R4 — Production Candidate

Feature scope is complete, evidence gates pass in staging, operator controls and runbooks exist, and a 72-hour soak is successful.

### R5 — Production Ready

A seven-day canary, rollback drill, provider verification, security/privacy review, accessibility review, policy review, operational sign-off, and launch checklist pass with no load-bearing finding.

Only R5 may be described as production-ready.

## Gate A — Product and Gameplay

Required evidence:

- the stream premise and visible objective are understandable within ten seconds in an unassisted viewer test;
- primary progress, danger, current run state, and record are readable on representative mobile viewport captures;
- second-to-second, minute-to-minute, run, intermission, and restart loops are implemented;
- wins, losses, near-misses, records, and at least three distinct dramatic run patterns occur naturally in validated simulation results;
- no single dominant strategy or content seed accounts for an unacceptable share defined by the game’s balance targets;
- run-duration, win/loss, progress, failure-reason, novelty, and interaction distributions meet game-specific confidence intervals;
- stuck, impossible-objective, repeated-loop, runaway-score, and indefinite-run policies work;
- intermission and restart complete without operator input;
- content has no placeholder assets, broken links, developer text, or silent critical states.

Stop-ship examples: fabricated “AI” outcomes, hidden forced winners, unreadable state, unbounded runs without intentional endless-mode design, repetitive identical seeds, or a restart that needs manual input.

## Gate B — Determinism and Integrity

Required evidence:

- identical platform/game/config/content versions, seed, and normalized event log produce matching authoritative checksums;
- named random streams are isolated and all authoritative randomness is recorded;
- action, command, and event ordering is stable;
- snapshot round-trip, migration, restore, replay, and quarantine tests pass;
- duplicate, reordered, delayed, stale, and retried external events cannot duplicate effects or corrupt order;
- state invariants run at declared intervals and preserve evidence on failure;
- records and results rebuild from authoritative source events;
- integrity failures never continue silently.

Stop-ship examples: ambient randomness in game rules, non-repeatable collisions that change winners, snapshot coercion, sequence gaps, or mismatched results after restore.

## Gate C — Autonomous AI

Required evidence:

- every agent has documented observations, legal actions, budgets, and fallback;
- safety/legality constraints cannot be bypassed by strategic or model-backed policy;
- decision deadlines and resource budgets hold under peak entity counts;
- remote model loss, timeout, malformed response, refusal, cost cap, and rate limit trigger deterministic fallback;
- stuck and oscillation detectors are benchmarked on adversarial seeds;
- visible intent summaries derive from validated game state and do not expose private model reasoning;
- benchmark campaigns measure success, survival, progress, diversity, decision latency, fallback rate, and pathological behaviour.

Stop-ship examples: a remote model is required for the tick loop, unbounded search freezes play, hidden information leaks into observations, or public chain-of-thought is displayed.

## Gate D — Audience Interaction and Monetization Safety

Required evidence:

- provider payloads normalize into the shared versioned envelope;
- webhook/socket authentication, replay protection, idempotency, rate limits, moderation, regional rules, entitlement, and audit logging pass;
- every effect declares eligibility, disclosed bounds, cooldown, conflicts, queue policy, caps, expiry, reversal, and acknowledgement;
- paid-eligible and free interactions pass through the same game-safety layer;
- no purchase guarantees a winner, loss, prize, cash-equivalent result, or undisclosed probability change;
- duplicate callbacks, reconnects, chargebacks/reversals, refunded events, provider outage, moderation outage, and queue overflow have tested behaviour;
- sanitized names/text render safely and privacy controls are respected;
- Chat vs AI mode cannot enable effects forbidden by the base game.

Stop-ship examples: payment callback mutates state directly, effects apply twice, unmoderated text reaches the stream, paid viewers can deterministically select winners, or reversals have no audit path.

## Gate E — Broadcast Presentation and Accessibility

Required evidence:

- target frame rate and frame-time budgets pass on reference hardware;
- desktop, mobile, common 16:9, and configured crop/safe-zone captures are reviewed;
- camera changes preserve objective comprehension and do not create motion sickness;
- HUD priority, font size, contrast, color-blind differentiation, captions, reduced motion, and reduced flash meet the documented accessibility profile;
- VFX have density, lifetime, overdraw, and degradation limits;
- clean-feed, overlay, intermission, safe slate, result, replay, and maintenance scenes work;
- black-frame, frozen-frame, wrong-scene, missing-overlay, and stale-source probes alert and recover;
- public statuses are truthful and never display private diagnostics.

Stop-ship examples: unreadable mobile HUD, critical state conveyed by color alone, repeated unsafe flashes, presentation mutating gameplay, black stream after renderer restart, or a failure screen exposing secrets.

## Gate F — Audio

Required evidence:

- semantic cue taxonomy, adaptive music states, priority, voice limits, cooldowns, ducking, spatial rules, and missing-asset fallback are implemented;
- loudness targets are measured at game, intermission, celebration, failure, and audience-event peaks;
- loops are gapless where required and long sessions do not produce obvious repeated short cycles or constant maximal intensity;
- critical audio cues have visual/caption alternatives;
- audio loss, device/source failure, buffer underrun, excessive silence, and excessive level trigger health states and recovery;
- all assets have licence, provenance, version, naming, memory, and replacement data.

Stop-ship examples: clipping, missing critical cues, unlicensed assets, endless high-intensity mix, audio engine crash stopping simulation, or no alert for sustained unintended silence.

## Gate G — Performance and Capacity

Required evidence:

- authoritative tick p50/p95/p99, worst case, and missed-tick counts meet the game budget;
- render CPU/GPU frame time, draw calls, texture memory, particles, entities, and dropped frames meet budget;
- memory, handles, threads, listeners, textures, audio buffers, logs, snapshots, and queues reach a bounded stable band during soak;
- maximum supported entities, audience input bursts, procedural generation, snapshot writes, replay, and record queries are load-tested;
- optional integrations do not block the simulation thread;
- headless campaign throughput supports balancing and regression goals;
- profiling evidence identifies the top costs and confirms optimizations preserve determinism and quality.

Stop-ship examples: monotonic memory growth, unbounded queue, frame rate collapse at documented maximum population, snapshot pause causing missed ticks, or performance claims without reference hardware.

## Gate H — Reliability and Recovery

Required evidence:

- failure domains, health probes, state transitions, breakers, backoff, and automated actions match the reliability model;
- simulation, renderer, audio, provider, persistence, telemetry, operator console, and capture failures are injected;
- newest valid snapshot restore and event replay meet recovery objectives;
- corrupt snapshot, incompatible schema, replay divergence, and invariant failure quarantine safely;
- provider/model/telemetry outages preserve autonomous gameplay using declared degradation;
- output health detects and recovers black, frozen, stale, and silent output;
- crash-loop policy transitions to safe intermission or fresh run rather than restarting forever;
- a 24-hour engineering soak, 72-hour candidate soak, and seven-day canary pass according to the reliability model.

Stop-ship examples: silent replay divergence, no safe intermission, manual recovery required for common failures, repeated paid-effect application after reconnect, or unstable memory during soak.

## Gate I — Security, Privacy, and Moderation

Required evidence:

- threat model covers provider webhooks, chat, operator controls, content packs, model calls, dashboards, storage, overlays, and supply chain;
- secrets use managed storage, least privilege, rotation, and redaction;
- authorization and role boundaries protect operator and emergency controls;
- input validation, output encoding, content limits, dependency scanning, and security tests pass;
- viewer data inventory, purpose, minimization, retention, deletion, export, and regional configuration are documented;
- raw payment details never enter game state or logs;
- moderation decisions are versioned, auditable, appeal/reversal-aware where required, and resilient to service outage;
- incident response and credential revocation are rehearsed.

Stop-ship examples: secrets in repository/client/logs, unauthorized operator mutation, stored unnecessary viewer data, unsanitized chat display, unverifiable paid callback, or no emergency revocation.

## Gate J — Observability and Operations

Required evidence:

- dashboards cover run health, tick/render/audio/output, resources, persistence, providers, interactions, moderation, recovery, engagement, and records;
- alerts have thresholds, duration, severity, owner, runbook, and verification step;
- metrics avoid unbounded labels and logs are structured/redacted;
- deployments expose game/platform/config/content versions and run IDs;
- operator dashboard supports start, pause, resume, safe restart, interaction disable, mute, safe intermission, snapshot, rollback, and emergency halt with audit logs;
- runbooks cover every paging alert and common provider/platform incident;
- on-call or operational ownership is assigned for production periods;
- status and incident records distinguish gameplay result from infrastructure failure.

Stop-ship examples: no way to know the stream is frozen, no alert on failed restore, operator actions unaudited, dashboards cannot identify affected run/version, or no owner for critical alerts.

## Gate K — Delivery, Compatibility, and Rollback

Required evidence:

- CI enforces formatting, types, tests, contracts, determinism fixtures, security checks, and documentation traceability;
- deployment artifacts are immutable and identify source commit;
- configuration and content changes are validated, versioned, staged, and reversible;
- schema and snapshot compatibility are declared for upgrade and rollback;
- feature flags have owner, expiry, default, and safe-disable path;
- canary promotion criteria and automatic/manual rollback triggers are exact;
- rollback drill restores a verified stream scene and valid run boundary;
- release notes identify gameplay, interaction, operator, schema, and policy impact.

Stop-ship examples: irreversible snapshot upgrade without fresh-run boundary, mutable unversioned content, no previous compatible deployment, untested rollback, or direct production configuration edits without audit.

## Evidence Bundle Format

Each candidate stores:

```text
evidence/<game>/<release-id>/
├── manifest.md
├── traceability.csv
├── tests/
├── simulations/
├── replay/
├── performance/
├── soak/
├── chaos/
├── accessibility/
├── audio-visual/
├── security-privacy/
├── moderation-interactions/
├── operations/
├── rollout-rollback/
└── reviews/
```

`manifest.md` records commit, deployment, game/config/content/schema versions, reference hardware, test dates, commands, artefact checksums, reviewer roles, open risks, and final decision. Evidence must be reproducible or explicitly explain why an external provider artefact can only be revalidated.

## Risk Acceptance

P0 and P1 findings cannot be accepted for production. A P2 finding may be accepted only when:

- it does not violate a MUST requirement or platform policy;
- impact and exposure are bounded;
- a monitored mitigation exists;
- an owner and deadline are assigned;
- rollback/disable remains safe;
- the production-readiness reviewer records the decision.

P3 refinements are tracked but do not block unless their combination creates material risk.

## Final Sign-Off Matrix

R5 requires explicit pass from these roles or specialist reviews:

- product/game design;
- autonomous AI and simulation integrity;
- engineering architecture;
- performance;
- broadcast UI/VFX/accessibility;
- audio;
- audience interaction/moderation/platform policy;
- security/privacy;
- reliability/operations;
- production-readiness reviewer independent of the implementer.

## Truthful Status Language

- Use “prototype” for R1.
- Use “vertical slice” for R2.
- Use “interaction candidate” for R3.
- Use “production candidate” for R4.
- Use “production ready” only after R5 evidence is complete.

Any status regression caused by a material authoritative, recovery, security, provider, resource-lifecycle, or output change must be recorded and the affected gates rerun.
