# Marble Survival Tournament — Technical Architecture

`MarbleRuntime` is the sole authority. Per tick: lifecycle → due influence → moving arena transforms → observations/actions → forces/integration → stable obstacle and ID-sorted marble contacts → triggers/results → progression → invariants/events. Physics uses 1,000 fixed units per metre, integer velocity per tick, bounded substeps/iterations, and explicit collision restitution.

Named streams isolate roster, topology, hazards, AI variation, bracket, audience ties, director, and cosmetics. Snapshots bind schema/determinism/config, state, RNG streams, event sequence, and checksums. Presentation, audio, HTTP, analytics, persistence adapters, and providers cannot mutate game state directly.
