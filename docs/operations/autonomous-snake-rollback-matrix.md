# Autonomous Snake Rollback Matrix

Rollback preserves integrity before continuity. A rollback may resume from compatible verified evidence or begin a declared fresh run; it may never coerce incompatible state or rewrite historical records.

| Trigger | Immediate action | Authority action | Public output | Resume condition |
|---|---|---|---|---|
| Replay divergence | Disable interactions; activate safe scene | Fence writer; quarantine run and evidence | Recovery/intermission scene | Exact compatible restore passes, or fresh declared run on prior version |
| Duplicate paid-eligible effect | Disable paid/all interactions | Preserve audit; quarantine affected command/run if integrity uncertain | Autonomous play or safe scene | Root cause fixed; idempotency evidence and reversal policy verified |
| Secret/private exposure | Emergency interaction/public-text disable | Preserve minimum incident evidence; revoke credential | Privacy-safe safe scene | Credential rotation, exposure review and independent approval |
| Unauthorized control | Emergency halt or safe scene | Fence writer; revoke session/credential | Maintenance/recovery scene | Access path closed, audit reviewed, role tests pass |
| Unsafe moderation failure | Disable interactions/public text | Reject/defer paid-eligible commands | Autonomous play continues | Moderation and audit health verified |
| Persistence failure | Reject new authoritative paid commands | Stop beyond bounded durable policy; preserve verified snapshot | Autonomous play only when durable policy permits; otherwise safe scene | Sequence continuity and durable writes verified |
| Simulation crash | Safe scene | Fence writer; verified restore or fresh run | Recovery scene | Runtime heartbeat, progress, checksum and output verified |
| Crash loop | Open breaker; stop restart loop | Preserve evidence; safe halt | Maintenance/safe scene | Cooldown + successful half-open verified recovery |
| Renderer/capture black or frozen | Safe scene | Simulation continues only if authority healthy | Recovery slate | Fresh frame, correct scene/HUD/aspect and output probes pass |
| Audio failure | Mute/restart audio component | No authority mutation | Captions/visual alternatives remain | Intended audio and clipping/silence probes pass |
| Provider outage | Disable new interaction windows | Autonomous simulation continues | Provider-degraded interaction state | Credentialed connection and dedupe state verified |
| Moderation/entitlement/audit outage | Fail paid effects closed; hide names/text as required | Autonomous simulation continues | Degraded/no-interaction state | Service health and durable decision boundary verified |
| Config change failure | Stop rollout; activate prior config | Finish/quarantine incompatible run | Safe scene or current compatible run | Prior config hash restored and verified |
| Content change failure | Stop content rollout | Finish/quarantine incompatible run | Safe scene or prior content | Prior content hash, assets and validation restored |
| Deployment failure | Roll back immutable deployment artifact | Restore compatible snapshot or fresh run | Safe scene during swap | Health, replay and output verification pass |
| Record corruption | Freeze record promotion | Rebuild from authoritative events; quarantine mismatch | Gameplay may continue if authority healthy | Reconciliation exact and reviewer approves |
| Platform-policy breach | Disable affected feature/provider immediately | Preserve audit; continue autonomous play if safe | Policy-safe mode | Legal/platform review and signed approval |
| Canary guardrail breach | Stop promotion; execute frozen rollback | Use declared previous artifact/config/content identity | Canary safe scene or previous version | Incident closed; new candidate starts fresh affected clocks |

## Frozen Rollback Identity Requirements

Before candidate start, record:

- previous source SHA and immutable deployment digest;
- previous configuration/content/asset/provider-adapter hashes;
- snapshot/event compatibility decision;
- fresh-run boundary when compatibility is not guaranteed;
- credential/revocation procedure;
- responsible owner and incident communication path.

## Verification Sequence

```text
trigger
  → disable unsafe feature / safe scene
  → fence old writer where authority is affected
  → preserve primary evidence
  → deploy/restore declared previous identity
  → verify checksum/replay/invariants
  → verify renderer/audio/capture output
  → verify providers/interactions or keep them disabled
  → resume with append-only audit
```

No rollback is complete until both authority and public output verification pass.