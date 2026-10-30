'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createTrafficSimulation, TrafficSimulation } = require('./authority.cjs').simulation;
const simulation = createTrafficSimulation({ seed: 2026, demand: 2, policy: 'fixed' });
const initial = simulation.snapshot().vehicles.map(v => v.id);
const destinations = new Map();
const initialPedestrians = JSON.parse(simulation.serialize()).payload.pedestrians.map(p => ({ id: p.id, route: JSON.stringify(p.route) }));
const pedestrianProgress = new Map(simulation.snapshot().pedestrians.map(p => [p.id, { id: p.id, x: p.x, z: p.z, lastMovedSecond: 0, longestStoppedSeconds: 0, firstJourneyCompletedSecond: null, observedJourneyCompletions: 0, previousRoute: initialPedestrians.find(q => q.id === p.id).route }]));
let allInitialPedestrianJourneysCompletedAt = null;
const pedestrianMinutes = [];
const minutes = [];
let firstAllInitialGone = null, originOrDestinationChanged = null, continuation = null;
let clone = null;
const replayChecks = [];
for (let seconds = 1; seconds <= 900; seconds++) {
  const command = seconds === 61 ? { type: 'toggle-incident' }
    : seconds === 241 ? { type: 'toggle-incident' }
    : seconds === 421 ? { type: 'set-policy', value: 'adaptive' }
    : seconds === 661 ? { type: 'set-demand', value: .25 } : null;
  if (command) { simulation.command(command); if (clone) clone.command(command); }
  simulation.step(30);
  if (clone) clone.step(30);
  const frame = simulation.snapshot();
  const payloadForPedestrians = JSON.parse(simulation.serialize()).payload;
  for (const person of frame.pedestrians) {
    const progress = pedestrianProgress.get(person.id);
    if (Math.hypot(person.x - progress.x, person.z - progress.z) > 0.001) progress.lastMovedSecond = seconds;
    progress.longestStoppedSeconds = Math.max(progress.longestStoppedSeconds, seconds - progress.lastMovedSecond);
    progress.x = person.x; progress.z = person.z;
    const route = JSON.stringify(payloadForPedestrians.pedestrians.find(p => p.id === person.id).route);
    if (route !== progress.previousRoute) { progress.observedJourneyCompletions++; progress.firstJourneyCompletedSecond ??= seconds; progress.previousRoute = route; }
  }
  if (allInitialPedestrianJourneysCompletedAt === null && [...pedestrianProgress.values()].every(p => p.firstJourneyCompletedSecond !== null)) allInitialPedestrianJourneysCompletedAt = seconds;
  for (const vehicle of frame.vehicles) {
    const identity = { origin: vehicle.origin, destination: vehicle.destination };
    const prior = destinations.get(vehicle.id);
    if (prior && JSON.stringify(prior) !== JSON.stringify(identity)) originOrDestinationChanged ??= { tick: frame.tick, id: vehicle.id, prior, identity };
    destinations.set(vehicle.id, identity);
  }
  if (!firstAllInitialGone && initial.every(id => !frame.vehicles.some(v => v.id === id))) firstAllInitialGone = seconds;
  if (seconds === 360) {
    clone = TrafficSimulation.restore(simulation.serialize());
    assert.equal(clone.serialize(), simulation.serialize());
    continuation = { restoredAtTick: frame.tick, restoredReroutes: frame.metrics.reroutes, restoredReservations: frame.signals.filter(s => s.reservedVehicleId !== null).length, restoredCrossingCitizens: frame.pedestrians.filter(p => p.crossing).length };
  }
  if (seconds % 60 === 0) {
    const state = JSON.parse(simulation.serialize()).payload;
    const item = { minute: seconds / 60, tick: frame.tick, completed: frame.metrics.completed, flow: frame.metrics.flow, reroutes: frame.metrics.reroutes, active: frame.metrics.active, pending: frame.metrics.pending, rejected: frame.metrics.rejected,
      initialStillActive: initial.filter(id => frame.vehicles.some(v => v.id === id)),
      oldestActiveAge: Math.max(0, ...state.vehicles.map(v => (state.tick - v.bornTick) / 30)),
      longestStopped: Math.max(0, ...state.vehicles.map(v => (state.tick - v.lastProgressTick) / 30)),
      oldestPendingAge: Math.max(0, ...state.pending.map(v => (state.tick - v.requestedTick) / 30)),
      mostReroutes: Math.max(0, ...state.vehicles.map(v => v.reroutes)) };
    minutes.push(item);
    const pedMinute = { minute: seconds / 60, pedestrianCompleted: frame.metrics.pedestrianCompleted, pedestrianCrossings: frame.metrics.pedestrianCrossings, moving: frame.pedestrians.filter(p => p.speed > .01).length, waiting: frame.pedestrians.filter(p => p.waiting).length, initialJourneysIncomplete: [...pedestrianProgress.values()].filter(p => p.firstJourneyCompletedSecond === null).map(p => p.id), longestCurrentStopSeconds: Math.max(...[...pedestrianProgress.values()].map(p => seconds - p.lastMovedSecond)) };
    pedestrianMinutes.push(pedMinute);
    console.log(JSON.stringify({ pedestrians: pedMinute }));
    console.log(JSON.stringify(item));
    if (clone) { assert.equal(clone.serialize(), simulation.serialize()); replayChecks.push(frame.tick); }
  }
}
const commandSim = createTrafficSimulation({ seed: 2026 });
const boundary = [];
for (const value of [.25, 2, .2549, 1.9999]) { commandSim.command({ type: 'set-demand', value }); boundary.push({ input: value, normalized: commandSim.snapshot().demand }); }
for (let i = 4; i < 16; i++) commandSim.command({ type: 'toggle-incident' });
const beforeRejection = commandSim.serialize();
let rateLimitRejected = false;
try { commandSim.command({ type: 'toggle-incident' }); } catch (error) { rateLimitRejected = error.code === 'INVALID_INPUT'; }
const rateLimitAtomic = commandSim.serialize() === beforeRejection;
commandSim.step();
const acceptsNextTick = commandSim.command({ type: 'set-policy', value: 'fixed' }).tick === 1;
const result = { seed: 2026, demand: 2, initialPolicy: 'fixed', commandSchedule: [{ seconds: 60, type: 'toggle-incident' }, { seconds: 240, type: 'toggle-incident' }, { seconds: 420, type: 'set-policy', value: 'adaptive' }, { seconds: 660, type: 'set-demand', value: .25 }], firstAllInitialGone, originOrDestinationChanged, allInitialPedestrianJourneysCompletedAt, pedestrianProgress: [...pedestrianProgress.values()], pedestrianMinutes, continuation, replayChecks, minutes, boundary, rateLimitRejected, rateLimitAtomic, acceptsNextTick };
console.log(JSON.stringify({ summary: result }));
fs.writeFileSync(__dirname + '/traffic-closure-replay-fairness-results.json', JSON.stringify(result, null, 2));
