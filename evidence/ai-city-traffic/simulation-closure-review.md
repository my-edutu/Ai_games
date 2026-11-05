# Game 11 traffic authority — independent closure review

Review date: 2026-10-30. Reviewer: fresh simulation closure critic, independent of the simulation builder. This review executed the settled production authority, made no production or foundation-test edits, and retained the prior baseline evidence unchanged.

## Verdict

**Specification verdict for the original C1–C3 closure and the exercised authority requirements: PASS. Quality verdict: FAIL.** The three original P1 defects are closed on the exact candidate identified below. A separate, reproduced **P2 quality finding, Q1**, remains: deterministic corner and crossing-landing allocation repeatedly postpones waiting citizens, producing unnecessary multi-minute stationary intervals in ordinary traffic.

**Largest next gap: pedestrian service fairness at shared corners and crossing landings.** The next simulation change should preserve the new geometric separation and checkpoint checks while making competing corner requests fair across ticks and signal cycles. Eventual movement closes the permanent-deadlock concern for the observed cohorts; it does not make the repeated multi-minute waits acceptable evidence of convincing continuous citizen behavior.

These are scoped authority verdicts. This review does not certify the integrated browser, mesh/body agreement, rendering, sound, accessibility, commercial superiority, unattended operation, or R5 readiness. No comparison to commercial agent intelligence is supported by this evidence or by screenshots.

## Candidate identity and independent method

Repository HEAD during review: `d1678cd4ac5c3cb8e4817570d6b001cf5f436f31`. The Game 11 source files were untracked working-tree files; the source hashes, rather than HEAD alone, identify this candidate.

| Artifact | SHA-256 |
| --- | --- |
| `games/ai-city-traffic/src/simulation.ts` | `05c0bb42ad5d3d1b476289c8e9ce8cddbfe06f86df5fcbd47860a1ae58904d0b` |
| `games/ai-city-traffic/src/traffic-network.ts` | `1211706ca0504ed1f2699a807eb4f8798affd019a6692c02da4cd42a3c95ef32` |
| `tests/foundation/city-traffic-simulation.test.cjs` | `43020977eb627e12db94903a2c52430b9cd98352ce45861e1490590727a2d767` |
| Fresh compiled `simulation.js` | `8c36be2c49ec88f7b1fb02fe8aa8eb16bb43e9eac74bf0d9429ae649b542d859` |
| Fresh compiled `traffic-network.js` | `c199422e53514df5fb2855d257dfd2a833e2a2d7ab5eb9736c4a6cfbeb6aeed4` |

Runtime: Node `v24.22.1`, repository-pinned TypeScript `5.8.3`, fixed step `1/30` simulated second. Production source hashes were checked before compilation, after the closure runs, and before packaging. Exact reviewed source copies are retained beside the reproducible probes.

The reviewer read `AGENTS.md`, the approved Gauntlet specification, the active ledger, and the deterministic-simulation, simulation-qa, game-physics, production-readiness-review, and verification-before-completion skills. The builder's reported 13/13 tests were not used as independent closure evidence. The whole catalogue suite was not rerun; the three previously recorded unrelated baseline failures remain outside this scope.

Fresh production compilation used a new output directory, `/workspace/scratch/f951d9074684/traffic-closure-compiled`, with strict ES2022/CommonJS TypeScript options. Every executed critic script imported that new candidate directory. Neither `/workspace/scratch/f951d9074684/traffic-critic-compiled` nor the prior baseline reports/results were overwritten or retested accidentally.

The repository copies under `evidence/ai-city-traffic/probes/` have only import/output-path changes from the executed scripts. An exact reverse-transform comparison verified this. They import the normal compiled production authority under `dist/games/ai-city-traffic/src/`, and write beside themselves. The existing JSON results preserve the actual candidate observations; the scripts were not needlessly rerun solely to relocate paths.

## Original findings: closed by current execution

### C1 — Pedestrian overlap at shared corners: CLOSED

