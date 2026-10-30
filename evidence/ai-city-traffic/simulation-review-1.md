# Game 11 traffic authority: independent critic report

Review date: 2026-10-30. Baseline evidence archived at 20:26:13 UTC.

## Verdict and scope

**Specification verdict for the reviewed baseline: FAIL. Quality verdict for the reviewed baseline: FAIL.** The traffic authority demonstrates connected travel, real completions, reproducible restore/continuation, bounded local commands, and operational signal and incident changes in the scenarios below. It also has three reproduced load-bearing defects: pedestrians overlap at shared sidewalk corners during an ordinary default run; semantic checkpoint validation accepts an impossible completion history that fabricates the displayed flow; and checkpoint validation accepts an approach/green mismatch that causes a vehicle to enter on the opposing green.

**Biggest next gap: pedestrian occupancy across sidewalk-edge boundaries and corner queues.** This defect occurs in a fresh default simulation without malformed input. At tick 232 (7.733 simulated seconds), two citizens have exactly the same authoritative world position, while one is stationary and the other walks through. The builder has the reproduction. The two restore findings must also close before claiming verified recovery or metric integrity.

These verdicts apply to the immutable baseline hashes below, not to later builder changes. The builder was notified and began preparing regressions/fixes during this review. Any later candidate needs targeted revalidation; a code change or a builder's test summary alone does not close a finding.

This review covers the actual production TypeScript authority and its direct headless output. It does not cover browser rendering, vehicle mesh footprint versus authority footprint, sound, accessibility, server behavior, or integrated browser performance. No Cities: Skylines II commercial reference was captured. Commercial parity/comparison remains **BLOCKED / UNVERIFIED** and cannot be established by these probes.

## Review manifest

Reviewer role: fresh independent simulation critic; no production or foundation-test edits made by this reviewer. Instructions read: root `AGENTS.md`; approved `docs/superpowers/specs/2026-10-30-city-traffic-gauntlet.md`; repository `deterministic-simulation`, `simulation-qa`, `game-physics`, and `production-readiness-review` skills. Source and existing focused tests were inspected before selecting independent questions. The broad existing suite was not rerun.

Repository: `/workspace/scratch/f951d9074684/ai-games-city-traffic`.

HEAD: `44352c1c5022308a2deabc8789ba5bb0d2a3099c`. Game 11 files were untracked/working-tree files, so HEAD alone does not identify the candidate.

Runtime: Node `v24.22.1`; project-pinned TypeScript `5.8.3`; fixed production step `1/30` seconds; version `city-traffic-1`.

| Artifact | SHA-256 |
| --- | --- |
| `games/ai-city-traffic/src/simulation.ts` | `e6da424cfd440b7143ccc00d53aac0719af639043c77ec084fa4640aa2d43599` |
| `games/ai-city-traffic/src/traffic-network.ts` | `9ae5dd83fc640e862d715856697268513e15c249b1edcc8758f7d1cca6def093` |
| `tests/foundation/city-traffic-simulation.test.cjs` | `aec5a80c427038c4c1e3339fdc1fe0f579e73f61c3c40debc1454f2fe15d2642` |
| Critic compiled `simulation.js` | `a567f3e80ec4a7c51da5e0e5d73f2f91030264ea2fb4ef8b475a452d59504441` |
| Critic compiled `traffic-network.js` | `ad8fd54094c84c9c9ddd9acd9bd3333a58ac1254d71a203d94cf2d38cca31b2d` |

The source hashes were unchanged between the start of inspection, production compilation, both probes, and the baseline archive. Exact reviewed source/test copies are in `/workspace/scratch/f951d9074684/traffic-critic-reviewed-source/`; compiled code is in `/workspace/scratch/f951d9074684/traffic-critic-compiled/`. These make the original findings reproducible even if working files change.

## Executed commands and evidence

Targeted production compilation, from the repository root:

```bash
node node_modules/typescript/bin/tsc --target ES2022 --module commonjs --moduleResolution node --strict --skipLibCheck --rootDir games/ai-city-traffic/src --outDir /workspace/scratch/f951d9074684/traffic-critic-compiled games/ai-city-traffic/src/simulation.ts games/ai-city-traffic/src/traffic-network.ts
```

