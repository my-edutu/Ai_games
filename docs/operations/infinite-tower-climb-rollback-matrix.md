# Infinite Tower Climb Rollback Matrix

## Identity rule

Every rollback decision records the candidate checksum, source SHA, deployment artifact, configuration hash and content hash. A mutable branch name is never sufficient evidence.

| Trigger | Immediate action | Rollback target | State policy | Resume gate |
|---|---|---|---|---|
| Replay divergence or authoritative checksum mismatch | Safe scene, disable interactions, fence writer, quarantine run | Last verified Phase 5 source SHA | No state reuse unless an older compatible snapshot replays exactly | Independent checksum match and witnessed recovery |
| Invalid generated chunk or impossible route | Quarantine content and run | Prior content hash on compatible code | Fresh run boundary | Generator corpus and solver oracle green |
| Duplicate audience effect or prohibited terminal influence | Disable interactions and quarantine affected run | Prior interaction/config identity | Fresh run boundary; record excluded | Exactly-once and fairness campaign green |
| Persistence mutation without durable command evidence | Halt simulation and fence writer | Prior service/deployment artifact | Restore only from verified pre-fault snapshot | Command-sequence and recovery drill green |
| Privacy or unauthorized-control exposure | Emergency halt and revoke credentials | Prior security-reviewed deployment | Fresh run boundary | Security/privacy owner signs exact candidate |
| Black, frozen or wrong public output | Safe scene and presentation rollback | Prior assets hash/browser source | Authority may continue only if output truth remains recoverable | Frame/capture/audio probes green |
| Capacity or resource-slope breach | Reduce load, then rollback if sustained | Prior config and deployment identity | Compatible snapshot allowed when checksums match | Production-reference budget and slope green |
| Canary guardrail breach | Immediate canary stop | Frozen prior production candidate | Fresh run boundary for material changes | New seven-day canary clock after correction |
| Platform-policy or provider-contract breach | Disable provider and interactions | Prior provider adapter/config | Authority continues autonomously | Credentialed provider validation green |

## Fresh run boundary

A fresh run boundary is mandatory after changes to deterministic physics, content generation, collision ordering, audience effect semantics, snapshot compatibility, record eligibility or any quarantined integrity incident.

## Rollback verification

1. Confirm rollback source and candidate checksum.
2. Verify deployment artifact, config and content identities.
3. Fence every old writer.
4. Restore only compatible checksummed evidence or start a fresh run boundary.
5. Run autonomous no-audience health checks.
6. Verify public output and captions.
7. Re-enable providers one at a time after credentialed checks.
8. Record incident, decision, operator, evidence digest and final state.