The exact default reproduction, `createTrafficSimulation({ seed: 2026 })`, was checked at every tick from 0 through 1800. All 1,801 snapshots, including the former tick-232 failure, had **zero citizen/citizen overlaps, zero vehicle/citizen overlaps, and zero vehicle/vehicle overlaps** using the production authority's 0.55 m citizen boxes and 0.015 m OBB tolerance.

This was real moving traffic: the first minute contained 7,314 crossing-person/tick observations and finished with 11 vehicle trip completions, 18 pedestrian crossings, and 4 pedestrian journey completions. The former body overlap was not avoided by freezing the entire population.

Evidence: `probes/traffic-closure-probe-results.json`, case `default_pedestrian_and_vehicle_separation`.

### C2 — Fabricated completion history inflates flow: CLOSED

Seed 17 at tick 600 genuinely has three completed trips. Replacing its history with the original 100 records, re-signing the checkpoint, and restoring now throws `INVALID_STATE`: `completion window exceeds lifetime completed trips`. The same 100-record adversary using the new completion schema also rejects for the same semantic reason, so this closure does not depend on missing newly required fields.

Seven additional relevant malformed-ledger checks cover duplicate completed IDs, a completed ID still active, zero travel time, waiting longer than a trip lifetime, contradictory birth/duration fields, contradictory cumulative travel totals, and initial-window accounting. Across the ten malformed checkpoint cases in the boundary probe, including C3, every rejection was typed `INVALID_STATE` and left an existing recipient simulation byte-for-byte unchanged.

Genuine early and expired-history checkpoints still restore: tick 600 retains all 3 lifetime completions; tick 3600 retains 16 trailing-window records from 22 lifetime completions. Both restore exactly and continue identically for 90 ticks.

Evidence: `probes/traffic-closure-restore-boundaries-results.json` and the exact original adversary in `probes/traffic-closure-probe-results.json`.

### C3 — Incoming NS reservation accepted under opposing EW green: CLOSED

The original seed-17/tick-600 malformed incoming reservation now rejects with `INVALID_STATE`: `reservation conflicts with signal phase`. Rejection is atomic on an existing recipient. The formerly accepted vehicle cannot enter under that restored opposing green because the invalid state is never installed.

The strengthened validation also accepts the legitimate reservation states it must preserve:

| Genuine checkpoint condition | Observed tick | Restore and 90-tick continuation |
| --- | ---: | --- |
| Incoming vehicle, green | 1 | Exact match |
| Vehicle in junction, green | 58 | Exact match |
| Outgoing vehicle tail, green | 113 | Exact match |
| Vehicle in junction, clearance | 210 | Exact match |
| Incoming vehicle, clearance | 210 | Exact match |
| Outgoing vehicle tail, clearance | 281 | Exact match |
| Citizen in a corner connector | 63 | Exact match |
| Citizen in the road | 255 | Exact match |

Together with the two completion-window cases, all ten genuine boundary checkpoints were accepted, immediately byte-identical, and byte-identical after continuation. The incoming-clearance case matters: an already authorized vehicle can finish a legal admission while the previous green clears.

## Continued progress, replay, and local command boundary

The 15-minute production scenario uses seed 2026, demand 2, fixed signals initially, incident on at 60 s, incident off at 240 s, adaptive signals at 420 s, and demand 0.25 at 660 s. A clone restored at tick 10800 had eight recorded detours, ten occupied vehicle reservations, and one citizen in a crossing. Ten serialized-state comparisons through tick 27000 were byte-identical, including later policy and demand commands.

All 32 initial vehicles completed and left the active set by 285 simulated seconds. The probe observed no origin or destination change for tracked vehicle IDs. All 48 initial pedestrian journeys completed by 562 seconds. Every citizen completed between one and seven journeys in the 15-minute sample. There was no population-wide deadlock, and the slowest initial cohort was not hidden by aggregate completions from other citizens.

