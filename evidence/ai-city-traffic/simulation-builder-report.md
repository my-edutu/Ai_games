# City traffic simulation builder report

## Status

The latest candidate adds persistent age-aware pedestrian corner/landing arbitration for independent finding Q1. The affected foundation suite passed **17/17 tests in 63.118 seconds**, with zero failures, skips or cancellations. The original C1/C2/C3 separation and checkpoint probes still pass, and 15-minute allocation audits observed no older eligible request being bypassed in either exercised scenario. The original three findings were independently closed before this change; independent acceptance of the new Q1 candidate remains owned by the lead and is not claimed here.

Current source fingerprints, before/after measurements, test evidence and remaining fairness limits are recorded in **Q1 fairness repair** below. Earlier thirteen-test results remain historical evidence for the prior candidate.

## Owned files

- `ai-games-city-traffic/games/ai-city-traffic/src/simulation.ts`
- `ai-games-city-traffic/games/ai-city-traffic/src/traffic-network.ts`
- `ai-games-city-traffic/tests/foundation/city-traffic-simulation.test.cjs`

No package, lock, global config, renderer, interface, or server source was changed by this builder. The lead explicitly authorized the successful cached `npm ci --offline --ignore-scripts --no-audit --no-fund` setup. No commit was created by this builder.

## Requirements and guides read

Read root `AGENTS.md`, the active city traffic specification, plan and ledger, and the pinned repository skills for deterministic simulation, game physics, autonomous agent design, and simulation QA. The first focused test was observed failing before the city behavior was implemented.

## Public interface

`createTrafficSimulation({seed?, demand?, policy?})` returns `TrafficSimulation` with `step(ticks = 1)`, `snapshot()`, `command(unknown)`, `serialize()`, and instance/static `restore(serialized)`. `STEP_SECONDS = 1/30`, `ROAD_COORDS = [-72,-24,24,72]`, frozen `ROAD_NETWORK`, `VEHICLE_SPECS`, `TRAFFIC_LIMITS`, `TRAFFIC_VERSION`, and typed snapshot/command interfaces are exported.

All requested snapshot fields remain. Additional fields expose geometry, route origin/destination, current lane/progress, upcoming junction and turn, stopped time, reservation owners, pedestrian crossing/waiting state, actual detour counts, pending/rejected demand and completed pedestrian journeys.

- `speed` and `metrics.meanSpeed`: metres per simulated second. Multiply by 3.6 for km/h.
- `metrics.flow`: completed trips per minute in the trailing 60 simulated seconds. During startup the denominator is the elapsed window, with a one-second floor.
- `metrics.meanWait`: accumulated stopped seconds averaged over currently active vehicles. It excludes the outside entry queue.
- `metrics.queued`: currently stopped vehicles plus pending outside entry requests. Separate `waiting` and `pending` counts are available.
- `metrics.completed`: vehicles physically reaching the final exit portal. No congestion-clearing path increments it.
- `metrics.generated = active + pending + completed + rejected` is an invariant, including the 32 initial vehicles.
- `metrics.meanTripTime`: time since a trip became visible/active, excluding its outside queue wait. Initial pre-positioned entry vehicles start their measurement at tick zero.
- `laneProgress`: distance along a road; inside a junction, incoming-road length plus junction travel. `junctionId` and `status === 'turning'` distinguish junction movement.

## Authority, coordinates and geometry

One strict TypeScript implementation is used for Node CommonJS and browser ESM. The authority imports no DOM, browser, renderer, Three.js, provider SDK, current time, or ambient random source. `step` advances exact logical 30 Hz ticks; pause, speed and catch-up remain scheduling concerns of the interface.

World units are metres. Yaw zero faces +Z and yaw PI/2 faces +X. Road centers form a connected 4×4 junction graph with 16 outside entry/exit portals at ±108. Lane center offsets are 3.3 metres, with right-hand traffic: +Z travel at x = road + 3.3; +X travel at z = road - 3.3.

Lane paths meet junction paths 12 metres from each center. Right/left turns use sampled cubic curves with tangent continuity and the appropriate inside/outside radius. Each curve has 24 samples. Stop-line control keeps a non-admitted vehicle's nose at least 13.6 metres from the center. Position and speed updates are quantized to 0.000001 metre / metre-per-second resolution. Continuous path progress is capped at the exact available clearance, preventing a fast tick from jumping past a stopped leader or unreserved boundary.

The roadworks command limits the eastbound central Market link `j5>j6` to 3 m/s: x from -12 to +12, z = -27.3. Drivers slow before entering that link. New route plans incorporate its delay. Existing trips keep their destinations.

