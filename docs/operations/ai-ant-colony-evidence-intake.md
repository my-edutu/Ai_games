# AI Ant Colony / Ecosystem — Production Evidence Intake

## Rule

Only evidence for the exact release-manifest checksum may promote Game 12 beyond R4. CI, fixtures, accelerated clocks, synthetic witnesses, mutable URLs, branch names, shortened SHAs, stale attestations, or evidence collected for another candidate are implementation evidence only and must remain blocked for R5.

## Required metadata for every artifact

- full 40-character candidate source SHA;
- release-manifest checksum;
- evidence category and requirement/drill ID;
- environment, region, hardware, deployment artifact, config hash, content hash, and asset hash;
- owner and independent witness/reviewer;
- start/end timestamps and real-elapsed declaration;
- evidence source (`external-signed` for production credit);
- valid evidence digest;
- raw logs or immutable references;
- automated-action verification and public-output verification where applicable;
- findings, accepted P2 risks, rollback disposition, and expiry date.

## Intake categories

### Capacity

Provide production-reference samples for tick, AI, render, snapshot, restore, queue ratio, memory, handles, and headroom on declared hardware. CI-reference performance may not be relabelled production reference.

### Providers

Provide credentialed production-equivalent validation for YouTube and Twitch: authentication/signature, reconnect, duplicate callback handling, reversal, outage, rate limit, moderation, entitlement, sanctions/region handling, privacy, and credential rotation/revocation.

### Safety attestations

Provide external signed security, privacy, moderation, accessibility, audiovisual, asset-license, and supply-chain reviews. Each must contain reviewer identity, scope, findings, remediation, expiry, and candidate checksum.

### Endurance

Provide at least 72 real elapsed hours. Include periodic samples, memory/handle/queue slopes, replay divergences, duplicate effects, unresolved output failures, manual common recoveries, private exposures, crash loops, and incident records. Accelerated or synthetic time cannot satisfy this gate.

### Drills

Provide one unique passing record for every mandatory drill in the runbook. Production credit requires production-equivalent or production environment, external-signed source, independent witness, verified automated actions, verified public output, and valid evidence digest.

### Canary

Provide seven real elapsed days for the exact candidate with bounded sample gaps. Include error rate, uptime, bad-output seconds, memory slope, replay divergence, duplicate effects, private exposure, unauthorized controls, unsafe moderation failures, crash loops, restore failures, record corruption, and platform-policy breaches. Material candidate changes reset the canary.

### Independent review

Provide an external-signed review for the exact manifest checksum, reviewer identity, valid digest, open P0/P1 counts, accepted P2 list, and explicit release recommendation. Internal review cannot impersonate this gate.

## Rejection reasons

Reject and record: candidate mismatch, invalid digest, expired evidence, duplicate drill, missing owner/witness, synthetic source, non-production environment, failed or blocked status, missing output verification, missing automated-action verification, incomplete provider checks, insufficient real duration, excessive canary gaps, material-change reuse, open P0/P1, or hidden accepted risk.

## Promotion packet

The final packet must contain the manifest, traceability matrix, campaign report, Phase 5 chaos report, capacity assessment, endurance assessment, provider assessment, safety assessment, drill assessment, canary assessment, independent review, readiness result, score, rollback identity, and evidence index. Promotion is allowed only when readiness returns `PASS`, highest truthful readiness `R5`, `productionReady: true`, and no blocker or failure remains.