| Minute | Vehicle trips completed | Pedestrian journeys completed | Pedestrian crossings | Pending requests | Rejected requests |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 11 | 3 | 16 | 34 | 0 |
| 5 | 88 | 55 | 175 | 96 | 189 |
| 10 | 199 | 114 | 360 | 96 | 478 |
| 11 | 220 | 124 | 385 | 95 | 551 |
| 12 | 245 | 139 | 431 | 76 | 551 |
| 15 | 315 | 180 | 546 | 35 | 551 |

After demand was reduced, the observed backlog declined and rejected count stopped increasing. These finite scenarios demonstrate progress and recovery; they do not prove an unbounded per-agent fairness guarantee.

The 17th local command in one tick rejects with `INVALID_INPUT`; serialized state remains unchanged, and a command on the next tick succeeds. Demand values 0.25 and 2 are accepted, while 0.2549 and 1.9999 normalize to 0.25 and 2. An unsigned modification that breaks the snapshot checksum also rejects atomically.

Evidence: `probes/traffic-closure-replay-fairness-results.json` and `probes/traffic-closure-probe-results.json`.

## Q1 — P2: repeated corner and landing bypass produces multi-minute stationary citizens

**Status: OPEN. Quality verdict: FAIL. Owner: simulation builder.** This is the next actionable simulation quality gap. It occurs during valid ordinary execution; no malformed state is needed. The observations establish long unfair service delays and later recovery, not permanent deadlock or a universal starvation claim.

### Exact long-wait reproduction

In the high-demand replay scenario above, citizen 20 remains exactly at `(-34.2, 32.35)` with speed zero and `waiting: true` from **tick 7032 through tick 18387 inclusive**. That is 11,356 consecutive stationary ticks, or **378.533 simulated seconds**. It moves at tick 18388. The earlier one-second probe reported a 377-second longest stop because it measures differences between one-second position samples; the every-tick trace is the more precise measure.

Citizen 20 is on sidewalk **34→39**, position 29 m of its 30.4 m edge, waiting to approach corner 39 at j9 and then use crossing 39→38. It is not itself in the road. Initially citizen 31 occupies the next crossing's safe staging point, position 1.4 m, and prevents the corner exit from being considered clear.

The blocking citizen repeatedly misses usable walk admission windows. Six sampled j9 walk starts, at ticks **7033, 8338, 9768, 11159, 12593, and 14068**, have enough remaining time for citizen 31's required 279 ticks of road crossing, no vehicle reservation, and no physical body blocking the landing point. The exclusive landing at node 38 has instead just been reserved for citizens **21, 23, 2, 4, 8, and 6**, respectively. All of those IDs precede 31 in the fixed processing order. Those people are still traversing crossing 37→38, so the landing reservation consumes the useful admission window before citizen 31's turn.

Once citizen 31 eventually clears, the older sidewalk waiter is bypassed again. At tick **15413**, corner 39 is free before movement, and citizens 2, 9, and 20 all have a clear requested exit; citizen 2 receives it. At tick **17335**, citizens 9 and 20 both have clear requested exits; citizen 9 receives it. Citizen 20 has been waiting since tick 7032, yet there is no persistent request age giving it priority. Each newly staged pedestrian then blocks the same outgoing path and extends the older wait.

### Ordinary default demand has the same quality defect

With only `createTrafficSimulation({ seed: 2026 })`, no commands, and default demand/adaptive signals, a separate 15-minute run sampled every citizen once per second:

- 45 of 48 citizens had at least one stationary interval longer than 60 sampled seconds.
- There were 89 observed intervals longer than 60 seconds; 15 exceeded 120 seconds, affecting 12 citizens.
- The longest sampled interval was citizen 44, from second 419 through 656 inclusive: **238 sampled seconds**. It resumed afterward.
- Citizens 31 and 33 each had 231-second sampled stops on sidewalk 31→26.
- The run still completed 316 vehicle trips, 186 pedestrian journeys, and 561 pedestrian crossings, so aggregate progress alone would miss this failure of local service quality.

