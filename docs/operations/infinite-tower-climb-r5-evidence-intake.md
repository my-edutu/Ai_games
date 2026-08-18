# Infinite Tower Climb R5 Evidence Intake

## Promotion rule

Production readiness is permitted only for one frozen candidate whose assessor returns `PASS`, `R5`, `productionReady: true`, with zero open P0/P1 findings. CI fixtures and compressed time cannot satisfy external gates.

## Candidate identity

Every record must include the candidate source SHA, release checksum, deployment artifact, config hash, content hash, asset hash, environment, collection time, owner, reviewer or witness and an immutable evidence digest.

## Required evidence

### Production-reference capacity and audiovisual validation

Measure the actual host, GPU, encoder, browser source, audio chain and capture path. Supply tick, AI, render, snapshot and restore p50/p95/p99/max; queue utilisation; memory/handle slopes; encoder and frame-drop data; caption timing; low-bitrate and phone-size captures. Passing CI capacity is not production-reference capacity.

### Real 72-hour endurance

Run the exact frozen candidate for at least 72-hour real elapsed time. Record resource slopes, replay checksums, duplicate effects, crashes, restore attempts, unresolved output failures, manual common recoveries, private exposures and crash loops. Accelerated timestamps are rejected.

### Credentialed YouTube validation

Use the current production-equivalent YouTube OAuth and Live Chat path. Verify authentication, supported message families, deduplication, reconnect, rate limits, moderation, entitlement uncertainty, outage behavior, reversal and privacy-safe identity handling.

### Credentialed Twitch validation

Use the current production-equivalent Twitch EventSub webhook or WebSocket path. Verify signature/authentication, replay protection, reconnect, duplicate delivery, rate limits, cheer/subscription/gift normalization, outage behavior, reversal and privacy-safe identity handling.

### External attestations

Provide current independent evidence for security, privacy, moderation, accessibility, audiovisual quality, asset licences and software supply-chain integrity. Each attestation must name the exact candidate and contain zero blocking findings.

### Witnessed production-equivalent drills

Run every mandatory drill from the Tower runbook in a production-equivalent environment. Each drill needs an owner, independent witness, start/end time, environment, evidence digest, verified automated actions and verified public output.

### Real seven-day limited canary

Freeze thresholds before launch. Collect monotonic exact-candidate samples for seven-day real elapsed time with no excessive gaps. Immediate rollback triggers include replay divergence, duplicate effects, private exposure, unauthorized control, unsafe moderation, crash loop, restore failure, record corruption, bad output or platform-policy breach.

### Independent exact-candidate review

An external signed reviewer must assess architecture, fixed-point physics, content solvability, AI legality, audience fairness, UI/accessibility, durability, recovery, security/privacy, operations, rollback and evidence traceability for the exact release checksum.

## Intake validation

Evidence is rejected when stale, synthetic, fixture-only, self-signed where independence is required, bound to a different candidate, missing a digest, missing an owner/witness, incomplete, contradictory or collected before a material candidate change.

## Final decision

The release owner runs the canonical assessor only after all evidence is ingested. A blocked result remains R4. A failure returns to the first failed phase. Only a clean `PASS / R5` decision authorizes production-ready labelling.
