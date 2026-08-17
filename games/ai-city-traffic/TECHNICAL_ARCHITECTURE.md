# Technical Architecture

The game is a TypeScript module in the monorepo. `TrafficRuntime` owns authoritative state, named RNG streams, event sequence, and lifecycle. City generation constructs a connected bidirectional lane graph. Vehicle movement follows propose, stable conflict resolution, and commit. Signal and routing decisions are integer/logical-tick based.

Presentation consumes immutable privacy-safe snapshots. The Node stream host serves static assets and JSON state, writes the latest verified snapshot through an atomic owner-only file store, assesses operational health, restores only after checksum/version/RNG/event/invariant validation, quarantines incompatible files, and opens a bounded recovery crash-loop breaker before any repeated failure can churn indefinitely. Release validation is non-authoritative and binds evidence to a full candidate Git SHA.