## Agents and signal behavior

Drivers have seeded portal-to-portal routes, finite travel speeds, acceleration/braking limits, varied physical classes and purposeful exits. Initial population is 32 safely spaced vehicles on entry lanes. Subsequent demand produces actual pending trips and safe, clearance-checked entry spawns.

| Kind | Length (m) | Width (m) | Nominal desired speed (m/s) | Turn cap (m/s) |
|---|---:|---:|---:|---:|
| Car | 4.1 | 1.8 | 12.5 | 6.8 |
| Taxi | 4.3 | 1.85 | 13.5 | 7.0 |
| Bus | 8.0 | 2.3 | 9.0 | 4.8 |
| Van | 5.0 | 2.05 | 10.5 | 5.8 |
| Emergency | 4.8 | 2.05 | 15.5 | 7.5 |

Desired speed has a bounded seeded variation. Emergency vehicles receive a five-second equivalent waiting-priority bonus, while older queues retain priority through accumulated waiting. Emergency status never bypasses walk phases, physical clearance or a red admission gate.

Every junction has one exclusive vehicle reservation. Admission requires the matching green axis, head-of-lane position, no current owner, and enough receiving-road space for the entire arriving body and gap. Incoming and outgoing ghost occupancy protects tails and noses during path transitions. The reservation remains until the vehicle's rear has cleared the outgoing boundary.

The signal cycle is NS green → clearance → EW green → clearance → walk → clearance. Fixed greens last 12 seconds. Adaptive greens use observed queues, bounded from 7 to 17 seconds, and can end an empty green after its minimum. Walk lasts 15 seconds. Clearance lasts at least 1.5 seconds and waits for the actual reserved vehicle or crossing citizens to clear. Green changes cannot strand a conflicting crossing agent in an active junction.

The 48 citizens navigate a connected 64-corner sidewalk graph, walk at seeded speeds of 1.25–1.65 m/s, reach destinations, and receive new destinations. Sidewalk/crosswalk center offsets are 8.8 metres, with constant 0.45-metre directional walking offsets joined by continuous corner connectors. A corner has one explicit owner. A citizen stages 1.4 metres from the corner, fully outside the road, releases its near-side corner and reserves a clear far-side landing before crossing. The signal must have enough walk time remaining. Off-road landing queues release their corner while waiting for an outgoing sidewalk, so they cannot hold a road crossing indefinitely. The next vehicle phase waits for actual road occupants to clear. A deterministic 0.84-metre personal-space guard prevents citizen body overlap. Gait phase advances from actual distance; waiting citizens stop walking.

## Gridlock finding and repair

The initial safety suite passed but a targeted longer high-demand campaign exposed a genuine failure. With seed 1 and demand 2, completions froze at 131 by minute nine and remained 131 through minute 20. A captured checkpoint showed all 122 vehicles stopped, no junction reservations held, and signals/citizens still progressing. The cause was cyclic downstream backpressure, not a rendering or signal timer defect. Seed 42 also exhibited very long individual stalls while aggregate throughput continued.

The regression reproduced the seed-1 failure specifically in minute nine. The repair meters new entries at 84 active vehicles, leaving unadmitted demand visible in the bounded outside queue, and gives a blocked head-of-lane driver bounded detours. A replan preserves the traveled prefix, current position, incoming lane and original exit. It considers only clear receiving roads, forbids immediate U-turns, and replaces future path geometry before the vehicle enters the junction. No vehicle is deleted, teleported or counted completed to relieve congestion.

Replanning is triggered only after 45 seconds without meaningful progress and a blocked receiving lane. It has a global budget of one search per simulated second, a 15-second retry cooldown per driver, at most 16 successful detours per trip, and at most 96 route nodes. Searches expand at most 16 road junctions. Citizens use at most 64-node sidewalk searches. Detours have their own seeded random stream and visible event/count reporting. The focused repaired seed-1 regression passed through 12 simulated minutes; the final suite extends the same regression to all three previously exercised seeds.

## Tick order, randomness, replay and limits

Tick order is signal transitions; occupancy observation; demand/entry dispatch; budgeted replanning; ordered junction admission; driver motion/completions; reservation release; citizen motion; queue observations; completion-history retirement; periodic invariants and bounded semantic notices. Vehicles and conflicting candidates use explicit stable ordering.

Named xorshift32 streams are `demand`, `routes`, `reroutes`, `drivers`, `citizens`, and `palette`. They derive from version, root seed and stream name. Palette draws cannot perturb traffic or citizen decisions; this has a dedicated checkpoint test.

