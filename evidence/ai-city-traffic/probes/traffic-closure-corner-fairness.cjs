'use strict';
const fs = require('node:fs');
const { createTrafficSimulation } = require('../../../dist/games/ai-city-traffic/src/simulation.js');
const { walkEdge, pointOnWalk } = require('../../../dist/games/ai-city-traffic/src/traffic-network.js');
const scenario = process.argv[2];
const high = scenario === 'high';
if (!high && scenario !== 'default') throw new Error('scenario');
const sim = createTrafficSimulation(high ? { seed: 2026, demand: 2, policy: 'fixed' } : { seed: 2026 });
const targetId = high ? 20 : 44, corner = high ? 39 : 26, start = high ? 7032 : 12540, end = high ? 18388 : 19710;
const phases = ['ns','clearance','ew','clearance','walk','clearance'];
const result = { scenario, seed: 2026, targetId, corner, start, end, samples: [], ownerChanges: [], method: 'Read-only observation of actual compiled production state; reasons are derived from current movement guards.' };
function commandAt(tick) {
  if (!high) return;
  const command = tick === 1800 || tick === 7200 ? { type: 'toggle-incident' } : tick === 12600 ? { type: 'set-policy', value: 'adaptive' } : null;
  if (command) sim.command(command);
}
function info(id, state, frame, depth = 0) {
  const p = state.pedestrians.find(p => p.id === id);
  const edge = walkEdge(p.route[p.edge], p.route[p.edge + 1]);
  const next = p.edge + 2 < p.route.length ? p.route[p.edge + 2] : p.nextRoute[1];
  const exits = state.pedestrians.filter(q => q.id !== id && q.route[q.edge] === edge.to && q.route[q.edge + 1] === next && q.position < 2.34).map(p => p.id);
  const out = { id, edge: `${edge.from}>${edge.to}`, position: p.position, cornerFrom: p.cornerFrom, speed: p.speed,
    next, fromOwner: state.cornerOwners[edge.from], toOwner: state.cornerOwners[edge.to], exitBlockers: exits };
  const dependencies = [...exits];
  if (edge.crossing && p.cornerFrom === null && p.position >= 1.399999 && p.position <= 1.400001) {
    const signal = state.signals[edge.junction], landing = pointOnWalk(edge, edge.length - 1.4);
    const landingBlockers = frame.pedestrians.filter(q => q.id !== id && Math.hypot(q.x - landing.x, q.z - landing.z) < .84).map(p => p.id);
    const roadTicks = Math.ceil((edge.length - 2.8) / p.desiredSpeed * 30) + 3;
    out.crossingAdmission = { junction: edge.junction, phase: phases[signal.stage], stage: signal.stage, started: signal.started,
      deadline: signal.deadline, vehicleReservation: signal.reservation, requiredTicks: roadTicks, ticksRemaining: signal.deadline - state.tick,
      safePhase: signal.stage === 4 && signal.reservation === null && signal.deadline - state.tick >= roadTicks,
      landingOwner: state.cornerOwners[edge.to], landingBlockers };
    dependencies.push(...landingBlockers);
    if (state.cornerOwners[edge.to] !== null && state.cornerOwners[edge.to] !== id) dependencies.push(state.cornerOwners[edge.to]);
  }
  if (depth < 2) out.dependencies = [...new Set(dependencies)].filter(q => q !== id).map(q => info(q, state, frame, depth + 1));
  return out;
}
function claims(state) {
  return state.pedestrians.filter(p => {
    const edge = walkEdge(p.route[p.edge], p.route[p.edge + 1]);
    return edge.to === corner && p.position >= edge.length - 1.45;
  }).map(p => {
    const edge = walkEdge(p.route[p.edge], p.route[p.edge + 1]);
    const next = p.edge + 2 < p.route.length ? p.route[p.edge + 2] : p.nextRoute[1];
    return { id: p.id, from: edge.from, next, position: p.position, cornerFrom: p.cornerFrom,
      exitClear: state.pedestrians.every(q => q.id === p.id || q.route[q.edge] !== corner || q.route[q.edge + 1] !== next || q.position >= 2.34) };
  });
}
for (let tick = 1; tick <= end; tick++) {
  commandAt(tick - 1);
  // TypeScript private fields are runtime properties. Observe only; no authority mutation.
  const beforeOwner = sim.state.cornerOwners[corner], beforeClaims = tick >= start ? claims(sim.state) : [];
  sim.step();
  if (tick < start) continue;
  const state = sim.state;
  if (beforeOwner !== state.cornerOwners[corner]) result.ownerChanges.push({ tick, from: beforeOwner, to: state.cornerOwners[corner], beforeClaims,
    target: info(targetId, state, sim.snapshot()) });
  if (tick % 30 === 0 || tick === start || tick === end) result.samples.push({ tick, target: info(targetId, state, sim.snapshot()) });
}
const distribution = {};
for (const sample of result.samples) {
  const key = JSON.stringify({ toOwner: sample.target.toOwner, exitBlockers: sample.target.exitBlockers });
  distribution[key] = (distribution[key] ?? 0) + 1;
}
result.blockingDistribution = distribution;
fs.writeFileSync(`${__dirname}/traffic-closure-corner-fairness-${scenario}.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ scenario, samples: result.samples.length, ownerChanges: result.ownerChanges.length, blockingDistribution: distribution,
  selectedChanges: result.ownerChanges.filter(e => e.from === null && e.beforeClaims.some(p => p.id === targetId && p.exitClear)).map(e=>({tick:e.tick,from:e.from,to:e.to,beforeClaims:e.beforeClaims})) },null,2));
