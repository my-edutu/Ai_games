# Phase 5 — Persistence, Recovery, Observability, and Operations

**Phase status:** R4 infrastructure candidate — implementation verified  
**Verified source head:** `21985ddf48907623f3495268f23972f8c9d461e4`  
**Verification run:** GitHub Actions `31969477750`  
**Production-ready status:** No; Phase 6 environment/endurance/canary gates remain

## Outcome

Autonomous Snake now has an operable reference service around the deterministic game: append-only events, fsync-backed persistent evidence, bounded snapshots/audits, single-writer lease fencing, exact command replay, corrupt-snapshot fallback, divergence quarantine, component supervision, output protection, bounded queues and breakers, metrics/alerts, typed RBAC controls, incident runbooks and retained chaos evidence.

The verified service can be reconstructed in a new process-shaped instance from a file-backed store. It restores the newest compatible snapshot, replays post-snapshot commands, preserves durable command dedupe and only then accepts new work. Provider/moderation outages disable interactions while autonomous simulation continues.

## Implemented Architecture

```text
Snake Runtime
  → durable command reservation
  → append-only semantic event stream
  → bounded snapshots and projections
  → fsync event/audit evidence + atomic snapshot index
  → generation-fenced writer lease
  → supervisor / output health / circuit breakers
  → verified snapshot + command replay recovery
  → metrics, alerts, runbooks and audited operator controls
```

### Persistence and Records

- Contiguous checksummed event streams with event-ID idempotency.
- Conflicting duplicates and sequence gaps fail closed.
- Record projections rebuild from authoritative events.
- Technical/quarantined outcomes remain ineligible for normal records.
- File-backed JSONL events/audits use fsync; snapshot indexes use atomic temp-write/rename.
- Events, snapshots and audits enforce configured capacity/retention before or during durable mutation.
- Corrupt persisted JSON fails service reconstruction with typed evidence.

### Lease, Supervision, and Recovery

- One writer per channel with monotonic lease generation.
- Successful ticks renew the lease; stale generations are fenced.
- Recovery fences the old writer before issuing a newer generation.
- Snapshot schema, compatibility, checksum and state invariants are verified.
- Corrupt newest snapshots fall back to older compatible evidence.
- Post-snapshot commands replay in exact sequence.
- Command gaps or final-checksum divergence quarantine instead of silently continuing.
- Durable command reservations prevent duplicate execution after worker replacement.

### Degradation and Output Health

- Heartbeat loss is distinguished from no-progress state.
- Provider/gateway failure disables interactions without halting autonomous play.
- Black, frozen, stale, wrong-scene and unintended-silence conditions are classified.
- Unsafe output activates intentional safe output before reconstruction.
- Recovery requires verified snapshot and healthy output before resume.
- Repeated failed recovery halts safely after a bounded attempt count.
- Crash loops open a circuit breaker and cannot restart forever.

### Observability and Operator Controls

- Metric series and label lengths are bounded.
- Private identity labels are rejected.
- Alerts require sustained breach and sustained recovery and carry runbook references.
- Operator controls are environment-scoped, role-gated, typed, idempotent and audited.
- Interactions and public text can be disabled independently while simulation continues.
- Verified restore, fresh run and emergency halt require administrator authority.
- Arbitrary database/memory editing is not exposed.

## Fresh Verification

The exact source head passed:

- **146/146 Node tests**, zero failures;
- all Phase 1–4 regressions;
- strict TypeScript compilation and locked `npm ci`;
- stream self-test with authority stability, verified recovery, restart observation, 901 accepted snapshots and zero rejected snapshots;
- authoritative nondeterminism scan;
- deterministic Phase 5 chaos campaign;
- **3/3 Chromium** broadcast/layout/accessibility tests;
- retained Phase 3 capture and Phase 5 operations artifacts.

The deterministic chaos campaign recorded:

- 30 total ticks;
- five autonomous ticks during provider outage;
- interactions disabled during outage;
- zero invariant failures;
- zero duplicate event IDs;
- contiguous event sequence;
- corrupt evidence rejected and older snapshot restored;
- lease generation advanced to two;
- crash breaker opened and unsafe output protection activated;
- final checksum `cce0465f`.

## Acceptance Criteria

- [x] Records/projections rebuild and exclude technical/quarantined outcomes.
- [x] One active writer is enforced and old writers are fenced before restore.
- [x] Verified restore plus command replay matches uninterrupted checksums.
- [x] Corrupt/incompatible/divergent evidence fails closed or quarantines.
- [x] Common component/provider failures degrade without duplicate authority.
- [x] Output probes and bounded safe-recovery workflow are implemented and tested.
- [x] Crash loops use bounded breakers and safe halt behavior.
- [x] Events, snapshots, audits, queues, dedupe maps, crash histories and metric labels are bounded.
- [x] Alerts, runbooks and typed audited operator controls are implemented and tested.
- [x] Security/privacy/operator/supply-chain controls have no open P0/P1 finding.
- [x] Persistent process reconstruction and command idempotency pass.
- [x] Exact-head regression, chaos and browser gates pass.
- [ ] Real 24-hour production-equivalent endurance evidence — Phase 6 environment gate.
- [ ] Managed production storage/backups and real on-call/rollback drills — Phase 6 environment gate.

## Evidence

See `evidence/autonomous-snake/r4-phase-05/phase-05/`.

Retained GitHub Actions artifacts:

- Phase 5 operations artifact `9269385817`, SHA-256 `1007c478bc533afa094e610545a6b6c9c7c31eaa5a4a661411227bd58810df79`.
- Phase 3 capture artifact `9269385523`, SHA-256 `6e89985c37f9330cb892beb056a6f87d3cdaa949eb9265d586480b1fdb98fe18`.

## Boundary and Handoff

Phase 5 is complete as an **R4 infrastructure-candidate implementation**. The CI chaos campaign is compressed deterministic evidence, not a claim that 24 hours elapsed on production-equivalent infrastructure.

Phase 6 must freeze a candidate and close the remaining real-environment gates: managed deployment/storage, credentialed current providers, production-reference performance and audio/capture validation, real endurance, operational drills, limited canary and an independent final readiness verdict. Only that verdict may authorize an R5 production-ready label.