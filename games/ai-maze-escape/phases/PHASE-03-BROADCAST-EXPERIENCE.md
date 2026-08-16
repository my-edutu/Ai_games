# Phase 3 — Broadcast Map, HUD, Audio, and Replay

**Target:** R2 streamed vertical slice  
**Software status:** Complete and repository-CI verified  
**Verified implementation head:** `b10d8797d206dcac58c37f41a238e454ae9e3ffb`  
**Verification workflow:** GitHub Actions `31975352336`

## Outcome

AI Maze Escape now has a dependency-free broadcast source that clearly presents discovered versus hidden space, explorer position, route history, known objectives, keys, doors, traps, visible threats, AI intent, progress, result, intermission and recovery states without exposing hidden authority.

## Implemented

- immutable privacy-safe render snapshots;
- strict rejection of stale and divergent revisions;
- bounded entity and replay collections;
- desktop, phone-landscape and clean-feed layouts;
- north-up camera with reduced-motion behavior;
- semantic walls, discovered cells, route trails, explorer, exit, key, door, trap and threat visuals;
- HUD hierarchy for objective, discovery, steps, time, keys and AI intent;
- bounded audio cue priority and captions that remain available when muted;
- high-contrast, reduced-motion, muted and clean-feed modes;
- result, intermission, danger and recovery scenes;
- output-health classification for stale, black, frozen and unintended silent output;
- reconstruction from the latest accepted public snapshot;
- autonomous stream server and deterministic self-test.

## Verification

The exact candidate passed:

- strict TypeScript compilation;
- 6/6 focused presentation tests;
- Maze stream self-test with stable authority, privacy-safe snapshots, bounded source, output recovery and observed restart;
- 3/3 Maze Chromium tests for desktop, phone landscape and accessibility/clean-feed modes;
- the complete repository regression workflow and authoritative nondeterminism scan.

Reference self-test:

```json
{"ok":true,"authorityStable":true,"browserAssets":true,"boundedSource":true,"snapshotPrivacySafe":true,"recoveryVerified":true,"restartObserved":true,"finalTick":189,"finalRunToken":"97bf8226","authorityChecksum":"6543898c"}
```

Retained browser artifact:

- artifact ID: `9270916299`;
- SHA-256: `525cebe808ae30164617849ee7db39dfa2053f17712cf08e2a08317255f423b1`.

## Acceptance

- [x] Objective, frontier, danger, AI intent and lifecycle remain visible in the ten-second hierarchy.
- [x] Hidden truth never enters the public snapshot or browser state.
- [x] Mobile, high-contrast, reduced-motion, muted and clean-feed captures preserve meaning.
- [x] Presentation collections and audio voices/captions are bounded.
- [x] Presentation schedules and failures cannot alter authoritative state.
- [x] Black, frozen, stale and silent failure semantics activate intentional recovery output.
- [x] Result, intermission and automatic restart are truthfully presented.

## Exit

Phase 3 is complete. Phase 4 owns bounded audience effects, deterministic voting, Chat vs AI pressure, moderation/provider outage behavior and exactly-once application.
