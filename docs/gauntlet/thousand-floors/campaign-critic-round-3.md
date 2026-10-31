# Campaign critic, round 3

Verdict: **request changes — the previous reward and airborne-pause counterexamples are fixed; one narrower accepted-save invariant failure remains. Natural progression passed the bounded independent checks. Route selection remains a separate quality/specification gap.**

Reviewed the actual current `types`, `content`, `simulation`, `persistence` and `index` sources, the focused core tests, round-3 report and review diff, round-2 critique, interface contract, approved specification, plan and AGENTS.md. Applied the repository's simulation QA, deterministic simulation, gameplay progression, procedural generation and game physics guidance. No production source was edited and no browser, whole repository suite or full campaign corpus was run.

The reviewed blobs match the supplied round-3 diff: persistence `a750b5148cceb7bdde916edbba283f35a4b107a4`, simulation `51fffcf51a76bd41962648b8ff5204eba52ec7a6`, content `4a644048d7259ae7650c4453292fb5a58d939f25`, tests `d27e7a89c962b0f373f13bb27ef7b9b2cfb21ab4`. All probes used a fresh isolated compilation of these sources, not the existing application build:

```sh
/workspace/scratch/6620fdffe4f8/ai-games-eko/node_modules/.bin/tsc --target ES2022 --module commonjs --moduleResolution node --strict --skipLibCheck --rootDir . --outDir /tmp/game4-critic-r3 games/ai-vs-1000-floors/src/index.ts
```

## P1 — An accepted recovering state becomes invalid when its pause ends

`games/ai-vs-1000-floors/src/persistence.ts:18` and `:24`.

The recovering branch permits `stats.retries === 0`, although both real recovery entry points increment retries. When the pause expires, the simulation changes status to `running` and retains the `recover` or `hit` action. The validator then requires a positive retry count for that same action. Consequently a correctly checksummed state accepted by restore fails restore after an ordinary simulation tick.

Exact reproduction, after the compilation above:

```js
const c = require('/tmp/game4-critic-r3/games/ai-vs-1000-floors/src/index.js');
const s = c.createCampaign('critic-round3');
s.status = 'recovering';
s.hero.action = 'recover'; // 'hit' reproduces the same failure
s.pause = 1;

const r = c.restoreCampaign(c.serializeCampaign(s)); // accepted
console.log(r.status, r.hero.action, r.pause, r.stats.retries);
// recovering recover 1 0

c.stepCampaign(r);
console.log(r.status, r.hero.action, r.pause, r.stats.retries);
// running recover 0 0
c.restoreCampaign(c.serializeCampaign(r));
// Error: Inconsistent save state
```

This is a malformed-save counterexample, **not evidence that ordinary gameplay naturally creates an invalid recovery state**. It nevertheless violates the advertised validation boundary and the same accepted-save-preserves-validity requirement raised in round 2. A save captured at this accepted state's recovery boundary cannot reload. Authenticating the whole historical trajectory is unnecessary to reject this local contradiction.

A bounded phase matrix corroborated the issue rather than relying only on this fixture. Starting from five bases (new run, ten-tick movement, first landing, floor-2 transition and real explicit recovery), it combined four statuses, nine actions, pauses `0/1/8/18/30`, and retry counts `0/1`. Of 1,800 candidates, 118 restored. Each accepted candidate was stepped and revalidated for up to 35 ticks. Thirty-two failed; every failure was the same `recovering` plus `hit`/`recover` plus zero-retries condition, failing when its pause ended. This matrix is bounded evidence, not exhaustive validation.

Required correction: enforce the common recovery-entry invariant before accepting recovering states, and add a small phase-transition test that checks accepted states at pause expiry. Preserve legitimate automatic entrance recovery with retained pickups and explicit checkpoint recovery with rolled-back rewards. Do not weaken the running-state validation to admit the contradictory zero-retry state.

## P2 — Sequential crossings improve challenge structure; route selection remains absent

`games/ai-vs-1000-floors/src/content.ts:20–27` and the next-node policy in `simulation.ts`.

The previous assertion that every non-rest floor has one central hazard no longer applies. Hazards can occur at different route nodes, and selected floors contain two independently timed, separated crossings. The simulation evaluates the next hazard at each crossing. A natural `round3-b` trace crossed a two-hazard floor at floor 13 without a hit or active overlap.

This is a meaningful improvement to challenge sequencing. The remaining limitation is correctly disclosed in the builder's report: content still supplies one mandatory route, and the agent only chooses when to traverse its next link. There is no alternate route or route-selection decision. The approved viewer promise expressly includes route selection; changing hazard count and placement does not implement that behavior.

Treat this as a content/design quality and specification gap, separate from the save-validity blocker. The bounded evidence does not imply that the single-route campaign is unfinishable or nondeterministic. A small constructive alternate-path template with an observable deterministic route choice would directly address the missing promise; a general navigation or physics engine is not required.

## Confirmed fixes and natural-path evidence

- **Prior persistence counterexamples reject.** Independently rejected the floor-5 extra relic, floor-6 missing relic, fractional health, airborne pause, complete-at-floor-1, skipped segment, impossible checkpoint and displaced position. A version-1 envelope also rejected. Reward conservation, integral health and the active-movement pause restriction are real improvements.
- **Natural save/reload and subsequent steps passed.** Two fresh seeds, `round3-a` and `round3-b`, each ran 3,200 ordinary ticks and then 45 ticks after explicit checkpoint recovery. There were 3,272 sampled round trips: every eleventh tick or a zero-progress boundary, plus every post-recovery tick. Restored and uninterrupted states advanced independently and produced identical checksums; the advanced restored states also restored successfully.
- **Natural progression stayed truthful in these traces.** The seeds reached floors 17 and 16, each with checkpoint 11 and three relics. They produced 654 and 524 waiting ticks respectively, exercised walk, jump, land, idle and wait actions, and observed no hits. Every sampled tick was checked against each hazard's actual radial contact test and kind-specific height (`1`, `1.5`, `2`, `2.5`); there were zero active overlaps. This is stronger than using one common contact height, but remains a two-seed bounded sample.
- **Explicit checkpoint recovery remained valid.** Both traces returned to floor 11, rolled relics back from three to two, and retained valid deterministic saves through recovery expiry and subsequent movement.
- **Finite terminal boundary passed.** A constructed consistent floor-1000 entrance (`999` completed, checkpoint `991`, `199` relics) completed in 115 ticks. Every intermediate save restored. The terminal state was floor `1000`, completed floors `1000`, checkpoint `1000`, relics `200`; another 300 ticks and explicit recovery left its checksum unchanged (`5924dd4a`). Generating floor `1001` rejected. This is a boundary probe, not another full-campaign completion claim.

## Disposition and limits

The natural trajectory, checkpoint and terminal probes passed; no natural-path correctness regression was found in this review. The remaining P1 is specifically a forged-but-accepted recovery state that crosses into a state rejected by the same validator. Correct that local invariant and obtain fresh focused evidence before closing the persistence finding. Keep route selection open as P2 quality/specification work.

No full 1,000-floor run, broad seed corpus, exhaustive state-space proof, browser/worker integration, graphical benchmark or production-readiness judgment is asserted here. The builder's separate broad completion evidence remains separate from these independent bounded checks.
