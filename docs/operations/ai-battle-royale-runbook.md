# AI Battle Royale Operations Runbook

## Purpose and authority boundary

This runbook defines the production-safe response for Game 6. Simulation truth remains authoritative; browser broadcast, audio, persistence, and audience providers are supervised independently. A presentation outage, provider outage, or recovery event must never be converted into a game loss, winner, or invented result. Unsafe public output moves to an intentional safe scene while authoritative state is fenced and recovered.

## Health and recovery sequence

The operator watches logical tick progress, render change, expected audio activity, persistence freshness, provider availability, queue utilization, and resource pressure. Provider or moderation loss disables interactions only. Audio loss degrades to captions/mute. Render, persistence, or simulation no-progress is unsafe.

1. Switch public output to the safe scene before restart work; never broadcast a frozen or black gameplay frame as if it were healthy.
2. Fence new authoritative mutation when simulation or persistence integrity is uncertain. Disable audience interaction when authentication, moderation, entitlement, region, or audit certainty is unavailable.
3. Restart the smallest failed component. Repeated restart loops are prohibited.
4. Perform a verified restore from a version-compatible, checksum-valid Battle Royale snapshot envelope. Corrupt or incompatible material is quarantined.
5. Reconcile the bounded replay journal and verify the restored checksum and invariants before accepting new authoritative work.
6. Verify presentation health independently, then resume the battle scene only after both authority and output are healthy.
7. Stop after the finite breaker budget and escalate; do not crash-loop.

## Mandatory drill catalogue

The implementation contract and production drill programme use the same identifiers: `database-outage`, `storage-outage`, `restored-object-seam`, `canary-corruption`, `secret-missing`, `provider-unavailable`, `queue-backpressure`, `backup-corruption`, `restore-corruption`, `runtime-failure`, `presentation-failure`, `audio-failure`, `cache-staleness`, `region-loss`, `dependency-timeout`, `high-latency`, `packet-loss`, `disk-pressure`, `memory-pressure`, `cpu-pressure`, `process-restart-storm`, `network-partition`, `write-fencing`, `replay-reconciliation`, `scene-fallback`, and `canary-rollback`.

CI may verify the drill mechanisms and runbook mappings, but that is implementation evidence only. Production drill credit requires the exact release candidate, production-reference conditions, timestamps, output evidence, and an independent witness where the release policy requires one. Synthetic or compressed execution cannot satisfy production drill truth.

## Rollback and ownership

The on-call owner records candidate SHA, manifest checksum, snapshot/envelope checksum, replay manifest checksum, trigger, recovery attempts, and final output state. Security owns credential/moderation incidents; release engineering owns candidate identity and rollback evidence; gameplay engineering owns deterministic integrity; broadcast owns safe output. A rollback preserves the last verified snapshot and replay evidence. Deterministic divergence, duplicate authoritative application, privacy exposure, unresolved P0/P1, failed verified restore, or a canary guardrail breach blocks promotion and triggers rollback/safe halt according to the rollback matrix.

No operator may mark R5 from CI, fixture providers, simulated endurance, compressed canaries, internal-only review, or self-attestation. R5 requires the external exact-candidate evidence listed in the release intake document.