Citizen 44 waits at `(33.25, -16.57133)`, on the far-side staging portion of crossing 25→26 at j6, position 16.22867 m. Its next edge is 26→27. The source classifies this location as beyond the road; the citizen's snapshot says `crossing: false`. Its next path is successively held up by staged citizens **28, 29, 5, and 42**. At tick **16263**, the corner-26 owner releases and citizen 5 takes it while citizen 44 also has a clear requested exit. Citizen 44 remains stationary. The trace later observes citizen 44 gaining the corner and moving at tick **19686**, before the first moving one-second sample at tick 19710.

This is a practical presentation and agent-quality problem: following one person can show several minutes with no motion while later competing users of the same scarce landing or corner are served. No external wait-time benchmark is assumed, and a 60-second wait is not declared intrinsically invalid; the defect is repeated avoidable bypass of older requests across available service windows.

### Source mechanism and smallest useful fix

The source and actual ownership trace agree. `moveCitizens` iterates the citizen array in fixed ID order, immediately assigning `cornerOwners[edge.to]` when a candidate's local checks pass. There is no pending-request timestamp or cross-cycle ordering. The same exclusive owner covers a reserved future landing and subsequent corner transit. A staged walker on the next edge keeps `cornerExitHasRoom` false for arrivals; releasing a corner to avoid a lock cycle also loses that waiter's priority. A lower-ID competitor can claim the next opportunity first and create another full signal wait for the older person.

The next fix should make eligible landing/corner requests deterministic and age-aware across ticks and signal cycles, with explicit priority for clearing occupied landing/staging areas. Preserve physical clearance, pre-reserved safe landings, opposing-direction spacing, valid signal phases, deterministic RNG/replay, and atomic checkpoint validation. Any new reservation/request-age state must be bounded, serialized, and semantically validated. Merely allowing simultaneous bodies, dropping safe landing reservations, increasing aggregate completion counts, or resetting stranded people would not close Q1.

Retest the exact high-demand and default traces, record each citizen's stop distribution and service order, and show that older eligible requests cannot repeatedly lose to later requests without a concrete safety blocker. Re-run the original 60-second every-tick separation check, C2/C3 adversaries, genuine corner/clearance restores, and the 15-minute continuation/progress probe on the new candidate. A later source change requires new hashes and fresh evidence; this report must not be treated as a pass for that later candidate.

Primary Q1 evidence: `probes/traffic-closure-pedestrian-latency-high.json`, `probes/traffic-closure-pedestrian-latency-default.json`, `probes/traffic-closure-corner-fairness-high.json`, and `probes/traffic-closure-corner-fairness-default.json`. The latency trace observes production snapshots; the fairness trace reads actual compiled state without mutation and labels movement-guard explanations as derived diagnostics.

## Traceability and limits

| Review question | Observed result | Verdict |
| --- | --- | --- |
| Former default citizen corner overlap | Zero overlaps in 1,801 every-tick frames, with real crossings and completions | PASS; C1 closed |
| Fake history / impossible metric state | Original and new-schema adversaries reject atomically | PASS; C2 closed |
| Opposing-green incoming reservation | Exact adversary rejects atomically; genuine green/clearance states continue | PASS; C3 closed |
| Recovery and deterministic continuation | Ten long-run comparisons and ten genuine boundary restores match | PASS for sampled cases |
| Cohort progress after corner fix | All initial vehicles and all initial pedestrian journeys complete | PASS for sampled cohorts |
| Command 17 boundary | Typed rejection, unchanged state, next tick accepted | PASS |
| Credible continuous pedestrian service | Repeated unfair multi-minute waits under default and high demand | FAIL; Q1 open |
| Commercial behavioral/visual superiority | Outside this authority execution evidence | UNVERIFIED |
| Production/R5 and long-running unattended operation | No claimed operational qualification | NOT ESTABLISHED |

The result supports closing the original three integrity defects and returning the concrete pedestrian fairness issue to the builder. It does not support ending the quality iteration.
