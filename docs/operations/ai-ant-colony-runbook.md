# AI Ant Colony / Ecosystem Operations Runbook

## Purpose and authority

This runbook governs Game 12 production-equivalent drills, incident response, recovery, rollback, and evidence collection. The simulation service is the only gameplay authority. Browser rendering, audio, capture, provider adapters, moderation, entitlements, dashboards, and operator controls must never invent colony state or bypass durable command reservation.

Every drill is executed against one exact release-manifest checksum. Production credit requires a production-equivalent or production environment, an external-signed evidence digest, an identified owner, an independent witness, verified automated actions, verified public output, and a clean rollback path. CI and synthetic execution prove implementation only; they do not satisfy R5.

## Incident priorities

1. Protect authoritative state and prevent split-brain writers.
2. Protect viewers from black, frozen, misleading, unsafe, or private output by switching to the intentional safe scene.
3. Disable unsafe interactions before interrupting autonomous simulation whenever possible.
4. Restore the newest compatible snapshot, replay post-snapshot commands exactly, and compare the authoritative checksum before resuming public output.
5. Quarantine instead of guessing whenever evidence diverges, is corrupt, is incompatible, or has sequence gaps.

## Standard verified restore

1. Disable new audience interactions and public text.
2. Switch capture to the safe scene: “Live colony output temporarily protected.”
3. Fence the current writer lease and record the generation.
4. Restart only the failed component unless simulation authority is stale.
5. Select the newest candidate-compatible snapshot. Reject corrupt or incompatible evidence and fall back to the next valid snapshot.
6. Replay every durable command after the snapshot in contiguous sequence order.
7. Verify state checksum, run ID, command sequence, semantic event sequence, queued influence, applied influence IDs, queen health, population bounds, and colony lifecycle.
8. Verify a moving, non-black, correct public scene and truthful captions.
9. Resume interaction only after moderation, entitlement, audit, persistence, and provider health are all confirmed.
10. Record owner, independent witness, timestamps, evidence digest, before/after checksums, and recovery outcome.

## Mandatory drill catalogue

### Provider and interaction isolation

- `provider-outage`: Disconnect YouTube/Twitch input. Confirm interactions disable, autonomous colony ticks continue, no provider payload enters authority, and reconnection does not replay an effect twice.
- `moderation-outage`: Fail moderation. Paid-eligible or display-bearing input must fail closed; autonomous play and privacy-safe fixed interaction modes remain protected.
- `entitlement-outage`: Remove entitlement certainty. Reject weighted or paid-eligible influence before durable reservation; no rate or queue capacity is consumed.
- `audit-outage`: Make durable audit unavailable. Reject operator and paid-eligible mutation before control-plane or gameplay state changes.
- `disable-interactions`: Exercise the independent interaction kill switch. Verify the colony continues autonomously and scheduled commands are handled according to disclosed policy.
- `disable-public-text`: Remove public names, messages, and dynamic text without hiding colony progress, captions, objectives, or system status.

### Component failure and public-output protection

- `simulation-failure`: Stop simulation heartbeats. Trigger safe scene, fence writer, start verified recovery, and prohibit a fabricated game result.
- `renderer-failure`: Stop frame progress. Detect frozen output, preserve authority, restart renderer, and verify movement before returning live.
- `audio-failure`: Stop unintended audio. Mute the failed bus, retain captions, preserve simulation, and restore only after bounded audio verification.
- `gateway-failure`: Stop gateway health. Disable interaction, keep autonomous ticks running, and reject new influence before durable reservation.
- `persistence-failure`: Deny event/snapshot writes. Reject authoritative commands before mutation, protect public output, and page operations.
- `black-output`: Force near-zero luma with stale frames. Switch immediately to the safe scene and begin verified restore.
- `frozen-output`: Hold the last valid frame while authority progresses. Detect frame-age divergence and restore the renderer without rewriting state.
- `wrong-scene`: Present an error or stale run scene while active authority continues. Protect output and verify run token/scene before resuming.
- `silent-output`: Produce unintended silence beyond the threshold. Mute the affected channel, retain captions, and avoid classifying intentional silence as failure.

### Recovery integrity

- `verified-restore`: Execute the complete verified restore procedure and prove restored authority equals uninterrupted execution by checksum.
- `older-snapshot-fallback`: Corrupt the newest snapshot. Reject it, restore the next compatible snapshot, replay later commands, and verify exact final authority.
- `divergence-quarantine`: Inject an expected-checksum mismatch or command sequence gap. Quarantine the run, retain evidence, and do not resume or create a record.

### Credentials, configuration, content, and deployment

- `credential-rotation`: Rotate provider and signing credentials without exposing secrets, losing dedupe state, or replaying callbacks.
- `credential-revocation`: Revoke credentials and prove all affected input fails closed while autonomous play continues.
- `config-rollback`: Restore the previous candidate-bound configuration hash at a fresh-run boundary; never mutate an active deterministic run in place.
- `content-rollback`: Restore the previous content hash, preserve manifest traceability, and start a fresh run if content can affect authority.
- `deployment-rollback`: Redeploy the manifest’s rollback artifact, verify health endpoints and checksum compatibility, then resume only through the canary policy.

### Safe lifecycle and escalation

- `safe-intermission`: Move viewers to a truthful intermission or safe scene during maintenance without fabricating extinction, ascension, prizes, or records.
- `emergency-halt`: Use admin-only emergency halt. Disable simulation and interaction, force safe scene, append durable audit, and require explicit incident command to restart.
- `alert-escalation`: Exercise sustained alert thresholds, page routing, acknowledgement, ownership transfer, and recovery clearing. Alerts must reference this runbook and the exact candidate.

## Rollback policy

Rollback is mandatory for replay divergence, duplicate effect application, private exposure, unauthorized control, record corruption, repeated restore failure, sustained unsafe output, or any open P0/P1. Rollback must use the release manifest’s immutable source SHA, deployment artifact, config hash, and content hash. Authoritative material changes reset endurance and canary clocks. A rollback starts at a fresh-run boundary unless a verified compatible snapshot is explicitly permitted.

## Evidence packet

Every production-credit packet must contain: candidate source SHA; manifest checksum; environment and hardware reference; drill ID; owner; independent witness; start/end timestamps; external-signed digest; logs; before/after screenshots or capture samples; authority checksums; lease generations; snapshot ID; command range; output verification; automated action verification; incident findings; and rollback disposition. Missing witness, synthetic source, CI-only environment, wrong candidate, invalid digest, stale evidence, duplicated drill record, or failed output verification blocks production credit.

## Escalation and ownership

The on-call owner controls incident response. Security owns privacy, moderation, credential, and unauthorized-control incidents. The release owner owns manifest, rollback, and promotion decisions. Product owns viewer disclosure and terminal-outcome fairness. No single operator may self-witness a production drill; an independent witness must sign the evidence.
