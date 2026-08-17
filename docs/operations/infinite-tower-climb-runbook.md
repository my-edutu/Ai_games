# Infinite Tower Climb Operations Runbook

## Purpose

Operate the frozen Infinite Tower Climb candidate without turning technical faults into game outcomes. The simulation remains authoritative; public output moves to a safe scene whenever truth cannot be shown reliably.

## Before a live run

1. Verify the candidate source SHA, release checksum, configuration hash, content hash and deployment artifact.
2. Confirm one active writer lease and an empty quarantine queue.
3. Restore the latest compatible snapshot in a staging process and compare the authoritative checksum.
4. Confirm browser-source health, audio routing, captions, clean feed and operator access.
5. Keep interactions disabled until YouTube, Twitch, moderation, entitlement and audit health are independently green.

## Incident response

### Provider outage

Disable new audience input, preserve queued validated commands, show “Chat reconnecting — AI continues,” and keep autonomous simulation running. Re-enable only after authentication, deduplication and reconnect checks pass.

### Moderation or entitlement outage

Fail paid-eligible or weighted interactions closed. Fixed anonymous free votes may continue only when the configured moderation policy permits them and no public identity is shown.

### Persistence outage

Reject the next authoritative command before mutation. Do not continue from memory-only state. Activate the safe scene, preserve the writer lease long enough to diagnose, then restore from verified durable evidence.

### Simulation stall

When the simulation heartbeat exceeds the unsafe threshold, disable interactions, activate the safe scene, fence the writer, restore a compatible snapshot, replay contiguous commands, compare the checksum and verify output before resume.

### Renderer failure

Keep authoritative simulation isolated, activate the safe scene, restart only the presentation component, rebuild from the latest immutable render snapshot and verify non-black, non-frozen output before returning to gameplay.

### Capture or black-output failure

Restart capture/browser source, retain the safe scene, and require healthy frame age plus capture probes before resume. A capture failure never becomes a fall, defeat or record event.

### Unintended audio silence

Keep captions visible, reduce public status to degraded and restart the audio component. Intended silence is not an incident.

### Corrupt snapshot

Reject the corrupt newest snapshot, record the reason, try the next newest compatible snapshot and replay all contiguous post-snapshot commands. Quarantine when no valid compatible evidence remains.

### Replay divergence

Stop the run, fence the writer and quarantine the evidence set. Never silently continue, rewrite the record or manufacture a fresh loss. Escalate to the release owner and security owner.

### Lease conflict

Reject the competing writer. Verify lease generation and owner, then fence the stale token before any new writer acquires authority.

### Queue or memory pressure

Reduce cosmetic quality and optional acknowledgement volume first. Preserve authoritative tick order, records, commands and critical captions. Enter a safe scene if hard limits are exceeded.

### Crash loop

After three failed recovery attempts, open the crash-loop breaker, stop automated restarts and hold an intentional safe-halt scene. Operator review is required before a fresh run.

### Emergency halt

An administrator disables simulation and interactions, activates the safe scene, fences the writer and records the exact reason. Restart only at a declared fresh run boundary.

## Verified recovery sequence

1. Disable interactions.
2. Activate safe output.
3. Fence the previous writer token.
4. Select the newest compatible checksummed snapshot.
5. Restore state, RNG, lifecycle and event sequence.
6. Replay contiguous commands exactly once.
7. Compare the expected authoritative checksum.
8. Acquire a newer lease generation.
9. Rebuild presentation from the current render snapshot.
10. Verify frame, capture, audio/captions and operator probes.
11. Resume autonomous simulation, then interactions.

## Escalation

P0: integrity, privacy, unauthorized control, bought terminal outcome, record corruption or replay divergence. Halt immediately.

P1: repeated output failure, persistence unavailability, crash loop, provider-policy violation or recovery failure. Safe scene and release-owner escalation.

P2: bounded degradation without lost truth. Track with an owner and expiry.
