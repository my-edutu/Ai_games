# Phase 5 — Reliability and Operations

**Target:** R4 infrastructure candidate  
**Software status:** IMPLEMENTED — verification is attached to the active completion PR  
**Release status:** R4 candidate; not production ready

## Delivered contract

- Append-only durable runtime commands and semantic evidence.
- Compatible bounded snapshots with checksum verification.
- Deterministic post-snapshot replay, older-snapshot fallback, and quarantine on gaps or divergence.
- Single-writer leases, lease generations, fencing, and stale-writer rejection.
- Exactly-once audience-influence reservation across retries and worker replacement.
- Dependency isolation: optional provider/moderation failures disable interaction without stopping autonomy; persistence failure occurs before authoritative mutation.
- Role-gated, environment-scoped operator controls with durable request/outcome audit.
- Bounded command deduplication, event/snapshot/audit retention, and queue state.
- Output, simulation, audio, queue, and memory health probes with alerting and a supervisor circuit breaker.
- Safe-scene recovery requiring component restart, verified restore, and healthy output before resume.
- Deterministic chaos drills plus production operations and rollback runbook.
- CI generation and retention of `ai-zombie-survival-phase5-operations`.

## Test-first evidence

- `tests/phase5/zombie-channel.test.cjs`
- `tests/phase5/zombie-operations.test.cjs`
- `npm run test:zombie:phase5`
- `npm run zombie:phase5:chaos`
- `docs/operations/ai-zombie-survival-runbook.md`

## Review and remediation

| Severity | Finding | Resolution |
|---|---|---|
| P1 | The inherited completion note referenced an obsolete pre-merge SHA and historical CI run. | Completion now depends on the current PR head and its retained operations artifact; historical evidence is not used as current proof. |
| P1 | Zombie operational gates were absent from current-main CI after parallel Game work. | Stream self-test, chaos generation, deterministic scan, and artifact upload are merged additively with Snake, Maze, and Ant gates. |
| P0 | None found. | — |

## Exit gate

Phase 5 is complete when the exact PR head passes the full suite, stream self-test, deterministic scan, operations tests, chaos drill, browser checks, and retained Phase 5 artifact publication. This is the software rollback boundary for Phase 6; it does not satisfy R5.
