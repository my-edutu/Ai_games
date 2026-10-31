# Campaign critic, round 2

Verdict: **request changes — hazard truth substantially corrected; save-state invariants remain incomplete; campaign challenge diversity remains below the approved quality bar.**

Fresh independent review of the round-2 diff and actual split core (`types`, `content`, `simulation`, `persistence`, `index`), the builder report, round-1 critique, approved specification, interface contract and AGENTS.md. Applied the repository's simulation QA, deterministic simulation, gameplay progression, procedural generation and game physics guidance. Executed bounded Node probes against the existing compiled headless core; inspected source agrees with observed behavior. No full campaign corpus or repository suite was repeated. No graphical benchmark or production claim is made.

## P1 — Accepted saves can become invalid after legitimate progression

`games/ai-vs-1000-floors/src/persistence.ts:28`.

The four exact round-1 forged fixtures now reject, but validation still checks only an upper bound on relics, not their relationship to cleared floors and the current collectible. A natural floor-5 entrance has no collected relic. Giving that state one relic produces a valid-checksum save which restores successfully. The next legitimate pickup raises relics to two; the core then rejects its own save. This is the highest remaining functional finding: acceptance does not preserve the invariants required for continued save/reload.

Reproduction from repository root:

```js
const c = require('./dist/games/ai-vs-1000-floors/src/index.js');
const s = c.createCampaign('critic');
while (s.floor < 5) c.stepCampaign(s);
s.stats.relics = 1;
const r = c.restoreCampaign(c.serializeCampaign(s)); // accepted
while (!r.collectedIds.length) c.stepCampaign(r);
console.log(r.tick, r.floor, r.stats.relics); // 784, 5, 2
c.restoreCampaign(c.serializeCampaign(r));
// Error: Inconsistent save state
```

Another missing state relationship permits suspended movement. Starting `critic`, advance ten ticks, set `pause=30`, and restore the serialized state. It accepts a running jump with progress 10 and y=1.2444444444444445. After one legal tick y is unchanged, action remains `jump`, and pause falls to 29. The normal simulation never pauses an airborne segment. This changes the exposure timeline after restore. Fractional health (`0.5`) also restores despite all damage and initialization using integers; a floor-6 state with relics changed to zero restores and loses earned progress.

Required correction: validate reward conservation against cleared floors and retained current-floor pickup IDs, accounting for automatic floor-entrance retry retaining pickups; validate legal combinations of status, action, progress and pause, plus integer health. Add focused rejection fixtures and the invariant that accepted states remain restorable after ordinary steps. This is ordinary schema/state validation, not a requirement for authentication or historical replay proving every save originated in the application. Do not merely extend the current four handpicked invalid examples.

## P2 — Route geometry varies, but challenge structure and decisions still repeat

`games/ai-vs-1000-floors/src/content.ts:11–24` and `simulation.ts` safe-window policy.

There is real improvement: routes now have four, five or six nodes; some links are grounded walks; elevation and lateral spacing change; every tenth floor is a hazard-free rest floor. A bounded sample of the first 30 floors in each district for seed `critic` found 15, 13, 14, 13, 12, 14, 15, 13, 13 and 11 distinct route geometries respectively. Every district sample contained all three route lengths and both walk/jump links. These are meaningful changes to motion and floor duration, so the previous claim of exactly four routes per district no longer applies.

The remaining quality gap is structural. Every non-rest floor has one central hazard, one mandatory chain, one early pickup, equal platform sizes, and the same wait-for-70-safe-ticks decision. The four hazard kinds vary dimensions and timing but do not require different policy decisions; the builder accurately discloses this limitation. All middle nodes share one elevation, and district index rotates parameters through the same grammar. There is still no route selection or materially different sequence of challenges between districts. The approved viewer promise includes route selection and ten changing districts, and round 1 specifically asked for distinct challenge templates rather than coordinate variation alone.

Required correction: add a small set of mechanically different constructive templates with visible decisions (for example alternate traversal paths, multiple separately timed crossings, or height-sensitive passage), assign them deliberately across districts, and demonstrate representative moving traces. This does not require a general physics engine, 1,000 unique hand-authored floors, or a numerical minimum of templates. Preserve the newly improved bounded, deterministic progression.

## Resolved and supported findings

- **Round-1 P1 hazard overlap:** resolved in the targeted evidence. Seed `critic` over 6,000 individual ticks reached floor 31 / 30 cleared, with zero active contact-volume overlaps and zero natural hits. The trace included 216 dwell and 157 departure samples inside hazard footprints, 754 walking ticks and 984 wait ticks. Unlike the old test's one-instant check, this examined every tick using the actual per-kind contact height. The conservative opening covers the full movement/dwell/departure interval in this trace.
- **Authoritative hit/recovery:** deliberately injected active contacts at approach, dwell and departure each emitted hit/recover, reduced health to two, incremented retries once and returned to the entrance. Each resumed and reached floor 2 within another 500 ticks. These are fault injections, not claims that normal policy naturally loses. Approach injection also emitted `land` immediately before `hit`; impact presentation should prefer the hit when both share a tick.
- **Exact old forged saves:** complete-at-floor-1, skip-segment-from-spawn, impossible checkpoint and displaced position all reject. Terminal/progress/checkpoint checks are substantially stronger. The remaining P1 above is an incomplete correction, not evidence these old fixtures still pass.
- **Ordinary restore:** 353 sampled saves in the 6,000-tick trace restored without rejection.
- **Relic checkpoint semantics:** naturally reaching floor 6 with seed `relic` gave one relic; explicit checkpoint recovery reset this to zero; replaying to floor 6 restored one, rather than duplicating it. The round-1 ambiguity is resolved by rollback.
- **Finite terminal boundary:** a constructed, consistent floor-1000 entrance reached `complete`, floor 1000, completedFloors 1000 and 200 relics within 300 ticks. Another 300 ticks left its checksum unchanged; the terminal save restored successfully. This is a terminal-boundary probe, not an independent full-campaign completion run. The builder's separate full campaigns remain the broader termination evidence.

## Review limits and disposition

No material regression in natural movement, checkpoint recovery or terminal behavior was observed in these bounded probes. The persistence counterexample requires a forged but correctly checksummed state; it does not demonstrate that ordinary gameplay currently produces invalid saves. It does demonstrate that the advertised validation boundary accepts impossible state and cannot preserve save validity afterward.

Specification review remains blocked by incomplete validated-save semantics and missing route-selection behavior. Quality review credits the genuine improvements while retaining the content-structure finding. Browser worker/build integration and all presentation/reference judgments belong to the lead's separate fresh browser and visual reviews.
