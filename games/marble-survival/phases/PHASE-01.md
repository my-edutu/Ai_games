# Phase 1 — Deterministic Foundation

**Status:** Verified locally on Node 22.16.0 / TypeScript 5.8.3  
**Gate:** Fixed-step roster, arena, physics, lifecycle, replay, snapshot, headless continuity

## Implemented

- strict configuration and launch bracket validation;
- deterministic unique personality roster with four archetypes;
- five constructive arena archetypes, typed validation, bounded fallback, and extracted features;
- custom integer fixed-step circle physics with world, block, sweeper, bumper, and ID-sorted marble contacts;
- bounded speed, substeps, iterations, contacts, numeric range, and integrity quarantine;
- runnable autonomous qualification/tournament lifecycle with round result, champion, intermission, and restart;
- versioned snapshot/checksum/RNG/event-sequence restore and corruption rejection;
- headless twin-runtime runner.

## Evidence

- 12/12 focused tests pass;
- twin checksums and events match for 600 ticks;
- uninterrupted and restored execution match after 600 total ticks;
- 8- and 32-marble accelerated tournaments automatically completed and restarted;
- forbidden ambient nondeterminism scan is clean;
- placeholder scan is clean.

## Review and Corrections

Specification review confirmed one authority, fixed logical time, named randomness, stable ordering, valid generation, typed technical failure, and automatic continuation. Engineering review found and corrected champion-streak state ordering before phase close. No critical or important Phase 1 findings remain.
