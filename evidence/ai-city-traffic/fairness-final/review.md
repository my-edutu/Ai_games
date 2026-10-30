# Game 11 traffic authority — independent final fairness review

Review date: 2026-10-30. Reviewer: fresh independent simulation critic. Product source and foundation tests were read-only. The reviewer compiled the current production authority into a new directory, executed it, wrote independent allocation/restore/counterfactual probes, and preserved the prior review evidence.

## Verdict and scope

**SPEC: PASS. QUALITY: PASS for the scoped Q1 causal fix and its retained C1–C3 integrity gates. Q1's older-eligible request bypass and lost request priority on safe release are closed on this exact candidate.** No new P1 or P2 implementation defect was established by this scoped execution.

This is not a blanket quality approval for pedestrian waiting time. Multi-minute stationary citizens still occur, and one measured throughput tradeoff is negative. No universal wait bound, optimal service capacity, commercial behavioral superiority, integrated browser quality, production readiness, or R5 status follows from this report. The fixed commercial comparison bar remains unchanged and cannot be won by this headless review.

The distinction is concrete: the earlier Q1 finding was repeated service of later requests while an older request was already eligible for the same free corner or landing. The current authority serves the older eligible request in the observed contested grants and retains its age after yielding a blocked landing. The remaining long stop traced here has real staging/previous-reservation blockers at the relevant grants. It should inform the next latency improvement; it is not evidence that the same older-eligible bypass still exists.

## Candidate identity and method

| Artifact | SHA-256 |
| --- | --- |
| Current `simulation.ts` | `543b1ec46043142bc618dfae14a19aeb3ed6a208da5056b636a92aaf34a8c199` |
| Current `traffic-network.ts` | `1211706ca0504ed1f2699a807eb4f8798affd019a6692c02da4cd42a3c95ef32` |
| Fresh current `simulation.js` | `fd548ea6a1ae8a6f7abc4aadb71af652272eb3f4a4f06d4c92acc669130f33b2` |
| Fresh current `traffic-network.js` | `c199422e53514df5fb2855d257dfd2a833e2a2d7ab5eb9736c4a6cfbeb6aeed4` |
| Retained pre-fix `simulation.ts` | `05c0bb42ad5d3d1b476289c8e9ce8cddbfe06f86df5fcbd47860a1ae58904d0b` |
| Fresh pre-fix `simulation.js` | `8c36be2c49ec88f7b1fb02fe8aa8eb16bb43e9eac74bf0d9429ae649b542d859` |

Current deterministic version is `city-traffic-1`, configuration hash `e630d7fa`, and authority step 1/30 second. The former configuration was `4127a5e0`. Runtime was Node 24.22.1 with repository-pinned TypeScript 5.8.3. The working product files were untracked, so source/build hashes identify the candidate more precisely than repository HEAD alone.

The current compilation directory was `/workspace/scratch/f951d9074684/traffic-fairness-final-compiled`. For the causal comparison only, the reviewer separately compiled the retained previous source into `/workspace/scratch/f951d9074684/traffic-fairness-final-baseline-compiled`. No old critic compiled output was reused.

The review applied `AGENTS.md`, the approved Gauntlet specification, the active ledger, and the deterministic-simulation, simulation-QA, game-physics, production-readiness-review, and verification-before-completion criteria. It did not rerun the whole catalogue or assume the builder's 17/17 report was independent evidence.

The independent allocation observer records every non-null production corner-owner write, rather than inferring grants only from two end-of-tick snapshots. It checks actual pre-movement geometry, actual post-update signal state, and request ages. A separate uninstrumented production run must serialize identically at every minute. The observer does not rewrite production decisions. This also covers possible same-tick release/regrant writes, although neither natural scenario happened to contain one.

The two full allocation scenarios each run 27,000 ticks (15 minutes), seed 2026. Default uses unmodified default demand/adaptive signals. High starts at demand 2/fixed signals, toggles the incident at ticks 1800 and 7200, changes to adaptive at 12600, and reduces demand to 0.25 at 19800. The corpus is finite and is not a statistical proof across arbitrary seeds or loads.

## Q1: ordering and age persistence are closed

