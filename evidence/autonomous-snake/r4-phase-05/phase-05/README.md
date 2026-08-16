# Autonomous Snake Phase 5 — R4 Infrastructure Candidate Evidence

This directory records evidence for the Phase 5 reliability and operations implementation tested at source head `21985ddf48907623f3495268f23972f8c9d461e4` on August 16, 2026.

## Verified in GitHub Actions

- Strict TypeScript build and locked `npm ci` installation.
- 146/146 Node model, integration, recovery, durability, control-plane and chaos tests.
- Complete Phase 1–4 regression suite.
- Deterministic stream self-test with 901 accepted presentation snapshots and zero rejected snapshots.
- Authoritative nondeterminism scan.
- Deterministic Phase 5 chaos campaign and retained artifact.
- Three Chromium broadcast/layout/accessibility tests.
- Retained desktop/mobile/clean-feed capture artifact.

## Implemented Operational Capabilities

- Append-only sequence-safe event evidence and record projections.
- Fsync-backed JSONL event/audit storage and atomic snapshot indexes.
- Process reconstruction from persistent snapshots plus post-snapshot command replay.
- Exactly-once durable command reservation across worker replacement.
- Generation-fenced single-writer leases and renewal.
- Corrupt-snapshot fallback, replay-divergence quarantine and startup fail-closed behavior.
- Bounded queues, snapshots, event segments, audits, dedupe state, crash history and metric cardinality.
- Heartbeat/progress supervision, crash-loop breakers and safe degradation.
- Black/frozen/stale/wrong-scene/silent output classification and bounded recovery workflow.
- Environment-scoped RBAC, typed operator controls and append-only audit.
- Security, privacy, retention, rollback and incident runbooks.

## Evidence Boundary

The CI chaos campaign is compressed deterministic evidence. It is not a claim that 24 hours elapsed on production-equivalent hosts. Production-reference resource slopes, managed infrastructure, credentialed provider operation and the real-duration endurance/canary gates remain Phase 6 requirements. Phase 5 is therefore an R4 infrastructure candidate, not an R5 production launch.