# Phase 6 — Release Validation and Launch Governance

**Target:** Exact-candidate R4 release candidate with fail-closed R5 promotion  
**Software status:** Complete after exact-candidate CI verification  
**Default readiness:** `BLOCKED` at R4 until genuine external evidence passes

## Delivered

Phase 6 binds every release claim to a full Git commit SHA and immutable release-manifest checksum. The manifest records platform, game, deterministic, snapshot, event, provider-adapter, configuration, content, asset, deployment, ownership, rollback, environment, feature-flag, and software-evidence identities. Candidate changes create different evidence digests; branch names and abbreviated SHAs are rejected.

All six phases are represented by MUST-level traceability requirements with candidate-bound evidence. The final validation campaign runs every ecosystem profile in autonomous baseline and maximum bounded audience-pressure modes, reruns the campaign byte-deterministically, checks population bounds, counts illegal actions and invariants, proves effects apply without purchasing terminal outcomes, and records exact report checksums. Phase 5 chaos recovery is included in the candidate bundle.

Capacity evaluation separates passing CI-reference performance from production-reference capacity. Synthetic endurance may test evaluator logic but cannot satisfy real elapsed time. Fixture providers cannot impersonate credentialed production-equivalent validation. CI safety attestations and implementation drills cannot impersonate external signed production evidence. Synthetic canary timestamps cannot satisfy a real seven-day canary. Independent review must be current, external-signed, and for the exact manifest checksum.

The readiness assessor returns:

- `FAIL` for integrity defects, open P0/P1, failed endurance, canary rollback, unauthorized control, private exposure, replay divergence, duplicate effects, or prohibited terminal influence;
- `BLOCKED` with highest truthful readiness R4 when software passes but genuine external evidence is incomplete;
- `PASS` and `productionReady: true` only when all production-reference, provider, safety, endurance, drill, canary, and independent-review gates pass for the same candidate.

The readiness score allocates 88/100 to a completely verified software candidate: deterministic integrity, autonomous ecosystem, privacy boundary, broadcast/accessibility, audience safety, durability/recovery, and implementation drills. The remaining 12 points are reserved for genuine production evidence and cannot be awarded by CI.

## Acceptance evidence

- [x] Full-SHA candidate validation and immutable manifest.
- [x] Candidate-bound software artifact digests and rollback identity.
- [x] Complete Phase 1–6 traceability with no prohibited waiver path.
- [x] Deterministic baseline and maximum-pressure final campaigns.
- [x] Zero invariant, illegal-action, replay, duplicate-effect, unauthorized-control, and private-exposure findings in the software candidate.
- [x] Capacity budgets pass while production-reference status remains false.
- [x] Synthetic endurance, provider, safety, drill, and canary evidence remains truthfully blocked.
- [x] Integrity overrides produce `FAIL`, not a misleading external block.
- [x] Readiness score is deterministic, checksum-protected, and capped below 90 while external gates remain.
- [x] Release validation script emits candidate-bound JSON and fails the job on software or integrity failure.
- [x] Operations runbook covers every mandatory drill, safe scene, verified restore, rollback, and independent witness.

## Verification commands

```text
npm run test:ant:phase6
CANDIDATE_SOURCE_SHA=<40-char-commit> npm run ant:phase6:validate
npm run ant:phase5:chaos -- ant-phase6-chaos
npm run ant:stream:self-test
npm run test:browser
npm test
authoritative nondeterminism scan
```

## External R5 blockers

1. Production-reference capacity evidence on declared hardware.
2. Credentialed, production-equivalent YouTube and Twitch validation.
3. External signed security, privacy, moderation, accessibility, audiovisual, asset, and supply-chain attestations.
4. Real elapsed 72-hour endurance with clean integrity and bounded resource slopes.
5. Every mandatory drill executed in production-equivalent/production with an independent witness.
6. A real seven-day canary with guardrails, complete samples, and no rollback trigger.
7. A current independent signed review for the exact candidate checksum.

The software is complete through Phase 6. “Production ready” remains false until these real-world gates are actually completed.