Snapshots are newly allocated and recursively frozen. Checkpoints include schema/deterministic versions, a configuration hash, initial and current controls, seed, all random-stream states, logical tick, IDs, all agent routes and motion, signals/reservations, cumulative metrics, retained completion history, normalized command sequence, retired-command digest and bounded events. JSON uses canonical key ordering and an FNV-1a 32-bit checksum for accidental corruption detection; this is not cryptographic authentication.

Restore checks compatibility, checksum, bounded fields and numeric ranges, connected legal routes, unique IDs, reservation ownership and its authorized incoming signal axis, stop-line legality, protected crossings/landings, pedestrian corner ownership, all physical body-pair separation, trip conservation and command continuation before replacing live authority. Completed-trip records include unique IDs and birth/exit ticks; their counts and time sums must agree with the lifetime counters, and the initial window must account for all completed trips. A rejected restore leaves the prior instance untouched. A runtime invariant failure stops subsequent steps until an explicit valid restore or reset.

| Resource | Bound |
|---|---:|
| Hard vehicle budget | 144 |
| Normal entry admission target | 84 |
| Pending entry requests | 96 |
| Citizens | 48 |
| Pedestrian corner/landing reservations | 64, at most one per citizen |
| Semantic events | 40 |
| Retained normalized commands | 256 |
| Recent completed-trip records | 1,024, additionally aged out after 60 seconds |
| Route nodes | 96 |
| Successful detours per trip | 16 |
| Commands accepted at one logical tick | 16 |
| Ticks in one `step` call | 108,000 |

Old command records retire into a digest; restoring a checkpoint plus subsequent retained commands is supported. An indefinitely long run cannot be reconstructed from the final 256 commands alone. Reset begins a fresh logical run at tick zero and is itself recorded. Overflow arrival requests are counted separately from active/pending/completed trips.

## TDD and verification evidence

Runtime: Node 24.22.1. Compiler: TypeScript 5.8.3 from the pinned package lock.

Strict focused compile:

```sh
node node_modules/typescript/bin/tsc games/ai-city-traffic/src/simulation.ts --target ES2022 --module CommonJS --strict --rootDir . --outDir dist
```

Foundation suite:

```sh
node --test --test-isolation=none --test-reporter=tap tests/foundation/city-traffic-simulation.test.cjs
```

This environment's child-isolated Node reporter originally returned only a generic file failure; no-isolation was used to obtain the actual assertions. Tests still import the compiled production authority from `dist`, with no alternate simulation.

Observed red evidence:

1. First connected-city test: expected 16 signals, stub produced zero. After implementation, the five-minute connected-trip/replenishment/citizen test passed.
2. A correctly checksummed checkpoint containing overlapping vehicles was initially accepted, producing `Missing expected exception`. Physical restore validation was implemented; the focused test then passed.
3. High-demand seed 1 failed `must continue completing real trips in high-demand minute 9`. The bounded recovery repair then passed the focused 12-minute scenario.

A first combined suite passed 5 of 6 scenarios. Its one failure exposed ambiguous `laneProgress` during junction traversal: a car at x = 18.06 had already left the work link but still reported local junction distance under the incoming lane ID. The snapshot now reports incoming-road length plus junction distance, so the roadworks measurement addresses the actual restricted road. Its focused incident scenario passed afterward.

The expanded ten-test suite passed in 91.821 seconds. The final thirteen-test suite passed in 84.852 seconds after the independent-review repairs and produced the same vehicle outcomes in the 12-minute excess-demand cases:

| Seed | Completed trips | Detours | Longest terminal vehicle stall (s) | Active | Pending | Final flow (trips/min) |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 252 | 33 | 50.03 | 84 | 95 | 21 |
| 42 | 243 | 39 | 48.83 | 84 | 96 | 28 |
| 4294967295 | 242 | 38 | 66.20 | 84 | 96 | 19 |

Independent review then found and exactly reproduced:

1. Seed 2026 citizens 20/30 overlapped first at tick 222 and became co-located at a shared corner. The new corner/landing model and personal-space guard passed the every-tick 1,800-tick regression, with crossings and pedestrian destinations still completing.
2. A re-signed seed-17 checkpoint could inject 100 zero-duration recent completions while lifetime completed trips remained three. Completion IDs, durations and counter reconciliation now reject it.
3. A re-signed checkpoint could grant an NS driver an EW reservation. Restore now derives the original incoming axis, including a vehicle's outgoing-tail state, and rejects a mismatched green or clearance phase.