Independent probes, both exited 0 after emitting their observations (they intentionally report accepted invalid state instead of throwing on those findings):

```bash
node /workspace/scratch/f951d9074684/traffic-critic-probes.cjs
node /workspace/scratch/f951d9074684/traffic-critic-replay-fairness.cjs
```

Machine-readable primary results:

- `/workspace/scratch/f951d9074684/traffic-critic-probe-results.json`
- `/workspace/scratch/f951d9074684/traffic-critic-replay-fairness-results.json`

The first probe asks whether all people and vehicles remain separated during a default run, and whether restore rejects individually valid fields that are semantically impossible together. The second asks whether genuine traffic with detours, an incident, policy/demand changes, and occupied junctions survives restore exactly and continues serving an initial cohort. They execute the compiled production authority, not a surrogate simulator. No socket or server was used.

To reproduce the baseline after working-source changes, compile the archived `traffic-critic-reviewed-source/simulation.ts` and `traffic-network.ts` to a new scratch directory and point the two probe imports at that directory. Do not overwrite the archived baseline with a later candidate.

## Findings

### C1 — P1: pedestrians pass through and stack at shared corner positions

**Trigger:** ordinary `createTrafficSimulation({ seed: 2026 })`; default demand and adaptive policy; advance ticks 0 through 1800, checking every snapshot. Citizen footprint is the authority's own 0.55 m by 0.55 m oriented box, with the same 0.015 m overlap tolerance used by production `bodiesOverlap`.

**Observed:** 1,055 of 1,801 sampled ticks contained at least one citizen/citizen overlap; 5,242 overlapping pair/tick observations. These are repeated observations, not 5,242 distinct citizens or collisions. First overlap is tick 222, citizens 20 and 30, at the southeast corner of j4. A follow-up minimal check found exact co-location at tick 232:

| Field | Citizen 20 | Citizen 30 |
| --- | --- | --- |
| x | -63.2 | -63.2 |
| z | -15.2 | -15.2 |
| speed | 0 | 1.58454 m/s |
| waiting | true | false |
| yaw | π | π/2 |

Citizen 20's route at the first overlap was `[23,18,17,20,21,24,25,10]`, edge 1, position 0: waiting to cross from node 18. Citizen 30's route was `[33,18,23,22,27,26,41,44,47,46]`, edge 0, position 29.866807: approaching the same node on a sidewalk. At tick 232 citizen 30 changes edges through the stationary body at node 18.

**Source explanation, corroborating the runtime result:** baseline `simulation.ts:528` implements citizen movement. Its following constraint at line 540 only compares citizens on the exact same directed edge. At line 551 an arrival immediately increments the edge and resets position to 0. Shared nodes and adjacent edges therefore receive no cross-edge occupancy check. `physicalOverlap` at line 666 builds citizen bodies, but only compares vehicle/vehicle and vehicle/citizen pairs (line 675); it never compares citizen/citizen bodies. Existing dense-traffic tests use the same omission.

**Impact:** violates the specified safe queues/crossings and the game-physics spawn/movement non-overlap requirement in a normal, default run. It is directly visible in any presentation that follows these authoritative positions. This reviewer did not capture browser pixels and does not claim a browser collision capture.

**Required fix:** define deterministic shared-corner ownership/spacing, including queued crossing entrants, sidewalk arrivals, opposite-direction paths, and turns at nodes. Preserve vehicle/citizen clearance and citizen progress; simply adding a runtime assertion would stop the game on existing ordinary behavior.

**Required retest:** first preserve a failing regression for seed 2026 tick 232; then run all-tick citizen/citizen, vehicle/citizen, and vehicle/vehicle separation through several walk/clearance cycles. Include a waiting corner, pedestrians entering/exiting opposing edges, and restore at a populated corner. Verify crossing and destination completions still advance. Owner: simulation builder.

### C2 — P1: restore accepts impossible history and presents invented flow