| Runtime observation | Default | High | Total |
| --- | ---: | ---: | ---: |
| Actual corner/landing grants | 1,130 | 1,060 | 2,190 |
| Grants with at least two eligible claimants | 120 | 125 | 245 |
| Older eligible request bypasses | 0 | 0 | 0 |
| Older, higher-ID request wins over later lower ID | 59 | 60 | 119 |
| Invalid eligibility or tie-order grants | 0 | 0 | 0 |
| Safe releases with persistent request age checked | 7 | 9 | 16 |
| Same-approach tick checks preserving request age | 912,191 | 925,710 | 1,837,901 |
| Edge transitions resetting age to the new approach | 1,117 | 1,033 | 2,150 |
| Observed execution equals uninstrumented execution | 15/15 | 15/15 | 30/30 |

Request age never changed while the observed citizen remained on the same approach. All observed releases preserved it. On each new edge, `edgeEnteredTick` became the current tick and `requestTick` reset. Natural equal-age clearance contests were absent from these samples; the explicit equal-age fixture passed separately.

Two genuine states demonstrate that this fixes the earlier mechanism, rather than merely improving an aggregate metric. The reviewer took the current production checkpoint just before each grant, removed only the two new age fields and installed the previous configuration hash in a test adapter, then ran both freshly compiled authorities from the same physical/signal/route/random-stream state. This adapter is a diagnostic fixture, not a supported checkpoint migration.

| Genuine default state | Older request | Later lower-ID request | Previous authority serves | Current authority serves |
| --- | --- | --- | --- | --- |
| Tick 929, sidewalk corner 18 | Citizen 34, since tick 786 | Citizen 6, since tick 911 | 6 | **34** |
| Tick 1740, crossing landing 19 | Citizen 48, since tick 1143 | Citizen 12, since tick 1730 | 12 | **48** |

Both targets were free before their grants. Both cases reproduce the lower-ID behavior in the old production authority and its correction in the current authority. The current public pedestrian snapshot key set remains unchanged.

Primary evidence: `independent-allocation-default.json`, `independent-allocation-high.json`, and `causal-witness-and-tail.json` in this directory.

## Original C1–C3 protection remains intact

**C1, pedestrian/vehicle separation: PASS.** The exact seed-2026 default reproduction checks every tick from 0 through 1800. All 1,801 frames have zero citizen/citizen, vehicle/citizen, and vehicle/vehicle overlaps under the authority's 0.55 m citizen boxes and 0.015 m OBB tolerance. There are 7,314 crossing-person/tick observations, 18 completed pedestrian crossings, four completed pedestrian journeys, and 11 completed vehicle trips. The scene has not been made safe by freezing it.

**C2, forged completion history: PASS.** The seed-17/tick-600 original 100-record fabricated history, and an equivalent adversary using current completion fields, both reject with `INVALID_STATE`. The semantic boundary probe also rejects duplicate completed IDs, completed IDs still active, impossible durations, wait time exceeding lifetime, inconsistent birth/duration fields, contradictory cumulative travel, and contradictory initial-window accounting.

**C3, incoming reservation under opposing green: PASS.** The original re-signed seed-17/tick-600 reservation rejects with `INVALID_STATE`, with the message `reservation conflicts with signal phase`.

All ten malformed cases in the old semantic-boundary probe reject atomically on an existing recipient. Ten genuine checkpoints still restore exactly and continue byte-identically for 90 ticks: incoming/junction/outgoing-tail reservation states under green and clearance, an occupied citizen connector, a citizen in the road, and early/expired completion windows. An unsigned checksum modification also rejects without replacing the recipient.

Primary evidence: `traffic-closure-probe-results.json` and `traffic-closure-restore-boundaries-results.json`.

## New age-state restoration and continuation

Fifteen independently constructed malformed age/approach cases reject with `INVALID_STATE`, without changing the recipient simulation. They cover absent fields; negative, fractional, future, or nonnumeric ticks; a request predating its current edge; an edge entry after its request; a missing age on a pending approach; a request on an unrelated walking edge; and a previous-approach request carried into a connector. A checkpoint bearing the previous configuration hash rejects atomically with `VERSION_MISMATCH`.

Six genuine age-state checkpoints restore immediately byte-identically and remain identical after another 180 ticks:

| Genuine boundary | Observed tick |
| --- | ---: |
| Initial null request ages | 0 |
| New connector/approach with age reset | 71 |
| Near-curb request waiting for a crossing | 121 |
| Distinct pending ages competing for one corner | 146 |
| In-road citizen with request age and reserved landing | 270 |
| Safely released far refuge retaining its age | 4184 |

The last case is citizen 40, whose request remains tick 3883 after it releases corner 30. It survives both restore and continuation.

