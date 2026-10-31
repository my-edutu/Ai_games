# Campaign critic, round 4

Verdict: **the round-3 recovery-validation P1 is closed by the inspected fix and bounded independent evidence. No remaining P1 was found within this review's evidence. Route selection remains an open P2 design/specification gap. The graphical benchmark is not passed.**

## Scope and method

Reviewed `AGENTS.md`, the approved Gauntlet specification, active phase and progress ledger, interface contract, campaign critiques 2 and 3, and `.superpowers/sdd/2026-10-30-thousand-floors-gauntlet/task-1-round-4-report.md`. Inspected the current split campaign core, focused regression fixtures, worker, server and save-related UI source. Applied the repository's simulation QA, deterministic simulation, gameplay progression, procedural generation and game physics guidance.

All independent runtime probes used this checkout's compiled core through:

```js
require('./dist/games/ai-vs-1000-floors/src/index.js')
```

No compiler or dependencies from another workspace were used. Two bounded inline Node probes completed with exit code 0: one for recovery/save continuation, and one for worker/server contracts. The latter evaluated the actual worker source in a Node VM with its import bound to that same core, captured posted messages and manually invoked its interval callback. Server request checks invoked the actual server handler with request/response doubles. These are contract checks, not browser, live HTTP or performance evidence.

No production file was edited. No browser, broad campaign suite, full 1,000-floor run, stress test or seed corpus was repeated. UI source was being edited concurrently; its observations below apply to the recorded snapshot and remain provisional.

## Closed P1 — zero-retry recovering states reject before pause expiry

The recovering branch in `games/ai-vs-1000-floors/src/persistence.ts`, `validatePhase`, now requires `stats.retries > 0`. Both actual recovery entry points increment retries. The running-state branch still requires a positive retry count for the retained `hit` or `recover` action, so the correction rejects the contradictory input instead of relaxing the later invariant.

The independent matrix used seed `critic-round4`, both actions `recover` and `hit`, every integer pause from 0 through 31, and retry counts zero and one.

| Case | Fresh result |
|---|---|
| Recovering, zero retries, either action, pauses 0–31 | All 64 rejected |
| Recovering, one retry, either action, pauses 1–30 | All 60 accepted and remained restorable through 35 subsequent ticks |
| Recovering, one retry, either action, pauses 0 or 31 | All four rejected |
| Running, zero pause, zero retries, either retained recovery action | Both rejected |
| Running, zero pause, one retry, either retained recovery action | Both accepted and remained restorable through 35 subsequent ticks |

For each accepted case, restored and uninterrupted copies were advanced independently and compared by checksum after every tick; the advanced restored state was serialized and restored again. This exercises the entire declared recovery-pause interval, its immediate invalid neighbors, expiry and following movement. It closes the exact round-3 counterexample for both actions without weakening the existing running-state check.

A compact reproduction of the central matrix, using the same local build:

```sh
node <<'NODE'
const assert = require('node:assert/strict');
const c = require('./dist/games/ai-vs-1000-floors/src/index.js');
for (const action of ['recover', 'hit']) {
  for (let pause = 0; pause <= 31; pause++) {
    const bad = c.createCampaign('critic-round4');
    Object.assign(bad, {status: 'recovering', pause});
    bad.hero.action = action;
    assert.throws(() => c.restoreCampaign(c.serializeCampaign(bad)));
    const good = structuredClone(bad);
    good.stats.retries = 1;
    if (pause === 0 || pause === 31) {
      assert.throws(() => c.restoreCampaign(c.serializeCampaign(good)));
      continue;
    }
    const restored = c.restoreCampaign(c.serializeCampaign(good));
    for (let tick = 0; tick < 35; tick++) {
      c.stepCampaign(good);
      c.stepCampaign(restored);
      assert.equal(c.getStateChecksum(restored), c.getStateChecksum(good));
      c.restoreCampaign(c.serializeCampaign(restored));
    }
  }
}
console.log('Recovery matrix passed');
NODE
```

This is bounded validation evidence, not proof that every possible accepted serialized state is reachable or remains valid indefinitely.

## Natural checkpoint and automatic hit recovery continue correctly

One fresh natural trace, seed `round4-review`, reached floor 16 at tick 3,410 with checkpoint 11, three relics and zero retries. The probe stopped at that entrance; its cap was 4,000 ticks. It sampled saves every 53rd tick or at a zero-progress boundary, producing 1,672 natural-state samples. Every sample round-tripped with the same checksum, its restored and uninterrupted copies agreed after another ordinary step, and the advanced restored copy remained restorable.

Explicit checkpoint recovery then:

- returned to floor 11;
- rolled relics back from three to two;
- incremented retries to one;
- reported the snapshot intent `Returning to checkpoint`;
- remained restorable and checksum-identical through 60 subsequent ticks, including the full 30-tick pause, expiry and resumed movement.

The automatic hit path started from a save naturally captured after collecting the floor-5 relic. The probe deliberately placed the hero at that floor's hazard and advanced logical time to its active window, then called the real simulation step. This is a fault injection to exercise the contact path; it is not evidence that the normal policy naturally collided.

The actual contact handler reduced health to two, incremented retries to one, entered `recovering` with action `hit` and pause 30, and retained `c0` and the earned relic. The snapshot intent was `Returning to floor entrance`. Restored and uninterrupted copies matched and remained restorable at every subsequent tick. Both reached floor 6 after 326 continued ticks, still with one relic and one retry; the final checksum was `6275da97`. The retained pickup therefore did not award a duplicate relic during this replay.

