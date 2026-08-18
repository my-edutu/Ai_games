# Game 7 — Marble Survival Tournament runbook

## Purpose

This runbook covers the autonomous Game 7 authority, browser-source presentation, bounded audience influence, operator controls, snapshot recovery, and release-evidence collection.

## Service surfaces

| Surface | Purpose | Exposure |
|---|---|---|
| `/` | Broadcast/browser-source UI | Public, same origin |
| `/api/snapshot` | Sanitized current presentation snapshot | Public, read-only |
| `/api/events` | Bounded recent event pulse | Public, read-only |
| `/api/catalogue` | Fixed viewer-influence choices | Public, read-only |
| `/api/influence` | Bounded viewer vote submission | Public, rate/cooldown/queue limited |
| `/api/health` | Liveness and degradation classification | Monitoring |
| `/api/metrics` | Prometheus-style operational gauges | Monitoring/private ingress preferred |
| `/api/operator` | Pause, resume, restart, clean feed | Bearer-authenticated operator only |

## Preflight

1. Use Node 20 or later.
2. Run the repository build and Game 7 candidate workflow.
3. Load `GAME7_OPERATOR_TOKEN` from the deployment secret manager. Never use the local fallback outside self-test.
4. Select and record a stable `GAME7_SEED` for the broadcast session.
5. Confirm `/api/snapshot` does not expose the seed, credentials, operator history, or RNG state.
6. Confirm OBS/browser source points to the expected URL. Use `?clean=1` for an arena-only feed.
7. Confirm health and metrics are scraped from a restricted monitoring path.
8. Confirm the audience influence queue and rate policy match the expected traffic tier.

## Start

```bash
GAME7_OPERATOR_TOKEN="$SECRET" \
GAME7_SEED="$SESSION_SEED" \
PORT=4317 \
node games/marble-survival/scripts/serve-complete-runtime.cjs
```

Expected signs:

- the process prints the listening address;
- `/api/health` is `healthy` or briefly `degraded` while snapshots warm;
- snapshot tick advances;
- round index and marble count match the deterministic bracket;
- clean and full feeds render without console errors;
- unauthenticated operator requests return `401`.

## Normal operations

### Pause and resume

Use pause for an operator-controlled hold, not for recovering a crashed authority. Resume only after health and snapshot checks are normal.

```bash
curl -sS -X POST "$BASE/api/operator" \
  -H "Authorization: Bearer $GAME7_OPERATOR_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"command":"pause","actor":"on-call","at":1700000000000}'
```

Change the command to `resume` when the hold ends. Use an accurate epoch-millisecond timestamp in real operations.

### Restart

Restart returns the campaign to Round 1, tick 0 for the configured seed. Record the reason and incident identifier outside the bounded in-process audit before invoking it.

### Clean feed

The operator command toggles operational clean-feed state, while `?clean=1` forces an arena-only browser layout. Prefer the URL parameter for dedicated OBS scenes because it is explicit and reproducible.

## Health interpretation

- **healthy** — authority active, a valid snapshot exists, tick lag is within tolerance, and stream connection is reported.
- **degraded** — the service remains available but tick lag or stream connectivity is outside the preferred envelope.
- **unhealthy** — authority stopped or no valid snapshot is available.

Alerts should include round, tick, lag, uptime, process identity, deployment version, and current seed identifier stored in the private operations plane. Do not add the private seed to the public snapshot.

## Incident response

### Snapshot corruption

1. Stop new operator mutations.
2. Read the snapshot ring from newest to oldest.
3. Verify each payload against its stored checksum.
4. Restore the newest valid entry.
5. Confirm `recovered: true` and expected tick continuity.
6. Run replay verification for the configured seed.
7. Preserve the corrupt payload and checksum for post-incident analysis.

The authority must not continue from an unverified payload.

### Authority stopped

1. Confirm `authority-stopped` in health reasons.
2. Capture process logs and last valid snapshot metadata.
3. Restart the process with the same release and seed.
4. Restore the latest valid snapshot when supported by the deployment adapter; otherwise restart at Round 1 and disclose the reset on stream.
5. Verify deterministic replay and public snapshot sanitization.

### Tick lag

1. Check CPU throttling, event-loop stalls, memory pressure, and host contention.
2. Disable nonessential presentation work before altering authority cadence.
3. Keep viewer influence bounded; do not increase queue size during an incident.
4. Move traffic or process placement only through the deployment runbook.
5. Clear the incident after lag remains within tolerance through a full round transition.

### Stream disconnected

1. Keep authority state isolated from the provider reconnect loop.
2. Confirm browser source remains locally healthy.
3. Reconnect the provider using credentialed production procedures.
4. Verify the stream resumes from a valid snapshot without exposing operator controls.
5. Record provider timestamps for the R5 credentialed-session evidence.

### Viewer-input abuse

1. Confirm global rate limiting, per-user cooldown, queue cap, and bounded dedupe are active.
2. Do not add arbitrary free-text or arbitrary physics parameters.
3. Reduce eligibility at the upstream identity layer when needed.
4. Preserve aggregate rejection reasons without logging sensitive viewer data.
5. Re-enable gradually and monitor queue depth.

## Recovery drill

A witnessed recovery drill must include:

- deliberate corruption of the newest snapshot;
- proof that the previous checksummed snapshot is selected;
- authority restart with the intended release and seed;
- replay-checksum comparison;
- denied unauthenticated operator request;
- accepted authenticated pause/resume cycle;
- broadcast feed continuity assessment;
- signed witness record, timestamps, logs, and remediation notes.

Unit tests exercise the mechanism but do not count as the witnessed R5 recovery proof.

## Rollback

Rollback when any P0/P1 issue affects determinism, viewer-input containment, public-state sanitization, operator authentication, snapshot recovery, or broadcast stability.

1. Pause viewer influence at the upstream edge.
2. Capture health, metrics, release report, and last valid snapshot metadata.
3. Deploy the last verified commit.
4. Restore only a checksum-valid snapshot compatible with that release.
5. Run the server self-test and a deterministic replay before restoring the public stream.
6. Open a post-incident review with owner and due date for every P0/P1 finding.

## Evidence retention

Retain CI reports for at least 30 days. External R5 evidence should include immutable timestamps, release commit, environment identifier, reviewer/witness identity, methodology, raw logs or recordings, findings, remediation references, and explicit approval. Documentation alone never substitutes for observed production evidence.
