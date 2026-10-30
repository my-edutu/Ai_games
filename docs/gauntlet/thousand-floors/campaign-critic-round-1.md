# Campaign critic, round 1

Verdict: **request changes — specification incomplete; gameplay quality below the required bar.**

Reviewed the actual Task 1 diff and current core, builder report, interface contract, implementation plan, approved design, and AGENTS.md. This is an independent headless review of campaign authority, not a presentation review or production certification. Focused Node probes used the existing compiled core; source and inspected behavior agree. No full repository suite or duplicate full campaign corpus was run.

## 1. P1 — Hazard results are not spatially authoritative; safe-window policy permits active overlap

`games/ai-vs-1000-floors/src/index.ts`, `stepCampaign`, lines 28–30.

Strongest remaining gap: the current four-jump animation completes regardless of actual contact. Only segment 1's start checks a timer. Hazard position, radius, kind, hero occupancy and health do not participate in results. There is no hit event, loss, or autonomous recovery path. This violates the viewer promise that setbacks and hazard results are governed by the simulation and makes the health display misleading. A physics engine is not required; a small deterministic contact model is sufficient.

The 33-tick opening also omits eight stationary landing ticks and the time needed to leave the hazard platform. Real generated output demonstrates the problem:

```js
const c = require('./dist/games/ai-vs-1000-floors/src/index.js');
const s = c.createCampaign('critic');
c.stepCampaign(s, 2308);
const h = c.generateFloor(s.seed, s.floor).hazards[0];
console.log({tick:s.tick, floor:s.floor, kind:h.kind,
  phase:(s.tick+h.phase)%h.period, radius:h.radius,
  distance:Math.hypot(s.hero.x-h.x,s.hero.z-h.z),
  feetAboveSurface:s.hero.y-h.y, health:s.hero.health});
```

Observed: tick 2308, floor 13, gate phase 0 (active), radius 1.3, distance 0.38873012632301995, feet 0.3484444444444444 above the surface, health 3. The hero lands at the gate center at tick 2298, pauses through tick 2306, then leaves just as it activates. It remains within the horizontal footprint through tick 2312. No authoritative contact volume even exists to justify this as a safe clearance.

Required fix: specify contact geometry and per-kind hazard behavior, evaluate contact on every relevant tick including dwell/departure, and plan a safe trajectory through the entire exposure interval. Any genuine hit/fall must generate an honest event and bounded automatic recovery. Validate complete exposure traces, not merely `hazardsAvoided` increment time. Current test only checks that one instant.

## 2. P1 — Checksummed but structurally impossible saves are accepted

`restoreCampaign`, line 40.

The checksum catches byte corruption but does not substitute for state invariants. The restore API accepts campaign states that terminate immediately at floor 1, skip an untraversed floor, or restore an impossible checkpoint. Reproduce without implementing an independent hash:

```js
const c = require('./dist/games/ai-vs-1000-floors/src/index.js');
for (const [name, change] of [
  ['complete-floor1', s => s.status = 'complete'],
  ['skip-floor1', s => s.segment = 4],
  ['fake-progress', s => {s.floor=20;s.completedFloors=0;s.checkpointFloor=7;}],
  ['invalid-position', s => {s.hero.x=14;s.hero.z=14;s.progress=29;}]
]) {
  const s=c.createCampaign('forged'); change(s);
  const r=c.restoreCampaign(c.serializeCampaign(s));
  c.stepCampaign(r);
  console.log(name,r.floor,r.completedFloors,r.status,r.checkpointFloor,r.hero);
}
```

All four are accepted. First remains complete with zero floors cleared. Second advances to floor 2 and credits floor 1 from spawn. Third retains checkpoint 7, which cannot be created by the ten-floor checkpoint mechanic. Fourth teleports from (14,14) to a route landing in one tick.

Required fix: enforce terminal, floor/completed/checkpoint, segment/progress/position and pause/status/action relationships against regenerated geometry; enforce event ordering and stat invariants where semantics require them. Reject unsupported state fields or canonicalize schema. These are validation requirements, not a request for cryptographic authentication or protection against a player deliberately patching the whole application. Add focused valid-envelope/invalid-state fixtures and valid saves at wait, airborne, landing, transition, recovery and completion boundaries.

## 3. P2 — 1,000 floors repeat one challenge topology; district variety is too shallow

`generateFloor`, lines 18–22, and movement policy.

A bounded all-floor enumeration for seed `critic` found exactly **four route geometries in every 100-floor district**, and 40 geometry-plus-hazard-kind templates across the whole campaign (excluding names, colors and hazard phase). Every floor has five equal 4.5 × 4.5 platforms, four one-second jumps with eight-tick landings, one hazard at route node 2, one collectible at route node 1, and an identical 120/35 hazard cycle. All four hazard kinds have exactly the same simulation behavior. There is no route selection or change of challenge structure. Elevation is only a district-wide 0/0.25/0.5 offset for the three middle nodes.

Reproduce geometry count:

```js
const c=require('./dist/games/ai-vs-1000-floors/src/index.js');
const groups=Array.from({length:10},()=>new Set());
for(let floor=1;floor<=1000;floor++) {
  const f=c.generateFloor('critic',floor);
  groups[f.district.index].add(JSON.stringify(f.route));
}
console.log(groups.map(g=>g.size)); // [4,4,4,4,4,4,4,4,4,4]
```

Required fix: construct materially different traversable route/challenge templates, elevation/spacing patterns and hazard arrangements with distinct authoritative decisions. Include district identity and progression in those mechanics and demonstrate representative moving traces. More random coordinates or cosmetic hazard labels alone will not resolve this finding. Scene-owned landmarks can supplement, but cannot provide the missing gameplay variety.

## Additional semantics to decide

Recovery replays collectibles while retaining totals. Seed `relic`, advancing naturally to floor 6 produces relics=1/checkpoint=1; recovering then advancing to floor 6 produces relics=2. If relics represent unique campaign progress, checkpoint recovery must roll back or deduplicate them. If they count lifetime pickups including retries, label that explicitly. This is secondary to the three findings above.

## Positive evidence and limits

The bounded 4,000-tick natural run reached floor 22, transitioned from floor 1 to floor 2 at tick 153 with one cleared floor, and ran without exception. Named seeded generation, fixed-step motion, immutable snapshot copying, bounded recent events and terminal-floor code paths are present. Builder evidence covers full finite runs and ordinary restore equivalence; this review did not repeat that corpus. Kinematic jumps are acceptable in principle, but the hazard/contact mismatch prevents approval. No claim about renderer quality, sustained browser performance, production readiness, or reference parity follows from these probes.

Both review passes require changes: specification (truthful hazard outcomes and valid saves) and quality (meaningful campaign challenge variety). Re-review fresh output after corrections.