**Trigger:** create seed 17, advance 600 ticks, serialize. The genuine state reports 3 completed trips and 9 trips/minute. Replace only `payload.completions` with 100 records `{ tick: 600, travelTicks: 0, waitTicks: 0 }`. Recompute the documented non-cryptographic checksum with the same canonical form, as the repository's own invalid-state tests do. Call production `TrafficSimulation.restore`.

**Observed:** restore succeeds. Lifetime `completed` remains 3, while `flow` becomes **300 trips/minute**. No vehicle has made the extra 97 trips. The state otherwise retains genuine vehicle/citizen positions and original trip-conservation totals.

**Source explanation, corroborating the runtime result:** baseline `validateState` checks total trip conservation at line 768 and validates completion field ranges/order at line 769 onward. It never checks history length against lifetime completed count or history sums against lifetime totals. `snapshot` computes flow from the accepted history length at line 599. Zero travel times at tick 600 also pass, although those are not attainable for the supplied vehicle routes.

**Impact:** breaks the requirement that HUD values and recovery points represent real simulation outcomes. This is a malformed-checkpoint trigger, not a claim that a fresh ordinary run spontaneously invents trips. A checksum detects accidental bytes changing; it does not replace the promised semantic validation.

**Required fix:** enforce completion-history consistency with accumulated totals, finite/bounded times and attainable temporal relationships. Preserve legitimate trailing-window truncation. Validate any added counters when restoring rather than trusting them solely because a checksum matches.

**Required retest:** the exact 100-history/3-total fixture must reject atomically with a typed state error; legitimate early-window and expired-history checkpoints must still round-trip. Cover impossible wait/travel relationships and aggregate totals. Owner: simulation builder.

### C3 — P1: restore authorizes entry against the displayed green

**Trigger:** use the same genuine seed-17/tick-600 checkpoint. Find a vehicle on an incoming lane to an unreserved junction; the reproducible first match is taxi 3 on `p1>j1`, an NS approach. Set j1 reservation to 3, signal stage to 2 (EW), started to 600, deadline to 960; re-sign and restore. No route, position, or completion fields need change.

**Observed:** restore accepts it. At tick 648 taxi 3 enters junction j1 with `approach: "ns"`, `status: "turning"`, while j1 displays `phase: "ew"`, `remaining: 10.4`, and `reservedVehicleId: 3`.

**Source explanation, corroborating the runtime result:** baseline reservation validation at `simulation.ts:741` checks owner existence, uniqueness, absence of walk conflict, and adjacent route geometry. It does not require an incoming reservation's approach to match a currently green NS/EW phase. `moveDrivers` treats reservation ownership as sufficient permission to enter. Legitimate reservations can persist through clearance, so a fix must preserve that valid state while rejecting an opposing-green owner.

**Impact:** breaks safe signal semantics after an accepted restore. It is a deliberately malformed checkpoint; no ordinary-run opposing-green admission was observed in the probe. Exclusive junction ownership avoided a second vehicle collision in the reproduced case, but does not make the incompatible state valid.

**Required fix:** validate reservation phase/approach compatibility and relevant admission-stage/position relationships before installing state. Ensure clearance reservations and outgoing tails remain legitimate.

**Required retest:** the exact fixture must reject atomically. Restore genuine incoming-green, in-junction-clearance, and outgoing-tail reservations and continue them to completion without replay divergence. Owner: simulation builder.

## Positive observed evidence and practical limits

### Vehicle separation and functioning crossings

In the seed-2026/default-demand, 60-second, every-tick geometry probe there were **zero observed vehicle/vehicle overlaps and zero observed vehicle/citizen overlaps**. Citizens were observed in crossings on 13,878 person/tick samples. At 60 seconds, the engine reported 11 actual trip completions, 28 completed pedestrian crossings, 5 completed pedestrian journeys, and 48 turns. These observations close only this sample, not a universal safety claim. They do not negate C1.

### Restore continuation with actual detours and occupied junctions

