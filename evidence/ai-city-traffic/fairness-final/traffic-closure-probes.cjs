'use strict';
const { TrafficSimulation, createTrafficSimulation, STEP_SECONDS } = require('./authority.cjs').simulation;
const { buildTrip, walkEdge } = require('./authority.cjs').network;
const fs = require('node:fs');
function overlap(a, b) {
  const dx = b.x - a.x, dz = b.z - a.z;
  if (Math.abs(dx) > 10 || Math.abs(dz) > 10) return false;
  const ax = Math.sin(a.yaw), az = Math.cos(a.yaw), bx = Math.sin(b.yaw), bz = Math.cos(b.yaw);
  for (const [x, z] of [[ax, az], [az, -ax], [bx, bz], [bz, -bx]]) {
    const ar = a.length / 2 * Math.abs(ax * x + az * z) + a.width / 2 * Math.abs(az * x - ax * z);
    const br = b.length / 2 * Math.abs(bx * x + bz * z) + b.width / 2 * Math.abs(bz * x - bx * z);
    if (Math.abs(dx * x + dz * z) >= ar + br - 0.015) return false;
  }
  return true;
}
function sign(checkpoint) {
  const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
    : value !== null && typeof value === 'object'
      ? `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`
      : JSON.stringify(value);
  const { checksum: ignored, ...body } = checkpoint;
  let h = 2166136261;
  for (const ch of canonical(body)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return JSON.stringify({ ...body, checksum: (h >>> 0).toString(16).padStart(8, '0') });
}
const report = { environment: { node: process.version }, cases: {} };
function record(name, value) { report.cases[name] = value; console.log(JSON.stringify({ name, ...value })); }
const pedestrian = createTrafficSimulation({ seed: 2026 });
const pedestrianResult = { seed: 2026, ticks: 1800, citizenBody: { length: .55, width: .55 }, collisionTicks: 0, collisionPairs: 0, first: null, vehicleVehicleOverlap: null, vehicleCitizenOverlap: null, observedCrossings: 0 };
for (let tick = 0; tick <= pedestrianResult.ticks; tick++) {
  if (tick) pedestrian.step();
  const frame = pedestrian.snapshot();
  const people = frame.pedestrians.map(p => ({ ...p, length: .55, width: .55 }));
  let thisTick = false;
  for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) if (overlap(people[i], people[j])) {
    pedestrianResult.collisionPairs++;
    thisTick = true;
    if (!pedestrianResult.first) {
      const state = JSON.parse(pedestrian.serialize()).payload;
      pedestrianResult.first = { tick, a: people[i], b: people[j], authoritativeA: state.pedestrians.find(p => p.id === people[i].id), authoritativeB: state.pedestrians.find(p => p.id === people[j].id) };
    }
  }
  if (thisTick) pedestrianResult.collisionTicks++;
  for (let i = 0; i < frame.vehicles.length; i++) {
    for (let j = i + 1; j < frame.vehicles.length; j++) if (!pedestrianResult.vehicleVehicleOverlap && overlap(frame.vehicles[i], frame.vehicles[j])) pedestrianResult.vehicleVehicleOverlap = { tick, a: frame.vehicles[i], b: frame.vehicles[j] };
    for (const p of people) if (!pedestrianResult.vehicleCitizenOverlap && overlap(frame.vehicles[i], p)) pedestrianResult.vehicleCitizenOverlap = { tick, v: frame.vehicles[i], p };
  }
  pedestrianResult.observedCrossings += people.filter(p => p.crossing).length;
}
pedestrianResult.final = pedestrian.snapshot().metrics;
record('default_pedestrian_and_vehicle_separation', pedestrianResult);

const clean = createTrafficSimulation({ seed: 17 });
clean.step(600);
const stable = clean.serialize();
const fakeHistory = JSON.parse(stable);
fakeHistory.payload.completions = Array.from({ length: 100 }, () => ({ tick: 600, travelTicks: 0, waitTicks: 0 }));
try {
  const restored = TrafficSimulation.restore(sign(fakeHistory));
  record('restore_impossible_completion_history', { accepted: true, before: clean.snapshot().metrics, after: restored.snapshot().metrics, totalsCompleted: fakeHistory.payload.totals.completed, historyCount: fakeHistory.payload.completions.length });
} catch (e) { record('restore_impossible_completion_history', { accepted: false, code: e.code, error: e.message }); }

const crossedPhase = JSON.parse(stable);
const owner = crossedPhase.payload.vehicles.find(v => {
  const p = buildTrip(v.route).segments[v.segment];
  return p.kind === 'lane' && p.junction !== null && crossedPhase.payload.signals[p.junction].reservation === null;
});
const ownerPart = buildTrip(owner.route).segments[owner.segment];
const signal = crossedPhase.payload.signals[ownerPart.junction];
signal.reservation = owner.id;
signal.stage = ownerPart.approach === 'ns' ? 2 : 0;
signal.started = 600;
signal.deadline = 960;
try {
  const restored = TrafficSimulation.restore(sign(crossedPhase));
  let entry = null;
  for (let i = 0; i < 300; i++) {
    restored.step();
    const f = restored.snapshot(), v = f.vehicles.find(v => v.id === owner.id);
    if (v?.status === 'turning') { entry = { tick: f.tick, vehicle: v, signal: f.signals.find(s => s.id === v.junctionId) }; break; }
  }
  record('restore_conflicting_reservation_phase', { accepted: true, owner: owner.id, reservationPhase: signal.stage, ownerApproach: ownerPart.approach, entry });
} catch (e) { record('restore_conflicting_reservation_phase', { accepted: false, code: e.code, error: e.message }); }

const failedRestoreAtomic = createTrafficSimulation({ seed: 88 });
failedRestoreAtomic.step(91);
const beforeAtomic = failedRestoreAtomic.serialize();
const bad = JSON.parse(beforeAtomic); bad.payload.vehicles[0].position += 1;
let rejected = false;
try { failedRestoreAtomic.restore(bad); } catch { rejected = true; }
record('invalid_restore_is_atomic', { rejected, unchanged: failedRestoreAtomic.serialize() === beforeAtomic });

fs.writeFileSync(__dirname + '/traffic-closure-probe-results.json', JSON.stringify(report, null, 2));
