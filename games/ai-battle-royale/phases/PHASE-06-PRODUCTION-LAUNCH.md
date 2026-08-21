# Game 6 Phase 6 — Production Release Gate and Live Launch

## Objective

Convert the completed Game 6 software into a candidate-bound release decision without confusing implementation evidence with production evidence. The release validator uses the shared monorepo readiness assessor and may truthfully return software PASS while the candidate remains BLOCKED at R4. R5 is reserved for genuine external evidence collected against the exact candidate.

## Software release contract

- [x] Candidate identity requires a full 40-character Git commit SHA; branch names and abbreviated SHAs fail closed.
- [x] Release manifest artifacts are candidate-bound and content-addressed.
- [x] Requirements from deterministic foundation through release governance are traceable to exact-candidate software evidence.
- [x] Final campaign includes deterministic baseline reruns and bounded audience-pressure reruns with no permitted terminal viewer effect.
- [x] Phase 5 recovery/chaos evidence is part of the Phase 6 software decision.
- [x] CI-reference capacity must satisfy software budgets, while production-reference capacity remains a separate external gate.
- [x] Missing external evidence produces BLOCKED/R4 rather than a fabricated PASS or R5.
- [x] Any integrity failure, duplicate authoritative application, replay divergence, privacy/control failure, or open P0/P1 produces FAIL.
- [x] Synthetic endurance, fixture providers, CI drills, synthetic canary data, and internal/missing review cannot promote the release to R5.

## R5 evidence gates — intentionally open until genuine evidence exists

- [ ] Production-reference capacity evidence is attested for the exact candidate and deployment environment.
- [ ] At least 72 real elapsed hours of endurance evidence meet the shared sampling, recovery, privacy, replay, and resource-slope policy.
- [ ] Credentialed production-equivalent YouTube and Twitch provider evidence proves authentication, reconnect, duplicate/reversal, outage, rate-limit, moderation/entitlement, and privacy behavior.
- [ ] Required safety attestations are current, externally reviewable, candidate-bound, and free of blocking findings.
- [ ] Every mandatory production drill has exact-candidate evidence, required owner/witness metadata, verified output, and recovery/rollback proof.
- [ ] A real seven-day canary meets duration, sample cadence, uptime/error, bad-output, resource, replay, privacy, control, moderation, crash, restore, corruption, and policy guardrails.
- [ ] An independent current external review is approved for the exact candidate with no open P0/P1 findings.
- [ ] Branch protection and release-owner approval are confirmed before production promotion.

## Release decision

Passing the software section establishes an R4 release candidate, not production readiness. `softwareVerdict: PASS` is compatible with `readiness.verdict: BLOCKED`, `highestTruthfulReadiness: R4`, and `productionReady: false`. Only authentic evidence from the R5 intake process may close the external gates. No synthetic, locally generated, CI-only, or retrospective artifact may be relabeled as production evidence.