The 15-minute second probe used seed 2026 and demand 2 with fixed signals initially. It enabled the incident at 60 seconds, disabled it at 240 seconds, switched to adaptive at 420 seconds, and reduced demand to 0.25 at 660 seconds. A clone was restored at tick 10,800 (360 seconds), when the state had 8 recorded detours, 10 vehicle reservations, and 2 crossing citizens.

The clone and uninterrupted simulation had byte-identical serialized state at 10 checkpoints from tick 10,800 to 27,000, including the later policy and demand commands. This validates the ordinary saved state and continuation observed here; it does not close C2/C3.

### Cohort progress, demand recovery, and destination preservation

All 32 initial vehicle IDs had completed and left the active set by 285 simulated seconds. There was no reset, and source inspection confirms the ordinary removal path is completed-trip removal. Snapshot checks once per simulated second observed no original-origin or final-destination change for any tracked ID, including detoured vehicles.

| Simulated minute | Completed | Trailing flow/min | Detours | Active | Pending | Rejected |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 11 | 11 | 0 | 80 | 34 | 0 |
| 5 | 88 | 20 | 6 | 84 | 96 | 189 |
| 10 | 199 | 25 | 23 | 84 | 96 | 478 |
| 11 | 220 | 21 | 26 | 84 | 95 | 551 |
| 12 | 245 | 25 | 30 | 84 | 76 | 551 |
| 15 | 315 | 19 | 38 | 84 | 35 | 551 |

Completion count increased every sampled minute. After demand was reduced, pending requests declined and rejected count stopped increasing in the observed period. Largest minute-sampled consecutive-stop age was 92.57 seconds. Longest minute-sampled pending-request age was 447.87 seconds; at the final minute the oldest active trip had run 457.53 seconds. These show real congestion and finite observed progress, not a proof of per-trip fairness for every seed or unbounded operation. No starvation finding is claimed from these values.

### Command and failed-restore boundaries

Demand boundaries 0.25 and 2 were accepted; 0.2549 normalized to 0.25 and 1.9999 to 2. The 17th local command in one tick was rejected with `INVALID_INPUT`, serialization stayed unchanged, and a command on the next tick was accepted. An ordinary corrupted-checksum restore rejected without changing the recipient simulation. These are directly observed, focused boundary checks, not exhaustive schema fuzzing.

## Traceability and status

| Requirement / review question | Evidence | Result for reviewed baseline |
| --- | --- | --- |
| Connected seeded routes reach destinations and replenish | 15-minute production probe; initial cohort and cumulative completions | PASS for sampled scenario |
| Bounded high demand with meaningful incident/policy/demand controls | Recorded four-command schedule, backlog response, completion continuity | PASS for sampled scenario |
| Safe vehicle queues and vehicle/pedestrian crossings | 1,801 every-tick default snapshots, authority OBBs | PASS for sampled scenario |
| Safe purposeful pedestrian movement and queues | Exact co-location at tick 232; repeated OBB overlaps | FAIL, C1 |
| Verified saved state and replay continuation | Genuine checkpoint with occupied junctions; 10 exact comparisons | PASS for sampled normal checkpoint |
| Reject semantically impossible restored metrics | 100 recorded completions versus 3 lifetime completions accepted | FAIL, C2 |
| Reject semantically incompatible restored reservation | NS taxi entered on displayed EW after restore | FAIL, C3 |
| Local command count and normalization bounds | Demand extremes; command 17 rejected atomically | PASS for exercised boundaries |
| Renderer/headless share authority | Source imports and production direct compile inspected | Code-supported; browser execution owned by integrated critic |
| Commercial visual superiority | No captured comparable reference | BLOCKED / UNVERIFIED |
| Production/R5 readiness, real-device or unattended soak | Outside this evidence scope | NOT ESTABLISHED |

## Final closure rule

This baseline cannot receive a clean simulation/specification pass. Close C1 through deterministic physical movement behavior and C2/C3 through semantic validation, then provide final hashes and re-run the exact reproductions plus necessary positive continuation cases. Broader suites should be rerun only when the changed movement/restore behavior creates a concrete regression risk. The reference-media block remains independent of these fixes.