Across the recovery matrix, natural samples and the two real entry paths, the probe performed 6,024 successful save round trips. No rejection or checksum mismatch occurred. This count includes repeated checks around the deliberately bounded phase fixtures; it is not a claim about 6,024 independent seeds or campaign runs.

## Worker and server contracts

The reviewed worker has one serialization-emission path, `save()`, which returns when state is absent, review mode is active, or initialization is incomplete. The UI also carries `reviewFloor` on its review-mode restart command.

Fresh worker contract probes initialized scene reviews at floors 1 and 2 while supplying a corrupt saved string. Both initialized from the real campaign policy, ignored that supplied save, and retained the review flag. Each was exercised through explicit save, pause/resume, speed four, checkpoint recovery, restart with the same review floor, and 215 manual interval callbacks spanning automatic-save opportunities. **Neither emitted a save message or an error.** All emitted snapshots remained marked as review snapshots.

A normal initialization with corrupt saved data emitted `save-rejected`, no initialized message and no save. Explicit save, pause, checkpoint recovery and 100 interval callbacks did not bypass this state. Only a deliberate `restart` created a new floor-1 campaign and emitted its first save.

Normal save continuation also passed: a genuine save at tick 93 restored with the exact checksum, and 20 callbacks at speed four produced the same state as 80 direct core ticks. The resulting tick-173 checksum was `2032b0d2`.

Server contract checks confirmed:

- distinct game and progress-page routes;
- local core-runtime and pinned Three.js module resolution;
- rejection of eight traversal, malformed, private-file or unapproved vendor-path cases;
- a 405 response to POST and body omission for a HEAD request to `app.js`;
- the worker's same-origin CSP allowance;
- health output that explicitly reports `benchmark: "not-passed"`.

These checks support the reviewed bridge and routing behavior. They do not establish browser scheduling, actual localStorage writes, renderer compatibility, accessibility, resource bounds or performance.

## UI corrupt-save semantics — source only and provisional

In the inspected `public/ai-vs-1000-floors/app.js` snapshot:

- Normal startup reads the existing save; review startup does not read it.
- Worker `save-rejected` sets `saveRejected = true`, keeps initialization false, disables transport controls and presents a visible fresh-start option with text explaining that the previous data is kept.
- The `save` message branch requires initialization, non-review mode and no rejection; `persistVerifiedSave()` separately checks the review and rejection guards.
- The inspected rejection branch does not remove or replace the saved item. The fresh-start button explicitly calls `restart`, after which a successfully initialized new campaign can replace the old save.
- Review-mode restart retains the review floor, and the normal save-key write site remains behind the review guard. Preferences use their own key.

This is consistent with preserving rejected save data until the user's explicit fresh-start action and with avoiding normal-progress writes during scene review. It is a source assessment, not a completed UI interaction test. Concurrent changes require the lead's final browser/integration review of the final UI artifact.

## Open P2 — there is still one mandatory route

`content.ts` supplies one ordered `route`; `simulation.ts` selects its next node by `segment + 1`. Rest floors, varied link lengths/elevations and independently timed sequential hazards remain genuine improvements, but the agent still chooses when to traverse its next link rather than choosing among alternative routes.

The approved viewer promise explicitly includes route selection. That behavior is absent in the reviewed core and remains a P2 content/design and specification gap. It is separate from the closed persistence P1. The bounded evidence does not show that this single-route campaign is unfinishable or nondeterministic.

## Reviewed artifact identifiers

SHA-256 values were recorded at the end of the runtime probes:

| Artifact | SHA-256 |
|---|---|
| `src/persistence.ts` | `3cdc1721a37d12deb188342134a874768bbb6c1d6acac8c7c7f75e8eab08340c` |
| `src/simulation.ts` | `bd331e59dfc7eef8d93747119ac30e5c227d1b27cba75649bedb0bfde44351e5` |
| `src/content.ts` | `ab34840fc81dbcf90b5efaa0a2c86d70724e703c9d528712b631c1749f8b4dad` |
| Compiled `dist/games/ai-vs-1000-floors/src/persistence.js` | `07e30aefc716e7da2340ffc0e3cbf0435612a0965aba378d101bfa7acf27186e` |
| Compiled `dist/games/ai-vs-1000-floors/src/simulation.js` | `bdcf818d0770a3f930e6fcaec55bbc593edc90b2ab85a8046a48631e307b70f0` |
| `public/ai-vs-1000-floors/worker.js` | `93c6d01cd27a304e8dbddd90fdabfcf0db963c8c230f8dd53a88df1a108fd8b7` |
| `scripts/serve-thousand-floors.cjs` | `baed3af3cfe444be59a618b8ab55f4d6067edc4f97292ecb9eb7f7843043905f` |
| Provisional `public/ai-vs-1000-floors/app.js` | `2184fe30215c49315c957dfa3d31bfc4fc40db1811fe66434a83640e0fdc38b2` |

The first three source paths are relative to `games/ai-vs-1000-floors/`.

## Disposition and limits

The round-3 accepted-save failure is resolved by a local invariant that matches both genuine recovery entry paths, with fresh independent checks through expiry and continued play. No remaining P1 was found in the bounded core/worker/server evidence above.

Keep route selection open as P2. Keep the graphical benchmark **not passed**. This review does not grant production approval, clear the presentation/performance gates, independently repeat full-campaign completion, or replace final browser testing of concurrently edited UI and scene code.
