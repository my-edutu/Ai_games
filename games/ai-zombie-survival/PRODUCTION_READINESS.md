# AI Zombie Survival — Production Readiness

Status: **candidate / not production-ready**.

The current branch includes deterministic fixed-step authority, a 2.5D browser presentation, bounded audience influence, survivor goal/intent/fallback state, world validation, semantic broadcast/audio quality policies, quarantine-oriented health classification, and a 22-skill review pass.

## Evidence available

- deterministic same-seed replay and render-frame-delta independence
- 23/23 reconstructed package regression tests passing after the 22-skill pass
- 250-zombie sustained finite-state coverage
- 10-seed / 250-zombie profile: 0 world-validation failures, 0 quarantine runs, ~1.097 ms p50, ~1.144 ms p95, ~1.380 ms worst authoritative step in the implementation container
- viewer effects bounded, idempotent by external ID, cooldown-limited, and audit history capped
- public broadcast view excludes audit/provider identifiers

## Open production gates

- real browser/OBS capture-chain screenshot and video evidence in an unrestricted environment
- mobile / compressed-stream comprehension review
- audio loudness and capture-chain measurement
- snapshot/restore implementation plus corruption/recovery drills
- 24-hour engineering soak and 72-hour production-candidate soak
- seven-day canary
- rollout/rollback and emergency runbook drill
- independent R5 production-readiness review

Do not market or label this build as production-ready until those gates pass. Rescue/evacuation is not implemented in this vertical slice and must not be implied by UI or promotional material.
