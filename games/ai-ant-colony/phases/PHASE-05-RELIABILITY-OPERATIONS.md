# Phase 5 — Reliability, Persistent Campaigns, and Operations

**Target:** R4 infrastructure candidate  
**Software status:** Complete after exact-candidate CI verification  
**Production status:** External evidence required

## Delivered

Game 12 now has an append-only operational authority around the deterministic colony runtime. Commands are validated and durably reserved before in-memory mutation. Semantic events, snapshots, audit records, command dedupe, and retention are bounded. A single-writer lease prevents split-brain operation, renews on successful work, and fences stale workers during replacement or verified recovery.

The Ant Colony channel service reconstructs exact authority from the newest compatible snapshot plus every contiguous post-snapshot command. Corrupt newest evidence is rejected and an older compatible snapshot is used when available. Sequence gaps, command rejection, incompatible evidence, and final-checksum divergence quarantine the run instead of silently continuing. Audience influence reservations survive worker replacement and apply exactly once.

Command idempotency is not limited to the bounded in-memory hot cache. The durable store maintains an O(1) command-reservation index, rejects conflicting command-ID reuse before file append, and rebuilds the index from the append-only journal after process reconstruction. Therefore, an old retry remains a duplicate even after its hot-cache entry has been evicted.

Operational health distinguishes healthy, degraded, and unsafe states across simulation progress, snapshot freshness, frame movement, luma, scene identity, audio, queue pressure, memory slope, and crash loops. Unsafe output triggers an intentional safe scene, bounded component restart, verified restore, and halt after repeated failed verification. Provider or moderation loss disables unsafe interaction while autonomous simulation continues. Persistence loss disables authoritative progress, protects public output, rejects commands before reservation, and rejects snapshot writes.

## Acceptance evidence

- [x] Exact reconstruction equals uninterrupted authority.
- [x] Newest-corrupt snapshot falls back to older compatible evidence.
- [x] Replay divergence and command gaps quarantine fail closed.
- [x] Old writers are fenced before replacement authority resumes.
- [x] Audience commands are durably reserved and applied at most once.
- [x] Old command retries remain idempotent after hot-cache eviction and file-store reconstruction.
- [x] Conflicting command-ID reuse is rejected before disk append.
- [x] Persistence loss disables authoritative progress, protects output, and blocks snapshots before write.
- [x] Operator controls are typed, role-gated, environment-scoped, idempotent, and auditable.
- [x] Black, frozen, wrong-scene, silent, queue, memory, and crash-loop faults are detected.
- [x] Safe scene and verified output recovery are bounded and intentional.
- [x] Events, snapshots, audits, dedupe maps, metrics, and crash history remain bounded.
- [x] Deterministic Phase 5 chaos campaign reports zero integrity failures and zero duplicate applications.

## Verification commands

```text
npm run test:ant:phase5
npm run ant:phase5:chaos -- ant-phase5-candidate
npm run ant:stream:self-test
npm run test:browser
authoritative nondeterminism scan
```

## Honest boundary

The software implementation is an R4 infrastructure candidate. CI uses in-memory or file-contract evidence and provider-faithful fixtures. It does not claim credentialed production providers, real elapsed endurance, witnessed production drills, external security/accessibility review, a seven-day public canary, or an independent signed release review. Those are Phase 6 external R5 gates and cannot be fabricated by tests.
