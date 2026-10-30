'use strict';
const fs = require('node:fs');
const { createTrafficSimulation } = require('../../../dist/games/ai-city-traffic/src/simulation.js');
const { walkEdge } = require('../../../dist/games/ai-city-traffic/src/traffic-network.js');
const scenario = process.argv[2];
if (!['high', 'default'].includes(scenario)) throw new Error('scenario');
const sim = createTrafficSimulation(scenario === 'high' ? { seed: 2026, demand: 2, policy: 'fixed' } : { seed: 2026 });
function detail(frame, state, id) {
  const person = state.pedestrians.find(p => p.id === id), pose = frame.pedestrians.find(p => p.id === id);
  const edge = walkEdge(person.route[person.edge], person.route[person.edge + 1]);
  return { tick: frame.tick, pose, citizen: person, edge, cornerFromOwner: state.cornerOwners[edge.from], cornerToOwner: state.cornerOwners[edge.to],
    signal: edge.junction === null ? null : { index: edge.junction, ...state.signals[edge.junction], display: frame.signals[edge.junction] },
    nearby: frame.pedestrians.filter(p => p.id !== id && Math.hypot(p.x - pose.x, p.z - pose.z) < 4)
      .map(p => ({ pose: p, citizen: state.pedestrians.find(q => q.id === p.id) })),
    allCornerOwners: state.cornerOwners, metrics: frame.metrics };
}
function commandAt(tick) {
  const command = tick === 1800 ? { type: 'toggle-incident' } : tick === 7200 ? { type: 'toggle-incident' }
    : tick === 12600 ? { type: 'set-policy', value: 'adaptive' } : tick === 19800 ? { type: 'set-demand', value: .25 } : null;
  if (command) sim.command(command);
}
const result = { scenario, seed: 2026, sampling: scenario === 'high' ? 'every tick, seconds 230 through 660, citizen 20' : 'every second, seconds 0 through 900, all 48 citizens', intervals: [] };
if (scenario === 'high') {
  for (let tick = 0; tick < 6900; tick += 30) { commandAt(tick); sim.step(30); }
  let previous = sim.snapshot().pedestrians.find(p => p.id === 20), interval = null;
  for (let tick = 6901; tick <= 19800; tick++) {
    commandAt(tick - 1); sim.step();
    const frame = sim.snapshot(), pose = frame.pedestrians.find(p => p.id === 20);
    const stationary = Math.hypot(pose.x - previous.x, pose.z - previous.z) < 0.000001;
    if (stationary && !interval) interval = { startTick: tick, start: detail(frame, JSON.parse(sim.serialize()).payload, 20), samples: [] };
    if (interval && stationary && tick % 30 === 0) {
      const state = JSON.parse(sim.serialize()).payload;
      const d = detail(frame, state, 20);
      interval.samples.push({ tick, phase: d.signal?.display.phase ?? null, stage: d.signal?.stage ?? null, signalRemaining: d.signal?.display.remaining ?? null,
        cornerFromOwner: d.cornerFromOwner, cornerToOwner: d.cornerToOwner, nearby: d.nearby.map(p => ({ id: p.pose.id, x: p.pose.x, z: p.pose.z, speed: p.pose.speed, edge: p.citizen.edge, position: p.citizen.position, cornerFrom: p.citizen.cornerFrom, route: p.citizen.route })) });
    }
    if (!stationary && interval) {
      interval.endTick = tick - 1; interval.stationaryTicks = tick - interval.startTick; interval.stationarySeconds = interval.stationaryTicks / 30;
      if (interval.stationaryTicks > 1800) { interval.resumed = detail(frame, JSON.parse(sim.serialize()).payload, 20); result.intervals.push(interval); }
      interval = null;
    }
    previous = pose;
  }
  if (interval) { interval.endTick = 19800; interval.stationaryTicks = 19801 - interval.startTick; interval.stationarySeconds = interval.stationaryTicks / 30; interval.ongoing = true; if (interval.stationaryTicks > 1800) result.intervals.push(interval); }
} else {
  const progress = new Map(sim.snapshot().pedestrians.map(p => [p.id, { pose: p, lastMoved: 0, interval: null, longestStoppedSeconds: 0 }]));
  for (let second = 1; second <= 900; second++) {
    sim.step(30);
    const frame = sim.snapshot(), state = JSON.parse(sim.serialize()).payload;
    for (const pose of frame.pedestrians) {
      const p = progress.get(pose.id), stationary = Math.hypot(pose.x - p.pose.x, pose.z - p.pose.z) < 0.001;
      if (stationary && !p.interval) p.interval = { id: pose.id, startSecond: second, start: detail(frame, state, pose.id) };
      if (stationary) p.longestStoppedSeconds = Math.max(p.longestStoppedSeconds, second - p.lastMoved);
      if (!stationary) {
        if (p.interval && second - p.lastMoved - 1 > 60) result.intervals.push({ ...p.interval, endSecond: second - 1, stationarySeconds: second - p.lastMoved - 1, resumed: detail(frame, state, pose.id) });
        p.interval = null; p.lastMoved = second;
      }
      p.pose = pose;
    }
  }
  for (const [id, p] of progress) if (p.interval && 900 - p.lastMoved > 60) result.intervals.push({ ...p.interval, endSecond: 900, stationarySeconds: 900 - p.lastMoved, ongoing: true });
  result.byCitizen = [...progress].map(([id, p]) => ({ id, longestStoppedSeconds: p.longestStoppedSeconds, lastMoved: p.lastMoved }));
}
result.final = sim.snapshot();
result.intervals.sort((a, b) => b.stationarySeconds - a.stationarySeconds);
fs.writeFileSync(`${__dirname}/traffic-closure-pedestrian-latency-${scenario}.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ scenario, intervalCount: result.intervals.length, topIntervals: result.intervals.slice(0, 8).map(({id,startTick,endTick,startSecond,endSecond,stationarySeconds,ongoing,start,resumed})=>({id:id??20,startTick,endTick,startSecond,endSecond,stationarySeconds,ongoing,edge:start.edge,start: {tick:start.tick,pose:start.pose,cornerFromOwner:start.cornerFromOwner,cornerToOwner:start.cornerToOwner,signal:start.signal},resumedAt:resumed?.tick})), finalMetrics: result.final.metrics }, null, 2));
