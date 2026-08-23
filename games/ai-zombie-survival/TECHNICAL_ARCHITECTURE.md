# Technical Architecture

`ZombieRuntime` alone owns authoritative state. The hot path is fixed-step command/influence ordering, phase rules, survivor decisions, movement, horde flow, combat/economy, progression, invariants and checksums. Warm paths create snapshots, immutable render projections and bounded event queues. Cold paths handle persistence, analytics, provider normalization, release evidence and reports.

State, config, generator, deterministic and snapshot versions are explicit. Named RNG streams isolate world, resources, weather, horde, survivor ties, loot and audience ties. Browser, audio, provider, operator and storage code consume contracts and never mutate authority. Every live collection has a cap or lifecycle.
