'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { simulation: current, network: { walkEdge, pointOnWalk }, buildDirectory } = require('./authority.cjs');
if (!process.env.TRAFFIC_BASELINE_BUILD) throw new Error('Set TRAFFIC_BASELINE_BUILD to a fresh compilation of probes/reviewed-source');
const oldDirectory = path.resolve(process.env.TRAFFIC_BASELINE_BUILD);
const old = require(path.join(oldDirectory, 'simulation.js'));
const result = { buildDirectory, oldDirectory, method: 'Counterfactual fixtures retain identical production physical, random-stream, signal, and route state. Only age fields are removed and the old configuration hash installed for the pre-fix authority. This is a test adapter, not a supported checkpoint migration.', witnesses: [], tail: {} };
function sign(envelope) {
  const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
    : value !== null && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
  const { checksum, ...body } = envelope;
  let h = 2166136261;
  for (const c of canonical(body)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return JSON.stringify({ ...body, checksum: (h >>> 0).toString(16).padStart(8, '0') });
}
const oldConfig = JSON.parse(old.createTrafficSimulation({ seed: 2026 }).serialize()).configHash;
for (const test of [{ tick: 929, corner: 18, older: 34, later: 6, kind: 'sidewalk_corner' }, { tick: 1740, corner: 19, older: 48, later: 12, kind: 'crossing_landing' }]) {
  const source = current.createTrafficSimulation({ seed: 2026 }); source.step(test.tick - 1);
  const checkpoint = JSON.parse(source.serialize());
  const prior = checkpoint.payload;
  const ages = [test.older, test.later].map(id => { const p = prior.pedestrians.find(p => p.id === id); return { id, since: p.requestTick, entered: p.edgeEnteredTick, from: p.route[p.edge], to: p.route[p.edge + 1], position: p.position }; });
  assert.ok(ages[0].since < ages[1].since);
  const adapted = structuredClone(checkpoint);
  for (const p of adapted.payload.pedestrians) { delete p.requestTick; delete p.edgeEnteredTick; }
  adapted.configHash = oldConfig;
  const beforeFix = old.TrafficSimulation.restore(sign(adapted));
  const afterFix = current.TrafficSimulation.restore(JSON.stringify(checkpoint));
  beforeFix.step(); afterFix.step();
  const oldOwner = beforeFix.state.cornerOwners[test.corner], newOwner = afterFix.state.cornerOwners[test.corner];
  result.witnesses.push({ ...test, ages, previousOwner: prior.cornerOwners[test.corner], oldOwner, newOwner,
    oldBypassesOlder: oldOwner === test.later, currentServesOlder: newOwner === test.older });
}
function pose(p) {
  const out = walkEdge(p.route[p.edge], p.route[p.edge + 1]);
  if (p.cornerFrom === null) return pointOnWalk(out, p.position);
  const from = walkEdge(p.cornerFrom, out.from), a = pointOnWalk(from, from.length), b = pointOnWalk(out, 0);
  const length = Math.hypot(b.x - a.x, b.z - a.z), f = length < .000001 ? 1 : Math.min(1, p.cornerProgress / length);
  return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f };
}
function describe(s, person) {
  const edge = walkEdge(person.route[person.edge], person.route[person.edge + 1]);
  const next = person.edge + 2 < person.route.length ? person.route[person.edge + 2] : person.nextRoute[1];
  const point = pose(person), signal = edge.junction === null ? null : s.signals[edge.junction];
  const blockers = s.pedestrians.filter(q => q.id !== person.id && q.route[q.edge] === edge.to && q.route[q.edge + 1] === next && q.position < 2.34);
  const owner = s.cornerOwners[edge.to];
  return { tick: s.tick, id: person.id, from: edge.from, to: edge.to, next, crossingEdge: edge.crossing, position: person.position,
    x: point.x, z: point.z, speed: person.speed, waiting: person.waiting, since: person.requestTick, entered: person.edgeEnteredTick,
    toCornerOwner: owner, ownerAge: owner === null ? null : s.pedestrians.find(q => q.id === owner).requestTick,
    exitBlockers: blockers.map(q => ({ id: q.id, from: q.route[q.edge], to: q.route[q.edge + 1], position: q.position, speed: q.speed, since: q.requestTick })),
    signal: signal === null ? null : { stage: signal.stage, deadline: signal.deadline, reservation: signal.reservation },
    nearby: s.pedestrians.filter(q => q.id !== person.id && Math.hypot(pose(q).x - point.x, pose(q).z - point.z) < 3)
      .map(q => ({ id: q.id, from: q.route[q.edge], to: q.route[q.edge + 1], position: q.position, speed: q.speed, since: q.requestTick })) };
}
const sim = current.createTrafficSimulation({ seed: 2026, demand: 2, policy: 'fixed' });
result.tail = { id: 7, startTick: 12127, endTick: 18948, stationaryTicks: 6822, stationarySeconds: 227.4,
  method: 'Public pose/speed directly observed each tick; dependency explanations below are derived from recorded production state and movement guards.', frames: [], changes: [], counts: { stoppedTicks: 0, hasExitBlocker: 0, ownsTargetCorner: 0, otherCornerOwner: 0, freeCorner: 0 }, trackedPositions: [] };
let lastSignature = null;
for (let tick = 1; tick <= 18950; tick++) {
  const command = tick === 1801 || tick === 7201 ? { type: 'toggle-incident' } : tick === 12601 ? { type: 'set-policy', value: 'adaptive' } : null;
  if (command) sim.command(command);
  sim.step();
  if (tick < 12126) continue;
  const d = describe(sim.state, sim.state.pedestrians.find(p => p.id === 7));
  const snapshot = sim.snapshot().pedestrians.find(p => p.id === 7);
  if (tick >= 12127 && tick <= 18948) {
    if (snapshot.speed === 0 && snapshot.waiting) result.tail.counts.stoppedTicks++;
    if (d.exitBlockers.length) result.tail.counts.hasExitBlocker++;
    if (d.toCornerOwner === 7) result.tail.counts.ownsTargetCorner++;
    else if (d.toCornerOwner === null) result.tail.counts.freeCorner++;
    else result.tail.counts.otherCornerOwner++;
  }
  const signature = JSON.stringify({ from: d.from, to: d.to, cornerOwner: d.toCornerOwner, exitBlockers: d.exitBlockers.map(p => p.id), nearby: d.nearby.map(p => p.id), stage: d.signal?.stage });
  if (signature !== lastSignature) { result.tail.changes.push(d); lastSignature = signature; }
  if (tick % 300 === 0 || [12126,12127,18948,18949,18950].includes(tick)) result.tail.frames.push(d);
}
result.publicSnapshotKeys = { current: Object.keys(current.createTrafficSimulation({ seed: 2026 }).snapshot().pedestrians[0]).sort(), prior: Object.keys(old.createTrafficSimulation({ seed: 2026 }).snapshot().pedestrians[0]).sort() };
result.pass = result.witnesses.every(w => w.oldBypassesOlder && w.currentServesOlder)
  && result.tail.counts.stoppedTicks === result.tail.stationaryTicks
  && JSON.stringify(result.publicSnapshotKeys.current) === JSON.stringify(result.publicSnapshotKeys.prior);
fs.writeFileSync(`${__dirname}/causal-witness-and-tail.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ...result, tail: { ...result.tail, changes: result.tail.changes.slice(0, 8), frames: [result.tail.frames[0], result.tail.frames.at(-1)] } }, null, 2));
process.exitCode = result.pass ? 0 : 1;
