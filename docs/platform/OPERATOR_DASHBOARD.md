# Shared Operator Dashboard

## Mission

Give authorized operators a truthful, low-friction control plane for observing, configuring, recovering, and safely stopping autonomous livestream channels without permitting arbitrary mutation of authoritative state.

## Roles

- viewer/support: read public-safe health summaries;
- operator: lifecycle, interaction disable, safe restart, snapshots, scenes, audio and quality controls;
- moderator: sanctions, public-text controls, interaction queues, policy evidence;
- release manager: deployment/config/content rollout and rollback;
- security administrator: credentials, roles, emergency revocation;
- auditor: read immutable actions/evidence;
- administrator: tightly limited role management and environment configuration.

Deny by default. High-impact actions require recent authentication and explicit confirmation; production emergency actions remain fast but audited.

## Channel Overview

For each channel show:

- public status and scene;
- environment, deployment, platform/game/config/content/schema versions;
- run ID, seed hash, lifecycle, tick, progress, record, integrity state;
- simulation/render/audio/output heartbeat and freshness;
- tick/frame/audio/resource/queue/snapshot/persistence/provider health;
- audience gateway, moderation, entitlement, event director, and interaction state;
- recent automated recoveries, alerts, incidents, and rollback point;
- evidence/canary/readiness level.

Private fields and secrets are never rendered. Viewer identities/text are shown only to authorized moderation workflows and according to retention policy.

## Controls

Typed audited commands:

- start next run at safe boundary;
- pause/resume when game policy permits;
- terminate/quarantine affected run;
- create validated snapshot;
- restore from a selected verified compatible snapshot;
- start fresh run preserving failed evidence;
- enable/disable all interactions, a provider, effect class, effect, vote, or public text;
- mute/unmute buses and set approved mix/quality presets;
- switch to safe intermission, maintenance, clean feed, or emergency halt scene;
- restart renderer/audio/gateway/worker through supervisor;
- promote/rollback deployment, configuration, or content through approved release workflow;
- rotate/revoke credentials through secret-management integration;
- annotate incident/canary and acknowledge alert.

No free-form memory editing, database SQL, arbitrary command text, or client-side direct game mutation.

## Command Safety

Each action displays target environment/channel/run/version, expected effect, preconditions, reversibility, public impact, and audit reason. Server revalidates authorization, state, compatibility, idempotency, and policy; UI state is not trusted.

High-risk actions use typed confirmation or dual control where required. Commands expire, return accepted/queued/applied/rejected/failed status, and correlate with supervisor/game events.

## Configuration

Configuration uses versioned schemas, validation, diffs, ownership, rollout window, safe defaults, compatibility, and rollback. Production editing creates a new version; it never mutates an active configuration invisibly.

Game/effect parameters expose declared ranges and warnings. Changes affecting deterministic rules, snapshots, paid effects, security, moderation, or accessibility trigger the appropriate review and canary reset.

## Interaction and Moderation Operations

Operators can inspect aggregate queues/status, fixed vote windows, effect eligibility/rejection reason codes, provider health, reversals, and public acknowledgement without exposing raw payment data. Moderators receive bounded evidence needed for policy decisions.

Emergency controls can disable public text, paid-eligible authoritative effects, one effect class, or all interactions while autonomous play continues.

## Recovery Workflow

Dashboard guides operators through:

1. identify failure domain and integrity state;
2. observe automated action/backoff/breaker;
3. preserve evidence and verify public safe scene;
4. choose only eligible action: component restart, verified restore, earlier snapshot, fresh run, rollback, or halt;
5. verify tick/render/audio/output/provider/durability recovery;
6. record incident and return to service.

It never recommends “continue” after divergence or unsupported snapshot compatibility.

## Alerts and Runbooks

Alert cards show severity, impact, start/duration, affected channel/run/version, key signals, recent automation, runbook, owner, acknowledge/escalate, and verification. Runbooks are versioned and linked to executable/read-only queries or safe controls.

## Audit

Immutable audit records include operator/service identity, role, environment, target, action/version, parameters digest, reason, request/decision/application times, result, correlation, previous/new configuration, and related incident/release. Secrets and unnecessary personal data are excluded.

## Security and Availability

- strong authentication and session controls;
- least privilege and environment separation;
- CSRF/injection/output-encoding protections;
- short-lived service tokens and secret redaction;
- read-only degraded mode when control dependencies fail;
- emergency revocation path independent of normal game UI;
- dashboard failure cannot stop simulations;
- operator commands enter a durable audited control path with bounded queue;
- access and command anomalies alert.

## Testing

- role/permission/deny-by-default and session expiry;
- command precondition/idempotency/expiry/state race;
- production/staging target clarity;
- configuration schema/diff/version/rollback;
- snapshot compatibility and recovery guidance;
- interaction/public-text emergency disable;
- renderer/audio/provider/simulation restart status;
- audit completeness/redaction;
- CSRF/XSS/injection/malicious text;
- dashboard/control-plane outage while game continues;
- mobile/desktop operator accessibility and critical action usability;
- incident and rollback drills.

## Acceptance

The dashboard is production-capable when authorized operators can identify channel truth, safely execute every runbook and emergency control, recover/rollback without arbitrary mutation, distinguish game loss from infrastructure failure, audit every action, protect secrets/viewer data, and lose the dashboard itself without losing the autonomous game.
