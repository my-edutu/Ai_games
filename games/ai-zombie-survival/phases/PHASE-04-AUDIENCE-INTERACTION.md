# Phase 4 — Audience Interaction

**Target:** R3 interaction candidate  
**Software status:** IMPLEMENTED — verification is attached to the active completion PR  
**Release status:** R3 only; provider credentials and production launch evidence remain outside this phase

## Objective

Allow viewers to influence bounded tactical conditions while preserving autonomous play, deterministic authority, privacy, moderation, replayability, and exactly-once outcomes.

## Delivered contract

- Provider-neutral catalogue of exactly ten approved effects; clients choose fixed candidates rather than sending arbitrary gameplay payloads.
- Deterministic candidate IDs, payloads, scheduling, expiry, application order, and audit records.
- Idempotent queueing and exactly-once application across duplicate provider events, retries, replay, and worker replacement.
- Bounded queue capacity, terminal-state refusal, cooldowns, effect caps, and same-tick conflict-group exclusion.
- Append-only acknowledgement and reversal records; reversals do not rewrite the original event.
- Timed effects expire deterministically and restore ordinary simulation behavior.
- Audience effects cannot directly choose a terminal outcome, fabricate records, expose hidden authority data, or bypass autonomous decision-making.
- Public snapshots expose only bounded aggregate influence status; provider IDs, source labels, seen-ID state, candidate internals, and viewer data remain private.
- No-audience, moderation failure, and provider outage paths leave the autonomous simulation running.
- Fresh deterministic compatibility boundary (`zombie-v4`) across runtime, manifest, snapshots, and replay evidence.

## Test-first evidence

- `tests/phase4/zombie-influence.test.cjs`
- `tests/phase4/zombie-influence-review.test.cjs`
- `tests/phase5/zombie-channel.test.cjs`
- `npm run test:zombie:phase4`
- Full repository replay and determinism suite

The regressions cover the fixed catalogue, deterministic eligibility, terminal-outcome exclusion, duplicate suppression, queue bounds, conflict groups, timed expiry, real runner-surge composition, append-only reversal, public-data minimization, and the v4 compatibility boundary.

## Review and remediation

| Severity | Finding | Resolution |
|---|---|---|
| P1 | The original phase file did not make privacy, exactly-once, outage, and conflict guarantees auditable. | Acceptance criteria and test mappings are now explicit. |
| P1 | Concurrent branch work could have shipped the interaction layer without current-main CI coverage. | Zombie tests, nondeterminism scanning, and artifact generation are added to the unified CI workflow. |
| P0 | None found. | — |

## Exit gate

Phase 4 is complete when the exact PR head passes all deterministic influence, channel, replay, privacy, and repository-wide regressions with no open software P0/P1 finding. R3 does not authorize arbitrary viewer text, direct state mutation, pay-to-win terminal control, or production provider claims.
