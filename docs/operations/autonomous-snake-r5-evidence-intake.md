# Autonomous Snake R5 External Evidence Intake

This document defines the only path from the merged Phase 6 implementation to an R5 `PASS`. It is deliberately impossible to satisfy these gates with CI fixtures, synthetic timestamps, copied reports or evidence from a different candidate.

## 1. Freeze the Candidate

Record:

- exact source commit SHA;
- deployment image/artifact digest;
- platform, game, deterministic, snapshot and event versions;
- provider-adapter version;
- configuration, content and asset hashes;
- enabled feature flags;
- production region and hardware/capture reference;
- release, on-call, security and product owners;
- complete rollback identity.

Run `npm run snake:phase6:validate` using the exact candidate SHA. Any material source/config/content/provider/asset/deployment change invalidates affected evidence and resets endurance/canary clocks.

## 2. Production-Reference Capacity Evidence

Collect on the actual approved host/GPU/encoder/audio/capture chain:

- tick, AI, render, snapshot and restore p50/p95/p99/max;
- queue maximum and sustained backlog;
- CPU/GPU/frame/audio budgets;
- memory, handle, listener, timer and queue slopes;
- maximum approved board/occupancy;
- peak audience, VFX, audio and persistence pressure;
- host/hardware identity and attestation;
- primary metrics/export digest.

Evidence must be externally signed or independently witnessed and tied to the exact release checksum.

## 3. Credentialed Provider Evidence

### YouTube

Exercise an authorized user OAuth path against a production-equivalent live broadcast:

- authorization and scope checks;
- token refresh and revoked-consent behavior;
- ordinary chat, Super Chat/Super Sticker, membership and gifting event families supported by the adapter;
- duplicate/idempotency handling;
- reconnect/polling continuity and rate limits;
- entitlement/reversal correction policy;
- outage degradation with uninterrupted autonomous play;
- privacy/redaction and secret-handling review.

### Twitch

Exercise EventSub webhook and/or WebSocket paths:

- correct authentication/signature or token/subscription validation;
- forged, stale, malformed and revoked-event rejection;
- at-least-once duplicate delivery;
- welcome/keepalive/reconnect/revocation behavior;
- subscription/token ownership and scope;
- rate/burst behavior;
- outage degradation with uninterrupted autonomous play;
- privacy/redaction and secret-handling review.

Each provider record must contain candidate checksum, production-equivalent environment, credentialed status, collection/expiry timestamps, all required checks, primary evidence digest, owner and external witness/reviewer.

## 4. Safety and Experience Attestations

Provide clean, externally reviewed production-equivalent attestations for:

- security and threat model;
- privacy, retention, access and deletion;
- moderation/adversarial corpus;
- accessibility and uninstructed mobile comprehension;
- audiovisual capture, loudness and true peak;
- assets/licences/content provenance;
- dependency/SBOM/vulnerability and supply chain.

Any blocking finding or missing reviewer blocks R5.

## 5. Witnessed Operational Drills

Execute all 26 mandatory drills from the frozen candidate in production-equivalent conditions:

1. provider outage;
2. moderation outage;
3. entitlement outage;
4. audit/idempotency outage;
5. interaction disable;
6. public-text disable;
7. simulation failure;
8. renderer failure;
9. audio failure;
10. gateway failure;
11. persistence failure;
12. black output;
13. frozen output;
14. wrong scene;
15. unintended silence;
16. verified restore;
17. older-snapshot fallback;
18. divergence quarantine;
19. credential rotation;
20. credential revocation;
21. configuration rollback;
22. content rollback;
23. deployment rollback;
24. safe intermission;
25. emergency halt;
26. alert acknowledgement/escalation.

Every record requires owner, independent witness, runbook, start/end timestamps, pass status, verified automated actions, verified output and a primary evidence digest.

## 6. Real 72-Hour Frozen-Candidate Endurance

Run the exact frozen candidate continuously for at least 72 real elapsed hours with:

- ordinary and peak audience interactions;
- snapshots/result/restart cycles;
- scene/theme/quality changes;
- provider reconnects;
- scheduled component failures and recovery checks;
- resource and queue monitoring;
- replay/checksum sampling;
- output-health probes.

Immediate failure conditions include duplicate authoritative effects, replay divergence, private exposure, unresolved bad output, manual common recovery, crash loop, unbounded slope or candidate mismatch. Accelerated timestamps do not satisfy this gate.

## 7. Real Seven-Day Limited Canary

Before start, freeze rollback thresholds and the candidate checksum. Run a limited production channel for at least seven real elapsed days with monotonic fresh samples.

Immediate rollback triggers include:

- replay divergence;
- duplicate paid-eligible effect;
- secret/private exposure;
- unauthorized control;
- unsafe moderation;
- repeated crash loop or restore failure;
- persistent black/frozen/wrong/silent output;
- record corruption;
- platform-policy breach;
- quantitative error, uptime, output or memory-slope breach.

Any material candidate change resets the canary clock.

## 8. Independent Review

An independent reviewer must receive the frozen manifest and primary evidence—not only summaries—and:

- verify exact candidate/version identities;
- sample campaigns and tail replays;
- challenge restore/quarantine/provider/rollback paths;
- verify endurance and canary elapsed provenance;
- confirm zero open P0/P1 findings;
- list accepted P2 risks explicitly;
- sign an exact-candidate verdict and evidence digest.

## 9. Final Assessment

Feed all evidence into the Phase 6 readiness assessor. Promotion is permitted only when:

```text
verdict = PASS
highestTruthfulReadiness = R5
productionReady = true
openP0 = 0
openP1 = 0
```

A `BLOCKED` result means evidence is incomplete. A `FAIL` result means a safety, integrity or performance gate failed and the candidate must return to the first affected phase.