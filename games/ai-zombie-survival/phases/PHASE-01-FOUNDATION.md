# Phase 1 — Deterministic Zombie Foundation

**Target:** R1 headless prototype  
**Software status:** Candidate pending full repository CI

## Delivered candidate

- versioned bounded configuration and fixed 10 Hz logical time;
- constructive grid refuge, gates, resources, obstacle validation and deterministic fallback;
- stable survivor/world state, lifecycle, semantic event sequence and automatic restart;
- named seeded streams, canonical state checksums and cosmetic-stream isolation;
- snapshot envelope, checksum/invariant/version validation and exact restore;
- focused native Node tests covering 32 generated seed fixtures and replay/corruption paths.

## Exit gate

Phase 1 advances only after strict full-repository build, all existing/new Node tests, nondeterminism review, exact acceptance review and retained evidence pass with zero P0/P1 finding.
