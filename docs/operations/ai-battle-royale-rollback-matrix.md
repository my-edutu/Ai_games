# AI Battle Royale Rollback Matrix

This matrix converts operational symptoms into bounded actions. The release owner must bind every decision to the exact candidate SHA and preserve evidence. Recovery never changes a legitimate game result into a technical loss.

| Trigger | Immediate action | Recovery / rollback | Owner | Required verification |
| --- | --- | --- | --- | --- |
| Simulation no-progress | Switch to safe scene and fence new authoritative work | Restart simulation worker, then verified restore | Gameplay on-call | Tick advances, checksum matches, invariants clean |
| Render frozen or black | Switch to safe scene | Restart presentation host without mutating authority | Broadcast on-call | Render changes and scene matches authoritative lifecycle |
| Persistence stale/unavailable | Safe scene; stop new authoritative mutation | Restore persistence, select compatible envelope, verified restore | Platform on-call | Envelope and state checksums valid; replay manifest reconciled |
| Audience provider/moderation outage | Disable interactions only | Keep autonomous gameplay running; re-enable only after provider checks | Community/Security | Provider authenticated, moderation and region controls healthy |
| Audio failure | Mute audio and retain captions | Restart audio path independently | Broadcast on-call | Captions remain present; bounded audio resumes |
| Duplicate or divergent replay | Safe halt | Roll back to last verified snapshot and investigate idempotency evidence | Gameplay + Platform | No duplicate application; deterministic replay checksum matches |
| Privacy or secret exposure | Disable affected integration and safe halt if scope is uncertain | Rotate credentials, remove leaked data, ship corrected candidate | Security owner | Independent privacy/security attestation for exact candidate |
| Repeated recovery failure | Stay on safe scene | Stop after finite breaker budget; escalate, do not crash-loop | Incident commander | Root cause documented and fresh candidate verification complete |
| Canary guardrail breach | Disable interactions if implicated; protect output | Roll back to previously approved candidate | Release owner | Rollback target identity and production health verified |

## Governance

Rollback authority is role-gated. A software CI pass may demonstrate that the mechanisms exist, but it does not prove production rollback execution, elapsed endurance, live-provider behavior, or a seven-day canary. Those remain external R5 evidence. Every rollback record should include owner, exact source SHA, timestamps, observed trigger, snapshot checksum, replay checksum, and the explicit verification that permitted service restoration.
