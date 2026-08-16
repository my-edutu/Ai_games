---
name: security-privacy
description: Use when designing or reviewing provider webhooks, operator access, secrets, viewer identities, payment evidence, storage, model prompts, public overlays, content packs, privacy retention, threat models, or incident controls
---

# Security and Privacy

## Overview

Protect gameplay integrity, viewers, operators, providers, and business systems by reducing trust, data, privilege, and irreversible exposure. The core principle is **untrusted inputs cross explicit controls; sensitive data is minimized; powerful actions are authenticated, authorized, audited, and reversible**.

## Scope

Use for architecture, provider adapters, webhooks/sockets, operator controls, identity, payments/entitlements, moderation, storage, analytics, model services, content supply chain, deployments, public rendering, retention, and incidents. It does not replace jurisdiction-specific legal advice; it makes security/privacy requirements implementable and testable.

## Non-Negotiable Invariants

- Secrets never enter source control, client bundles, render snapshots, replay files, analytics attributes, screenshots, or public logs.
- Every external payload is untrusted until authenticated where applicable, schema-validated, bounded, sanitized, authorized, and rate-limited.
- Provider callbacks are replay-protected and idempotent.
- Operator actions use strong authentication, least privilege, explicit roles, short-lived credentials where possible, and immutable audit.
- Raw payment details never enter game state; only minimal entitlement evidence crosses the boundary.
- Viewer data is inventoried, purpose-limited, minimized, protected, retained for a declared period, and deletable/exportable where required.
- Public overlays cannot expose internal IDs, moderation evidence, exact financial data, prompts/responses, stack traces, tokens, host paths, or private diagnostics.
- Remote model inputs/outputs are treated as untrusted and privacy-reviewed.
- Content packs/assets/dependencies are verified, licensed, versioned, and scanned.
- Security failures reject, degrade, revoke, quarantine, or halt safely; they never silently continue with elevated trust.

## Workflow

### 1. Map assets, actors, and trust boundaries

Inventory:

- authoritative state, records, snapshots, event logs;
- provider credentials and webhook secrets;
- viewer identities, chat, display names, entitlements;
- operator accounts and emergency controls;
- model prompts/responses and keys;
- databases, queues, object stores, analytics, logs;
- code, dependencies, content packs, audio/visual assets;
- streaming endpoints and dashboards.

For each record confidentiality, integrity, availability, purpose, owner, retention, and consequences of compromise.

### 2. Threat-model flows

Review spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege, replay, injection, abuse, supply chain, insider misuse, and privacy over-collection.

Prioritize by exploitability, impact, reach, detectability, and reversibility. Map each threat to prevention, detection, response, test, and residual risk.

### 3. Design identity and authorization

Separate provider viewer identity, privacy-safe internal reference, public display name, operator identity, service identity, and game entity. Define role permissions for view, configure, moderate, deploy, rotate credentials, refund/reverse, pause, restart, rollback, and emergency halt.

Use deny-by-default. High-impact actions require recent authentication and may require dual control according to risk.

### 4. Secure provider and audience inputs

Verify signatures/tokens and timestamp/replay windows. Apply idempotency before side effects. Validate schemas, sizes, encodings, URLs, text, amounts/bands, channel identity, and event type. Rate-limit at viewer, channel, adapter, endpoint, and global levels.

Never trust a provider display name or “paid” field without authenticated event context.

### 5. Minimize and protect data

Create a data inventory with purpose and retention. Prefer aggregates and tokenized references. Separate operational audit from analytics. Encrypt sensitive data in transit and at rest using managed capabilities. Restrict access, log reads/exports where appropriate, and define deletion/backup expiry.

Do not add a field because it “may be useful later.”

### 6. Protect public rendering and model use

Escape data for HTML, canvas text, logs, filenames, URLs, queries, and commands. Bound lengths and layouts. Use allowlisted copy keys for system states.

For models: minimize prompts, remove unnecessary identity/payment data, declare provider retention/training settings, validate structured responses, reject stale/malformed output, prevent tool/command injection, cap cost/rate, and keep deterministic fallback.

### 7. Secure operations and supply chain

Use managed secrets, rotation, environment separation, dependency pinning/lockfiles, provenance, vulnerability/license scans, protected branches, reviewed workflows, immutable artefacts, signed/verifiable releases where available, and audit for configuration/content changes.

Emergency revocation must disable compromised provider keys/operator access/effects without requiring a new game build.

### 8. Test and rehearse incidents

Test forged/replayed webhooks, duplicate payment events, authorization bypass, CSRF where applicable, injection/XSS, malicious text/content packs, excessive payloads, rate-limit exhaustion, secret scanning, log redaction, prompt injection, stale model output, backup/restore access, credential rotation, account revocation, and incident evidence preservation.

## Required Outputs

- asset/data inventory with classification, purpose, owner, retention, deletion, and access;
- trust-boundary and threat model;
- identity/role/permission matrix;
- provider authentication, replay, idempotency, and rate-limit specification;
- input validation and output encoding rules;
- secrets/key lifecycle and emergency revocation plan;
- model privacy/security boundary where applicable;
- supply-chain, asset-licence, dependency, and release controls;
- security telemetry, alerts, incident, evidence, notification, and recovery plan;
- test matrix, stop-ship findings, residual risks, and production sign-off requirements.

## Review Gate

Pass only when:

- every trust boundary and sensitive asset has a control and owner;
- forged/replayed/duplicated provider events cannot apply effects;
- least-privilege tests prevent unauthorized operator actions;
- secrets and sensitive fields are absent from repository, client, public output, logs, metrics, replays, and evidence captures;
- public text is context-encoded, bounded, and moderated;
- viewer data collection/retention is necessary and documented;
- model input/output cannot execute unvalidated authoritative actions or expose private content;
- dependency/content/release provenance and scans pass;
- credential rotation/revocation and incident runbooks are rehearsed;
- high/critical findings are fixed before production.

## Stop-Ship Failures

- hard-coded keys or tokens;
- webhook accepted without signature/replay/idempotency checks;
- operator dashboard uses shared admin credential;
- raw payment/chat/provider payload stored in game state;
- internal IDs, stack traces, or prompts shown publicly;
- analytics collects identity “just in case”;
- model response used as command without schema/legal-action validation;
- content pack executes arbitrary code;
- security finding accepted with “monitor after launch”;
- no emergency credential/effect revocation path.

## Handoffs

- `game-architecture`: trust boundaries and process ownership.
- `audience-interaction`, `crowd-moderation`, `game-economy-rewards`: provider, identity, entitlement, text, and audit controls.
- `autonomous-agent-design`: model input/output boundary.
- `long-running-reliability`: secure degradation, revocation, recovery, incident states.
- `simulation-qa` and `production-readiness-review`: adversarial tests and evidence sign-off.