The long high-demand replay restores at tick 10800 with eight detours, ten vehicle reservations, and a citizen in a crossing. All ten serialized comparisons through tick 27000 match, including the subsequent policy and demand commands. All 32 initial vehicles leave the active set by 285 seconds without origin/destination changes; all initial citizen journeys complete by 483 seconds (previous review: 562 seconds). Command 17 in one tick rejects atomically and the next-tick command succeeds.

Six focused repository tests also pass against the new compilation: immutable/render-read scheduling, normalized command replay, the older-vs-lower-ID landing fixture, equal-age clearing priority, safe-release age continuation, and age validation. The in-process TAP output records six named passes; the initial subprocess wrapper output was not used as a per-test count.

Primary evidence: `independent-request-restore.json`, `traffic-closure-replay-fairness-results.json`, and `focused-inprocess-tests.tap`.

## Remaining latency and throughput limits

The fix improves the worst observed old victims and reduces the default very-long tail, but it does not improve every measure.

| Same seed/scenario measure | Previous review | Current independent run |
| --- | ---: | ---: |
| Default sampled stationary intervals over 60 s | 89 | 105 |
| Default sampled intervals over 120 s | 15 | 3 |
| Default longest sampled stationary interval | 238 s | 143 s |
| Default completed citizen journeys at 15 min | 186 | 186 |
| Default pedestrian crossings at 15 min | 561 | 571 |
| High completed citizen journeys at 15 min | 180 | 166 |
| High pedestrian crossings at 15 min | 546 | 522 |
| High citizen 20's longest exact observed stop | 378.533 s in the old traced interval | 82.2 s in the current full 15 min |

The previous entries are the retained prior critic's observations, not a new broad rerun of the old candidate. Current values were independently remeasured. One-second sampled durations differ from per-tick durations: the current default maximum is exactly **143.5 seconds** for citizen 22, and the current high maximum is exactly **227.4 seconds** for citizen 7. A 60- or 120-second grouping is descriptive, not an invented safety or acceptance threshold.

Citizen 7 is stationary at `(34.2, -32.35)`, sidewalk 28→25, position 29 m, from **tick 12127 through 18948 inclusive**: 6,822 ticks. It wants crossing 25→24 and keeps request tick **12125** throughout. It resumes at **18949**.

Its requested exit is successively occupied by staged citizens 17, 15, and 36. Prior landing reservations also keep the target corner occupied. A revealing transition occurs at tick **14066**: citizen 15 reserves landing 25 while citizen 7 is still physically blocked by departing citizen 17 on edge 25→24. Citizen 17 clears the exit-room threshold at **14088**, after the landing was already safely reserved. Citizen 15 later occupies that outgoing staging strip itself. Another comparable transition occurs at ticks **16401/16418** with citizen 36. When the final owner releases corner 25 at tick **18948**, citizen 7 receives it and moves on the next tick.

These are real remaining phase/admission and staging-capacity delays. They show why an age-ordered eligible queue does not imply bounded end-to-end service or eliminate multi-minute waits: a request can remain ineligible while later eligible traffic obtains a reservation that must safely finish. The direct all-grant audit found no older-eligible bypass at these allocations. The tail dependency explanation is derived from the recorded production state and guards; the stationary coordinates, speed, waiting state, ages, and ownership changes are direct runtime observations.

The next useful simulation quality work is a measured reduction of staging/phase coupling and tail latency while retaining separation, reserved safe landings, deterministic service order, and checkpoint integrity. A broader claim that the resulting individual citizen behavior meets the fixed commercial/viewer bar still requires its own evidence. This review does not grant that claim or waive the remaining latency question.

## Traceability and completion limit

| Gate in this review | Verdict |
| --- | --- |
| Older eligible request cannot lose to a later claimant at the observed free corner/landing grants | PASS; Q1 causal closure |
| Safe release retains approach age; new approach resets it | PASS |
| New request state rejects tested semantic corruption and survives genuine restore | PASS |
| Original C1/C2/C3 failures remain closed | PASS |
| Long replay, cohort progress, and command boundary | PASS for exercised cases |
| No universal wait bound or all-seed capacity proof | NOT ESTABLISHED; not claimed |
| Overall integrated visual/animation/audio/accessibility quality or commercial win | OUTSIDE SCOPE; no win claimed |
| Production/R5/unattended operating qualification | NOT ESTABLISHED |

The portable commands, methods, results, and exact source copies are in this directory. `candidate-manifest.json` identifies the evidence. Any later material simulation change requires a new hash and proportionate fresh review; these passes must not silently transfer to another candidate.
