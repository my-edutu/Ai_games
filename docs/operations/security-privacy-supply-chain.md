# Autonomous Snake Security, Privacy, and Supply-Chain Controls

## Data Minimization

Authoritative game state contains no provider user IDs, exact payment amounts, email, access tokens, raw chat, IP addresses, secrets, stack traces or host paths. Audience identities are provider/channel-scoped HMAC references. Public names are optional, sanitized and bounded. Exact payment and billing data remain outside the game platform.

## Trust Boundaries

Provider payloads are authenticated/authorized and normalized before moderation, rate limiting, entitlement capping, dedupe and audit. Only fixed declared tokens become executable votes. The game accepts only typed scheduled commands with deterministic candidates; no provider SDK type or arbitrary free text crosses the simulation boundary.

## Secrets

Secrets are supplied by the deployment environment, never committed, logged, emitted in metrics or exposed to browser snapshots. Rotation and revocation require interaction disable, audit evidence, replacement verification and explicit re-enable.

## Authorization

Operator controls use least-privilege roles and environment-scoped typed commands. High-risk restore, fresh-run, rollback and halt actions require administrator/on-call-lead authority. All attempts, including denials, are append-only audited.

## Retention

Raw provider envelopes are not retained by the game service. Privacy-safe audit and operational records use declared retention windows. Snapshot/event retention is based on integrity and incident requirements, with compaction/archival performed without rewriting authoritative history.

## Supply Chain

Node and development dependencies are locked. CI uses `npm ci`, current pinned action major versions, TypeScript strict compilation, full regression tests, deterministic-source scans and Chromium capture. Release candidates require dependency vulnerability review, licence/asset manifest verification and immutable source/deployment hashes.

## Incident Triggers

Immediate interaction disable or safe halt is required for secret/private exposure, unauthorized control, forged provider acceptance, duplicate paid-eligible effect, audit/idempotency uncertainty, replay divergence, record corruption or platform-policy breach.