All three tests were observed red before their repairs. The three closures plus valid checkpoint continuation passed together in 3.204 seconds. Source fingerprints for that candidate were simulation `05c0bb42ad5d3d1b476289c8e9ce8cddbfe06f86df5fcbd47860a1ae58904d0b` and network `1211706ca0504ed1f2699a807eb4f8798affd019a6692c02da4cd42a3c95ef32`.

The final thirteen-test suite covers populated connected trips and replenishment; deterministic batching and frozen snapshots; actual replay of normalized commands from recorded initial controls; three dense safety seeds with reservations/crossings checked every tick and body separation checked every third tick; atomic command rejection and bounded history; exact checkpoint continuation and corruption rejection; physically invalid re-signed checkpoint rejection; completion-history and phase-authorization integrity; every-tick default pedestrian separation; palette-stream isolation; actual demand/policy/incident effects; and 12-minute sustained excess-demand regressions for seeds 1, 42, and 4294967295.

Final machine-readable TAP output: `/workspace/scratch/f951d9074684/traffic-simulation-tests.tap`.

Final combined result: **13 tests, 13 passed, 0 failed, 0 skipped, 0 cancelled; 84,851.711 ms**. This was a fresh run after the corner/landing, completion-history and phase-authorization changes. No unrelated catalogue tests were rerun by this builder.

## Q1 fairness repair — 2026-10-30

The fresh independent closure review passed C1/C2/C3 but found repeated avoidable pedestrian bypass. The immediate fixed-ID ownership claims had no persistent request age, and releasing a blocked far-side corner erased any service priority. Citizen 20 consequently remained stationary for 378.533 seconds in the explicit high-demand trace. Default demand had a 238-second longest sampled stop and 15 sampled intervals over 120 seconds.

### Change and service policy

Each of the 48 citizens now stores two bounded scalar fields: `edgeEnteredTick` and nullable `requestTick`. The request begins at the approach/staging gate and remains attached to that directed approach until its actual corner traversal finishes. A safe release while the outgoing sidewalk is blocked preserves the request. Signal phases and temporary physical blockers also leave its age intact.

Citizen motion now has separate release, arbitration and movement passes. Arbitration observes one common set of positions; eligible requests receive a free corner in ascending request-age order, with an occupied far-side/corner approach winning equal-age ties before a future landing reservation, followed by stable ID. Movement clears connectors and far-side refuges first without taking another person's granted reservation. The implementation does not change routes or positions to manufacture progress, remove citizens, relax body spacing, skip safe landing checks, or admit a crossing under an unsafe signal.

An ineligible older request can still wait because its outgoing sidewalk, landing refuge, or walk window is genuinely unavailable. The rule does not promise that every citizen moves within an arbitrary number of seconds. It removes array-order bypass among eligible competitors and preserves priority across releases and signal cycles.

The configuration hash changed from `4127a5e0` to `e630d7fa`, identifying the new authority/request-state model. Older prototype checkpoints intentionally fail compatibility checks. Public render snapshots and commands are unchanged. Only CommonJS authority builds were generated by this builder; the browser ESM output remains the lead's responsibility.

Restore validates the two fields, integer/range bounds, request age at or after the current edge entry, request/approach consistency, and the presence of an age for a current request. Future ages, ages preceding the edge, missing pending ages, and ages attached to unrelated movement all reject atomically. Genuine pending requests, yielded refuges, corner connectors and road crossings still restore and continue exactly.

### Red to green and focused verification

Before the implementation change, a valid two-arrival fixture staged higher-ID citizen 48 first and lower-ID citizen 1 later during one red phase. At the first safe walk window, the test failed with **actual owner 1, expected 48**. After separating arbitration and recording persistent ages, citizen 48 wins that window. The test also restores the pending queue just before the walk window and confirms byte-identical service.

Four new foundation cases cover the earlier eligible request, an equal-age far-side clearing tie, preserving age after a blocked far-side release through later actual service and checkpoint continuation, and four malformed age/approach states rejected atomically. The full affected suite passes **17 tests, 17 passed, 0 failed/skipped/cancelled, 63,118.457920 ms**. The original three 12-minute vehicle high-demand regressions retain their prior outcomes: 252/243/242 completions, 33/39/38 real detours, and final longest stalls 50.03/48.83/66.20 seconds for seeds 1/42/4294967295.

The retained independent probe scripts were copied into a separate scratch evidence directory with import/output-path changes only. The old review's source and results were not overwritten. Current-candidate executions found:

