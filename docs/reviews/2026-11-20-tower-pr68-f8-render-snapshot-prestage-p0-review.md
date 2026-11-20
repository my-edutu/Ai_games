# Infinite Tower Climb PR68 — P0 source-snapshot gallery prestaging blocker, 20 Nov 2026

**Stage: P0 OPEN. Leading assessor: NOT EVALUATED.** Original frozen baseline `1731b380851162741761c5569e2bc152a0869ca9` unchanged; Draft PR68 remains distinct from PR58.

## Original 1× footage and CPU evidence

[Candidate-vs-frozen exact-source native film campaign 44697479639](https://github.com/my-edutu/Ai_games/actions/runs/44697479639), immutable candidate `e0b3ff7675ca6626bcc43d16381f7921c8d1a14e`, completed all eight original 60s+ A/B films plus source ledge. Its stringent native/source event pairing **FAILED both desktop and portrait (0/2)**. Real-motion screenshots sampled across 23.5–30.3 seconds show an abrupt bronze-to-violet handoff. The complete skinned climber is intermittently masked by bronze foreground posts on portrait. No accepted sustained frame sequence yet proves the ORIGINAL opened bronze guardian gateway, the full moving climber and walkable successor together. Projected source coordinates are not pixel evidence.

Raw real-time scene diagnostics from **both** original candidate danger recordings show `firstF9OriginalOwnerPath.originalGalleryPreparation = cold-fallback-original-source-rebuild` for **all four observed F9 episodes**. Exact browser CPU substage milliseconds (not hardware GPU timing):

| First F9 original episode | Old gateway/gallery transfer | Old-floor teardown | Rigid batching |
|---|---:|---:|---:|
| Desktop source tick 475 | 151.9 | 0.4 | 83.8 |
| Desktop source tick 316 | 178.1 | 0.1 | 48.2 |
| Portrait source tick 483 | 142.7 | 0.1 | 54.4 |
| Portrait source tick 319 | 100.0 | 0.1 | 38.4 |

**Found causality:** `games/infinite-tower-climb/src/presentation/snapshot.ts` emits the guardian in a `state.enemies.filter(e => e.floor === state.floor)` projection **without enemy.floor**. The source-owned world F8 prebuild guard required `e.floor===8`, impossible for ALL legitimate render snapshots. Thus the expected early prestage never started. The existing real-Three test fixture included an invented `floor:8` enemy property, so its passing tests had masked the production regression.

## Production repair and safety

[Source+fixture commit `170403ec12731d14b0ad924dc417edb776f3b764`](https://github.com/my-edutu/Ai_games/commit/170403ec12731d14b0ad924dc417edb776f3b764) removes the impossible mandatory enemy.floor check for the already current-floor filtered snapshot; if an optional numeric floor does appear it still must match current floor. Requires authentic guardian id, nonnegative finite health, proper F8 cap geometry, genuine guardian gate, same run, low tier and valid source. **The original CPU prestage is STILL INELIGIBLE for F9 reuse until an actual returned F8 WebGL submission certifies it**; missing return falls back to exact source extraction, not a fake gateway or floor. Tests now use the real published enemy shape, with explicit no-floor assertion and existing returned/never-returned cache contracts. No game simulation, guardian rules, physics, snapshots, platform geometry or PR58 changed.

The [exact-code quality workflow](https://github.com/my-edutu/Ai_games/actions/runs/44699865746) was **QUEUED at code commit**. This is a safety veto, not a quality score. A new 9-job immutable candidate/baseline recording is requested by the updated capture-request ledger; evaluate the resulting workflow/artifacts, not a pending claim. The preceding green quality workflow [44697587666](https://github.com/my-edutu/Ai_games/actions/runs/44697587666) predated the repaired source contract.

## Separate specification / engineering / experience reviews

**Specification:** Genuine published snapshot contract, no synthesized guardian, no future F9 prebuild, frozen baseline and PR58 untouched, same-run F8 WebGL return required for reuse. No unrelated games, merge, deployment, draft change or force-push.

**Engineering:** The repaired guard is necessary to enable the original bounded GPU source-owner reuse, but not sufficient proof of decreased CPU latency. Moving extraction from F9 to F8 may frontload a CPU spike. Inspect first-F8 costs alongside first-F9 costs, real renderer-return latencies and full-motion pixels. The old-room optical handoff remains a separate P0 defect.

**Acceptance/next highest-impact action:** For exact new source SHA, verify `prepared-from-actual-floor-eight-source-awaiting-webgl-return` → `source-built-gallery-confirmed-by-real-floor-eight-return` → `reused-on-real-floor-nine-rebuild` in actual candidate danger A/B desktop+portrait. Quantify CPU and render work; inspect unmodified frames for consecutive actual source-aligned full-body hero, opened original bronze gate and real walkable F9. If optical 0/2 remains, rebuild physical scene/camera/foreground composition together before P1. LOOKS/FEELS/PLAYS independent critics **0/5 each**; supported-device p50/p95/p99/memory **NOT EVALUATED**. Full transformation **NOT EVALUATED**.

## Post-fix original 1× native evidence (source-pinned run 44700319088)

[9-job original baseline/candidate campaign](https://github.com/my-edutu/Ai_games/actions/runs/44700319088) is pinned to immutable source `f8463fbcb5550e9d8294d128cac0f2257e39c353`, containing the production fix `170403ec12731d14b0ad924dc417edb776f3b764`. Its [actual candidate danger artifact](https://github.com/my-edutu/Ai_games/actions/runs/44700319088/artifacts/14613016594) includes both unmodified 68-second-plus WebMs and source-tick/camera/WebGL timing evidence. I extracted the raw WebMs and inspected contiguous native frames around 24–29.5 seconds in both viewports; these are not invented clips or independent judges.

The source-eligible original gallery is now demonstrably **REUSED** on the first Floor9 build in **2/2 desktop and 2/2 portrait episodes**, 675 original F8 triangles in each. Before the fix, all four observations instead reported a cold CPU fallback. The source-owner synchronous F9 substage measured, in browser CPU milliseconds:

| Episode | Before exact-native source | After exact-native source |
|---|---:|---:|
| Desktop #1 | 151.9 | **0.5** |
| Desktop #2 | 178.1 | **0.3** |
| Portrait #1 | 142.7 | **0.7** |
| Portrait #2 | 100.0 | **0.4** |

These are distinct original episodes, not matched tick-by-tick; the measured work moved to earlier F8 prestaging, which still needs its own frame-time and perceptual veto. They are **NOT** hardware/GPU FPS numbers, full application smoothness or improved original-pixel proof.

### Exact-code CI regression and real source-schema distinction

The [first exact-code quality workflow](https://github.com/my-edutu/Ai_games/actions/runs/44699865746) **FAILED 9/10**: in one real-Three phase3 shard, 3/23 tests reconstructed the authoritative immutable crossing with `guardian:prior.enemies[0]`, which now honestly lacked `floor`. This is a different contract from the public snapshot: `TowerGuardianCrossingWitness.guardian.floor=8` is mandatory for real recorded event verification. The source repair is correct; the [test-only fix `39f7e739`](https://github.com/my-edutu/Ai_games/commit/39f7e739ff22324008b3ded25e1b7506476afcf5) adds the authoritative `floor:8` only to actual immutable *witness* fixture objects, while keeping all render enemies floorless. [Current exact-head quality workflow](https://github.com/my-edutu/Ai_games/actions/runs/44700663754): **queued at this record; no pass claimed**.

### P0 next gate, not a stage promotion

Even with real GPU original-gallery reuse, original desktop and portrait video does not yet establish consecutive event-aligned frames showing full moving climber, visibly opened actual guardian steel, and walkable successor simultaneously. Portrait's old bronze uprights still compete with the climber. Strict source-to-native pairing step was **queued** during review. Inspect that job before any claim of comparison or acceptance. Next assess F8 prestage tradeoff and repair the authentic doorway/hero/roof camera composition if strict film remains failed. 0/5 genuinely independent LOOKS, FEELS, PLAYS critics; device p50/p95/p99/memory **NOT EVALUATED**; stage **P0 OPEN**, leading verdict **NOT EVALUATED**. No baseline alteration, PR58 change, merge, deploy, force-push, draft conversion or unrelated game edits.

## P0 continuation — source-authentic returned Floor 8 camera never archived (20 Nov 2026)

The [source-pinned campaign 44700319088](https://github.com/my-edutu/Ai_games/actions/runs/44700319088) completed all eight 60-second-plus original A/B footage jobs plus authentic ledge, but its strict decoded-native danger event pairing **FAILED 0/2**. Film remains unable to show the complete moving hero, opened original bronze gate and real walkable Floor9 together in successive frames. No LOOKS/FEELS/PLAYS pass is justified.

**Second concrete consumer of the same snapshot-schema bug:** `observedOriginalGatewaySubmittedView` in `original-gateway-submitted-camera-bridge.mjs` still searched for a current-floor guardian with `enemy.floor === 8`. Actual published Floor8 enemies are already floor-scoped and have **no** `floor` property. Thus the previously submitted physical F8 camera was never cached, and the existing source-vetted F9 historical-gateway camera bridge could not operate in real gameplay. Original unit tests hid this by inventing a per-enemy floor. This is independent from the earlier gallery prestage fix; both must use the real published source contract. The production change accepts absent per-enemy floor only on a genuine `snapshot.floor===8`, and rejects any explicitly foreign floor. Immutable recorded defeat, returned actual renderer frame, user camera, projected real hero/steel, obstruction and same-run checks are untouched. A new regression uses actual floorless render enemies and a later true HP-zero crossing.

**Existing exact-code CI defect:** [44700663754](https://github.com/my-edutu/Ai_games/actions/runs/44700663754) finished **9/10**, with Phase3-0 failing on a literal missing closing brace in `tower-retained-source-cap-world.test.cjs:75` (SyntaxError before any tests), now corrected as a same-game validation unblocker. No complete CI pass is claimed for the newly committed fix until GitHub reports it. Fresh gameplay footage not yet graded. Stage remains **P0 OPEN**, leading transformation **NOT EVALUATED**, independent critics LOOKS/FEELS/PLAYS **0/5**; hardware p50/p95/p99 and memory NOT EVALUATED. Next: inspect exact-SHA old-camera receipt, source camera bridge accept/veto diagnostics and consecutive real native frames; fix optical source-owned foreground if still failing. Frozen baseline unchanged, PR68 draft, PR58 untouched; no merge/deploy/force push/other games.
