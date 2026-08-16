# Autonomous Snake Operational Handoff

## Current State

All six software implementation phases are complete. The exact Phase 6 implementation head passed 180 Node tests, three Chromium tests, traceability, final campaigns, capacity logic, all synthetic drill implementations and truthful readiness-gating checks.

The game is an **R4 production candidate**. It is **not yet R5 production ready** because the required production-reference, credentialed, real-duration, witnessed and independently reviewed evidence has not occurred.

## Owners Required

- Release owner: freezes candidate and controls promotion/rollback.
- On-call owner: monitors channel, responds to alerts and executes runbooks.
- Security/privacy owner: credentials, access, provider authentication, privacy and incident review.
- Product/game owner: balance, records, audience effect policy and canary outcomes.
- Broadcast owner: OBS/encoder/audio/capture chain and visual accessibility.
- Independent reviewer: samples primary evidence and returns final exact-candidate verdict.

## Production Programme Order

1. Provision managed production environment, storage/backups, secrets, domains/certificates, observability, capture and on-call ownership.
2. Freeze candidate manifest and immutable rollback identity.
3. Run production-reference capacity, audiovisual and accessibility validation.
4. Run credentialed YouTube and Twitch production-equivalent validation.
5. Complete external security/privacy/moderation/asset/supply-chain attestations.
6. Execute all 26 production-equivalent drills with an independent witness.
7. Run the exact frozen candidate for at least 72 real elapsed hours.
8. Review evidence; any material change returns to the first affected validation gate.
9. Start the limited production canary with immutable thresholds.
10. Run for at least seven real elapsed days unless a rollback trigger fires.
11. Provide the complete primary evidence bundle to the independent reviewer.
12. Run the readiness assessor. Promote only on exact-candidate `PASS`.

## Routine Operations

Monitor:

- simulation heartbeat, progress and checksum integrity;
- AI decision/fallback/replan/stagnation metrics;
- provider, moderation, entitlement and audit health;
- snapshot/event sequence, persistence latency and recovery outcomes;
- renderer/audio/capture freshness and output health;
- queues, memory, handles, listeners, timers and resource slopes;
- gameplay outcomes, records and effect balance;
- deployment/config/content/asset versions.

Use typed operator controls only. Arbitrary database or in-memory game edits are prohibited.

## Emergency Priority

```text
privacy / unauthorized control
  > replay and exactly-once integrity
  > safe public output
  > durable evidence
  > automatic recovery
  > feature availability
```

When truth is uncertain, disable interactions, activate safe output, fence the writer, preserve evidence and restore only from compatible verified state.

## Evidence Locations

- Phase 1: `evidence/autonomous-snake/r1-phase-01/phase-01/`
- Phase 2: `evidence/autonomous-snake/r2-phase-02/phase-02/`
- Phase 3: `evidence/autonomous-snake/r2-phase-03/phase-03/`
- Phase 4: PR #6 and Phase 4 test/fixture implementation.
- Phase 5: `evidence/autonomous-snake/r4-phase-05/phase-05/`
- Phase 6: `evidence/autonomous-snake/r5-phase-06/phase-06/`
- External R5 intake: `docs/operations/autonomous-snake-r5-evidence-intake.md`
- Incident runbook: `docs/operations/autonomous-snake-runbook.md`
- Rollback matrix: `docs/operations/autonomous-snake-rollback-matrix.md`
- Provider source checklist: `docs/operations/provider-validation-sources.md`

## Promotion Rule

Never infer production readiness from merged code, a green CI run, synthetic elapsed timestamps or fixture providers. The sole promotion authority is the final Phase 6 readiness assessor with current exact-candidate external evidence and an independent `PASS`.