- Original C1: zero P/P, V/P or V/V overlaps across all 1,801 default frames through tick 1800, while 18 crossings, four pedestrian journeys and 11 vehicle trips completed.
- Original C2 and C3: the exact forged completion history and opposing-green reservation reject as `INVALID_STATE`; rejection is atomic.
- Restore boundaries: all ten malformed cases reject atomically, while all ten genuine corner/road/green/clearance/history checkpoints restore immediately and continue 90 ticks byte-identically.
- Long progress/replay: the command-driven 15-minute case matches all ten serialized continuation comparisons after its tick-10800 checkpoint. All 32 initial vehicles finish by 285 seconds; every initial pedestrian journey finishes by 483 seconds, down from 562. At minute 15 it has 315 completed vehicle trips, 166 pedestrian journeys and 522 crossings. Pending demand falls to 35 after the scheduled demand reduction; no initial cohort is removed or reset.
- Read-only allocation audit: 1,130 default and 1,060 high-demand grants that started with a free corner were inspected using actual request ages, physical positions and signal windows. Of these, 120 and 125 involved multiple eligible competitors. There were **zero older-eligible bypasses**; older higher-ID citizens won 59 and 60 contests. Seven and nine safe reservation yields retained their original ages, with zero unexpected age changes on the same approach. This audit is scoped to those observed allocations, not a proof over every possible blocking dependency.

### Measured waiting and remaining limitation

The same retained latency probes were run on the new source. Their sampling definitions are unchanged.

| Measurement | Reviewed prior candidate | Current candidate |
| --- | ---: | ---: |
| Citizen 20 longest stationary interval in the explicit high-demand 230–660 s observation window, every tick | 378.533 s | 82.200 s |
| Longest default stop in the 15-minute, once-per-second sample | 238 s | 143 s |
| Default citizen 44 longest sampled stop | 238 s | 85 s |
| Default citizen 31 / 33 longest sampled stops | 231 / 231 s | 90 / 104 s |
| Default sampled intervals over 120 s | 15 | 3 |
| Default sampled intervals over 60 s | 89 | 105 |
| Citizens with a default sampled stop over 60 s | 45 | 45 |
| All initial high-demand pedestrian journeys complete | 562 s | 483 s |
| High-demand pedestrian journeys completed by 15 minutes | 180 | 166 |

Fair service redistributes delay; it does not improve every aggregate. Multi-minute waits remain possible when real downstream space or successive safe crossings are unavailable. The all-citizen high-demand replay still observed a 226-second longest one-second-sampled stop, belonging to citizen 7. No claim of a universal latency bound, crowd-dynamics realism, independent quality acceptance, commercial superiority or production readiness follows from these finite probes.

### Candidate identity and evidence

| File | SHA-256 |
| --- | --- |
| `games/ai-city-traffic/src/simulation.ts` | `543b1ec46043142bc618dfae14a19aeb3ed6a208da5056b636a92aaf34a8c199` |
| `games/ai-city-traffic/src/traffic-network.ts` | `1211706ca0504ed1f2699a807eb4f8798affd019a6692c02da4cd42a3c95ef32` |
| `tests/foundation/city-traffic-simulation.test.cjs` | `a410e99b52b760d1ce6468b9f4cc8c512097825852cf1f48f637b61be012fcf0` |
| Compiled CommonJS `simulation.js` | `fd548ea6a1ae8a6f7abc4aadb71af652272eb3f4a4f06d4c92acc669130f33b2` |

All current raw observations, copied scripts, candidate source, the manifest and final TAP are under `/workspace/scratch/f951d9074684/traffic-fairness-builder-probes/`. `age-order-audit.cjs` is a new observational probe and does not mutate authority. The old critic's retained evidence stays under the original repository probe folder.

## Limits and review focus

The model deliberately reserves an entire junction for one vehicle, so it favors a clear physical safety contract over realistic simultaneous nonconflicting turns. It is a kinematic lane model, not a rigid-body crash model. Pedestrians use conservative reserved corners/landings and body spacing, rather than a general crowd dynamics solver. Their crossing capacity is intentionally bounded; this should remain visible and subject to the integrated quality review. Vehicle/vehicle, vehicle/pedestrian, and pedestrian/pedestrian separation now have runtime and focused regression coverage.

The finite seed corpus and minutes-scale scenarios do not prove arbitrary-seed, multi-day liveness, all-platform numeric identity, production readiness or commercial visual parity. A detour budget can be exhausted in a sufficiently adversarial run; the authority exposes real congestion instead of silently resetting it. These limits belong in the lead's independent correctness/quality review and production-readiness documentation.

The lead owns browser/CommonJS parity verification, integrated running-game review, independent criticism, final source commit and the larger benchmark evidence record.
