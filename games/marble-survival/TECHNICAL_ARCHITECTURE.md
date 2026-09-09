# Marble Survival Tournament — Technical Architecture

## Authority

`MarbleRuntime` is the sole owner of authoritative gameplay state. The browser/OBS server advances that runtime using fixed logical ticks; wall-clock time determines only how many fixed ticks are due. Render frame rate, replay, audio, camera, HTTP polling and quality presets cannot mutate tournament state.

The current deterministic version is `marble-physics-v2`.

## Authoritative Tick Order

For an active race tick the runtime performs, in stable order:

1. apply due validated influence commands;
2. advance round-intro timing when applicable;
3. build bounded marble actions in stable marble-ID order;
4. apply forces and the current authoritative wind field;
5. run fixed-point physics with bounded substeps/iterations;
6. derive moving-collider transforms from logical tick and include collider velocity in contact response;
7. resolve world/static/sweeper/bumper/marble contacts;
8. calculate checkpoint, finish, hazard and recovery events;
9. adjudicate same-tick finish cohorts using crossing fractions;
10. adjudicate simultaneous elimination/qualification boundaries;
11. resolve quota, last-standing, timeout or integrity quarantine;
12. emit ordered semantic events;
13. advance logical tick counters.

No renderer/provider/database/model call exists inside this hot authority path.

## Physics Representation

- 1 metre = 1,000 integer world units;
- positions and authoritative velocities are integer/fixed-point values;
- default authority rate is 60 Hz;
- marble radius, max speed, acceleration, restitution, friction, substeps, contact cap and iteration count are explicit configuration;
- static obstacles are axis-aligned rectangles and bumpers are circles;
- moving sweepers are deterministic translating rectangles whose current transform and velocity are derived by `src/physics/moving-collider.ts`;
- public snapshots reuse that exact moving-collider transform so visible sweepers do not rotate or move independently of collision truth;
- high-speed movement uses bounded substeps and regression fixtures for thin geometry;
- non-finite/range corruption quarantines the run rather than becoming a sporting result.

The renderer derives marble orientation from authoritative displacement for presentation only. Angular presentation state is excluded from authority.

## Tournament Adjudication

The standard bracket is 32→16→8→4→2→1.

Finishers detected within one logical tick form a crossing cohort. Ranking uses the rational crossing fraction calculated from previous/current positions. Stable marble ID is used only when the quantized crossing fractions are exactly tied.

Hazard eliminations are collected before final quota resolution. If a simultaneous cohort would leave too few competitors to satisfy a non-final round quota, the declared boundary review uses authoritative progress and stable-ID tie policy. A round with no valid competitor or a final without a legitimate champion enters integrity quarantine; the system never fabricates a winner.

## Audience Influence

`src/influence/catalogue.ts` retains the six legacy families. Only `wind-vote` is operational in v2.

Accepted wind requests:

- use bounded request and viewer tokens at the HTTP boundary;
- enforce host dedupe and per-viewer cooldown;
- enter `MarbleRuntime.scheduleInfluence` rather than changing physics directly;
- are ordered by logical apply tick then request ID;
- apply one bounded global field for 180 ticks;
- mark the tournament record category `Assisted`;
- are retained in bounded idempotency history;
- are validated as part of snapshot restore.

`gate-tempo`, `shield-orb`, `cheer-pulse`, `theme-vote` and `next-arena` remain explicit but `operational:false` until their real v2 mechanics exist.

## Presentation Boundary

`createMarblePublicSnapshot` constructs an allowlisted public shape containing only rendering/spectator data: round state, public arena geometry, marble identities/transforms/status, leaderboard/cutoff, champion, record category and bounded active influence.

It excludes seeds, RNG state, full configuration, operator credentials, provider payloads, viewer IDs, request IDs and private audit information.

The live host adds:

- event-driven camera directive;
- bounded replay metadata;
- presentation-only replay snapshots/events.

The replay buffer returns deep copies. Caller mutation cannot affect the buffer or authority. The browser may show a labelled replay after confirmed results while the live authority continues independently.

## Host Scheduling and Recovery

`serve-complete-runtime.cjs` targets a 60 Hz authority and uses a bounded catch-up budget. Scheduler debt may degrade presentation/health but never enlarges the authoritative delta.

Operator pause/resume/restart/clean-feed commands require the configured bearer token. Restart creates a fresh deterministic tournament, resets presentation camera/replay state, and retains no cross-run authority mutation.

Authoritative snapshots bind config, root seed, state, RNG snapshot, event sequence and checksums. Restore validates schema/version/checksum, state invariants, event ordering, influence queue/history bounds and exact pending-command shapes before resuming.

## Resource Bounds

Current software bounds include:

- authoritative semantic event history: configured cap (default 2,048);
- live public event projection: 128;
- replay buffer: configurable and capped by host (default 180, max 3,600 storage; public endpoint returns at most 120);
- authority influence queue: 64;
- authority influence idempotency history: 4,096;
- host influence dedupe map: 512;
- host per-viewer cooldown map: 512;
- Canvas/audio/browser effects use bounded presentation policies and remain outside authority.

## Version / Rollback Boundary

`marble-physics-v1` snapshots do not silently restore into v2. A deployment crossing deterministic versions must begin at a fresh tournament boundary unless an explicit migration is implemented and proven. Rollback to v1 therefore also requires a fresh-run boundary rather than loading v2 authoritative snapshots.
