# Shared Analytics and Records Platform

## Mission

Build trustworthy, privacy-safe projections and evidence from authoritative game events, audience decisions, presentation signals, and operational telemetry. Records and gameplay outcomes are deterministic projections; product analytics are decision tools with explicit definitions and limitations.

## Data Classes

- authoritative gameplay events and run results;
- snapshots/checksum/replay metadata;
- audience input, eligibility, decision, application, expiry, and reversal;
- procedural content features and generator diagnostics;
- agent decision/fallback/stuck aggregates;
- presentation, audio, accessibility, and output-health events;
- performance, resource, persistence, provider, recovery, and incident signals;
- experiment exposure and privacy-safe aggregate viewer/channel outcomes.

Raw payment details, secrets, prompts, unrestricted chat, and unnecessary identities are prohibited.

## Records

Every record definition includes stable ID, game/mode/config eligibility, value/unit, comparison direction, tie rule, authoritative source events, version/season scope, integrity requirements, reconciliation query, display copy, and migration/reset behaviour.

Examples: maximum Snake length, fastest valid maze exit by difficulty band, highest tower floor, longest zombie day, largest verified civilization population, battle-royale streak, traffic throughput, or colony territory. Standard and Chat vs AI records remain distinguishable.

Record updates occur after terminal or game-declared milestone validation. Technical/integrity failures cannot set normal records. A projection can rebuild from source events and compare its checksum to stored values.

## Event Registry

Schemas are versioned and document producer, required fields, privacy classification, retention, sampling, dedupe/order, allowed dimensions, expected rate, and consumers. High-volume tick/entity details are sampled or summarized; authoritative event logs remain separate from analytics metrics.

## Metric Contracts

Each metric defines decision, formula, unit, eligible population, exclusions, time window, dimensions, source events/versions, latency, expected range, guardrails, owner, dashboard, and limitations.

Core families:

- gameplay: run duration, progress, outcome, failure cause, milestone, record, dramatic pattern, strategy/content diversity;
- AI: decisions, latency, budget, fallback, stuck, recovery, goal completion;
- content: validity, repair/fallback, features, duplicates, generation cost;
- interaction: requested, accepted, queued, applied, rejected, expired, reversed, participation, consequence visibility;
- broadcast: comprehension, HUD state, frame, VFX density, audio loudness/silence, output freshness;
- reliability: crash, restore, divergence, snapshot age, queues, resource slope, provider state;
- business: privacy-safe aggregate watch/return/interaction/support outcomes with fairness/policy guardrails.

## Storage and Projections

Authoritative source events use append-only durable storage and lifecycle/retention rules. Projections and aggregates are rebuildable, versioned, idempotent, and use bounded partitioning. Hot operational stores retain only the window needed for live dashboards; archives and rollups prevent unbounded live state.

Late events and reversals update projections through new facts. Historical source events are not rewritten. Backfills identify code/schema version and never silently mix incompatible definitions.

## Experiments

Experiments declare hypothesis, variant, unit, allocation, exposure event, population, duration, sample size/sequential rule, primary metric, guardrails, stop conditions, analysis, rollout, and rollback. Deterministic game configuration/variant is recorded per run.

Guardrails include integrity, crashes/recovery, performance, accessibility, moderation, paid-effect fairness, provider errors, complaints, and content diversity. Revenue/watch-time improvements cannot compensate for a stop-ship regression.

## Privacy and Access

Prefer run/channel aggregates. Viewer references are scoped/tokenized only where necessary for dedupe, voting, moderation, entitlement, or permitted cohort analysis. Data inventory specifies purpose, owner, retention, deletion/export, encryption, and roles. Dashboards and logs never expose raw sensitive content by default.

Metrics avoid run/user/text IDs as labels. High-cardinality analysis belongs in bounded queries over controlled data, not operational metric dimensions.

## Evidence Manifests

Every simulation, benchmark, soak, canary, experiment, and readiness report includes commit/deployment, versions, configuration/content hashes, seed/event corpus, environment/hardware, commands, dates, artefact paths/checksums, thresholds, results, exclusions, reviewer, and decision.

## Data Quality

Checks cover schema compatibility, sequence gaps, duplicates, late arrival, impossible values, sample ratio, exposure delivery, bot/test/quarantine classification, provider outage, version drift, projection reconciliation, and metric cardinality/volume.

Dashboards display freshness and quality state. Missing/incomplete data cannot silently appear as zero or success.

## Testing

- event schema/compatibility and privacy scans;
- idempotent projections and rebuild;
- record tie/eligibility/version/reconciliation;
- duplicate/late/reversal handling;
- technical failure exclusion;
- bounded partitions/retention/backfill;
- metric formula fixtures and data-quality alerts;
- experiment allocation/exposure/sample ratio/rollback;
- high-volume/cardinality/load;
- access/retention/deletion/export controls;
- evidence manifest reproducibility.

## Acceptance

The platform is ready when records rebuild exactly from authoritative events, metric contracts drive explicit decisions, technical/test/quarantine data is correctly classified, projections are idempotent and bounded, experiments have valid guardrails and exposure, sensitive data is minimized/protected, data quality is visible, and readiness evidence can be reproduced from its manifest.
