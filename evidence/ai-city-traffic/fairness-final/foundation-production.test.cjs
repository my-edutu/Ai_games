'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createTrafficSimulation,
  TrafficSimulation,
  STEP_SECONDS,
  ROAD_COORDS,
  TRAFFIC_LIMITS,
} = require('./authority.cjs').simulation;

test('city traffic creates connected trips, completes them, and replenishes a diverse fleet', () => {
  const simulation = createTrafficSimulation({ seed: 11 });
  const first = simulation.snapshot();
  assert.equal(STEP_SECONDS, 1 / 30);
  assert.deepEqual(ROAD_COORDS, [-72, -24, 24, 72]);
  assert.equal(first.signals.length, 16);
  assert.ok(first.vehicles.length >= 16, 'the opening city must already contain safe traffic');
  assert.ok(first.pedestrians.length >= 32, 'the opening city must already contain citizens');
  const kinds = new Set(first.vehicles.map(vehicle => vehicle.kind));
  const routes = new Set(first.vehicles.map(vehicle => vehicle.routeId));
  let turned = false;
  let crossed = false;
  for (let tick = 0; tick < 30 * 180; tick += 30) {
    simulation.step(30);
    const frame = simulation.snapshot();
    for (const vehicle of frame.vehicles) {
      kinds.add(vehicle.kind);
      routes.add(vehicle.routeId);
      if (vehicle.status === 'turning' && vehicle.turn !== 'straight') turned = true;
      assert.ok(vehicle.progress >= 0 && vehicle.progress <= 1);
    }
    crossed ||= frame.pedestrians.some(person => person.crossing);
  }
  const middle = simulation.snapshot();
  assert.ok(middle.metrics.completed > 0, 'vehicles must reach actual exit portals');
  assert.ok(middle.metrics.pedestrianCompleted > 0, 'citizens must reach destinations');
  assert.ok(middle.metrics.pedestrianCrossings > 0 && crossed, 'citizens must use crossings');
  assert.ok(turned, 'some routes must turn between connected roads');
  assert.equal(kinds.size, 5);
  assert.ok(routes.size > 16, 'routes must vary beyond the entry portals');
  simulation.step(30 * 120);
  const last = simulation.snapshot();
  assert.ok(last.metrics.completed > middle.metrics.completed, 'throughput must continue after startup');
  assert.ok(last.vehicles.some(vehicle => vehicle.id > Math.max(...first.vehicles.map(item => item.id))));
  assert.ok(last.metrics.flow > 0);
  assert.equal(last.metrics.active, last.vehicles.length);
  assert.equal(last.metrics.queued, last.metrics.pending + last.metrics.waiting);
  assert.equal(last.metrics.generated,
    last.metrics.active + last.metrics.pending + last.metrics.completed + last.metrics.rejected,
    'no trip may silently disappear');
});

test('fixed-step outcomes and immutable snapshots do not depend on render-read frequency', () => {
  const a = createTrafficSimulation({ seed: 734 });
  const b = createTrafficSimulation({ seed: 734 });
  const first = a.snapshot();
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.vehicles));
  assert.ok(Object.isFrozen(first.vehicles[0]));
  assert.throws(() => { first.vehicles[0].x = 900; }, TypeError);
  const actions = [
    { type: 'set-demand', value: 1.37 },
    { type: 'set-policy', value: 'fixed' },
    { type: 'toggle-incident' },
    { type: 'set-policy', value: 'adaptive' },
  ];
  for (const action of actions) {
    a.command(action);
    b.command(action);
    a.step(450);
    for (let batch = 0; batch < 150; batch++) {
      b.snapshot();
      b.step(3);
    }
    assert.equal(a.serialize(), b.serialize());
  }
  assert.deepEqual(a.snapshot(), b.snapshot());
  assert.notDeepEqual(first.vehicles, createTrafficSimulation({ seed: 735 }).snapshot().vehicles);
  const before = a.serialize();
  a.step(0);
  assert.equal(a.serialize(), before);
  for (const count of [-1, 0.5, NaN, Infinity, '30']) {
    assert.throws(() => a.step(count));
    assert.equal(a.serialize(), before);
  }
});

test('normalized command history reproduces a run from its recorded initial configuration', () => {
  const original = createTrafficSimulation({ seed: 607, demand: 0.67, policy: 'fixed' });
  original.step(180);
  original.command({ type: 'set-demand', value: 1.234 });
  original.step(270);
  original.command({ type: 'toggle-incident' });
  original.command({ type: 'set-policy', value: 'adaptive' });
  original.step(500);
  const { payload } = JSON.parse(original.serialize());
  const replay = createTrafficSimulation({ seed: payload.seed,
    demand: payload.initialDemand100 / 100, policy: payload.initialPolicy });
  let tick = 0;
  for (const receipt of payload.commands) {
    replay.step(receipt.tick - tick);
    replay.command(receipt.command);
    tick = receipt.tick;
  }
  replay.step(payload.tick - tick);
  assert.equal(replay.serialize(), original.serialize());
});

function rectanglesOverlap(a, b, padding = 0) {
  const ax = Math.sin(a.yaw), az = Math.cos(a.yaw);
  const bx = Math.sin(b.yaw), bz = Math.cos(b.yaw);
  const dx = b.x - a.x, dz = b.z - a.z;
  const al = a.length / 2 + padding, aw = a.width / 2 + padding;
  const bl = b.length / 2 + padding, bw = b.width / 2 + padding;
  for (const [x, z] of [[ax, az], [az, -ax], [bx, bz], [bz, -bx]]) {
    const extentA = al * Math.abs(ax * x + az * z) + aw * Math.abs(az * x - ax * z);
    const extentB = bl * Math.abs(bx * x + bz * z) + bw * Math.abs(bz * x - bx * z);
    if (Math.abs(dx * x + dz * z) >= extentA + extentB - 0.015) return false;
  }
  return true;
}

function assertPhysicalSeparation(frame, seed) {
  const vehicles = frame.vehicles;
  for (let i = 0; i < vehicles.length; i++) {
    const a = vehicles[i];
    assert.ok(Number.isFinite(a.x + a.z + a.yaw + a.speed));
    assert.ok(a.speed >= 0 && a.speed <= 18);
    assert.ok(Math.abs(a.x) <= 109 && Math.abs(a.z) <= 109);
    for (let j = i + 1; j < vehicles.length; j++) {
      const b = vehicles[j];
      if (Math.abs(a.x - b.x) > 10 || Math.abs(a.z - b.z) > 10) continue;
      assert.ok(!rectanglesOverlap(a, b),
        `vehicle overlap: seed=${seed} tick=${frame.tick} vehicles=${a.id},${b.id}`);
    }
    for (const person of frame.pedestrians) {
      if (Math.abs(a.x - person.x) > 7 || Math.abs(a.z - person.z) > 7) continue;
      assert.ok(!rectanglesOverlap(a, { ...person, length: 0.55, width: 0.55 }),
        `vehicle/citizen overlap: seed=${seed} tick=${frame.tick} vehicle=${a.id} person=${person.id}`);
    }
  }
}

test('dense traffic obeys reservations and safe walk phases without physical overlaps', () => {
  let sawRedQueue = false;
  let sawReservation = false;
  let sawCrossing = false;
  for (const seed of [1, 42, 0xffffffff]) {
    const simulation = createTrafficSimulation({ seed, demand: 2 });
    let previousReservations = new Map();
    for (let tick = 0; tick < 30 * 180; tick++) {
      if (tick === 900 || tick === 2700) simulation.command({ type: 'toggle-incident' });
      simulation.step();
      const frame = simulation.snapshot();
      const signals = new Map(frame.signals.map(signal => [signal.id, signal]));
      for (const signal of frame.signals) {
        if (signal.phase === 'walk') assert.equal(signal.reservedVehicleId, null);
        if (signal.reservedVehicleId !== null) {
          sawReservation = true;
          if (previousReservations.get(signal.id) !== signal.reservedVehicleId) {
            assert.ok(signal.phase === 'ns' || signal.phase === 'ew', 'new admissions require a green phase');
            const admitted = frame.vehicles.find(vehicle => vehicle.id === signal.reservedVehicleId);
            assert.ok(admitted);
            assert.equal(admitted.approach, signal.phase, 'green must match the entering lane');
          }
        }
      }
      for (const person of frame.pedestrians) {
        if (!person.crossing) continue;
        sawCrossing = true;
        const signal = signals.get(person.junctionId);
        assert.ok(signal && (signal.phase === 'walk' || signal.phase === 'clearance'));
        assert.equal(signal.reservedVehicleId, null);
      }
      for (const vehicle of frame.vehicles) {
        if (vehicle.status === 'turning') {
          assert.equal(signals.get(vehicle.junctionId)?.reservedVehicleId, vehicle.id);
        }
        if (vehicle.waiting && vehicle.nextJunctionId) {
          const signal = signals.get(vehicle.nextJunctionId);
          if (signal.phase !== vehicle.approach && signal.reservedVehicleId !== vehicle.id) {
            sawRedQueue = true;
            assert.ok(vehicle.stopDistance >= -0.00001, 'red queues must stop behind the crosswalk');
          }
        }
      }
      if (tick % 3 === 0) assertPhysicalSeparation(frame, seed);
      previousReservations = new Map(frame.signals.map(signal => [signal.id, signal.reservedVehicleId]));
    }
    assert.ok(simulation.snapshot().metrics.completed > 0, `seed ${seed} must keep making progress`);
  }
  assert.ok(sawRedQueue && sawReservation && sawCrossing, 'the scenario must exercise all safety rules');
});

test('commands are validated atomically, normalized, recorded, and bounded', () => {
  const simulation = createTrafficSimulation({ seed: 8 });
  const before = simulation.serialize();
  for (const command of [
    null, {}, { type: 'speed', value: 100 }, { type: 'set-demand', value: NaN },
    { type: 'set-demand', value: '1' }, { type: 'set-demand', value: 0 },
    { type: 'set-demand', value: 2.1 }, { type: 'set-policy', value: 'unsafe' },
    { type: 'toggle-incident', value: true }, { type: 'reset', seed: -1 },
  ]) {
    assert.throws(() => simulation.command(command));
    assert.equal(simulation.serialize(), before, 'rejected input must not change authority');
  }
  const receipt = simulation.command({ type: 'set-demand', value: 1.234 });
  assert.equal(receipt.command.value, 1.23);
  assert.equal(simulation.snapshot().demand, 1.23);
  simulation.command({ type: 'set-policy', value: 'fixed' });
  simulation.command({ type: 'toggle-incident' });
  assert.equal(simulation.snapshot().policy, 'fixed');
  assert.equal(simulation.snapshot().incident, true);
  for (let index = 0; index < 400; index++) {
    simulation.step();
    simulation.command({ type: 'set-demand', value: index % 2 ? 2 : 0.25 });
  }
  const saved = JSON.parse(simulation.serialize());
  assert.ok(saved.payload.commands.length <= TRAFFIC_LIMITS.commands);
  assert.ok(simulation.snapshot().events.length <= TRAFFIC_LIMITS.events);
  assert.ok(saved.payload.commands[0].sequence > 1, 'old log entries must retire explicitly');
  simulation.command({ type: 'reset', seed: 123 });
  assert.equal(simulation.snapshot().seed, 123);
  assert.equal(simulation.snapshot().tick, 0);
  assert.equal(simulation.snapshot().incident, false);
});

test('verified checkpoints resume the exact same authority and reject corruption', () => {
  const uninterrupted = createTrafficSimulation({ seed: 2026, demand: 1.4 });
  uninterrupted.step(2100);
  uninterrupted.command({ type: 'toggle-incident' });
  uninterrupted.step(617);
  const serialized = uninterrupted.serialize();
  const restored = TrafficSimulation.restore(serialized);
  assert.equal(restored.serialize(), serialized);
  uninterrupted.step(900);
  restored.step(900);
  assert.equal(restored.serialize(), uninterrupted.serialize());
  const corrupted = JSON.parse(serialized);
  corrupted.payload.vehicles[0].position += 1;
  assert.throws(() => TrafficSimulation.restore(JSON.stringify(corrupted)), /checksum/i);
  const incompatible = JSON.parse(serialized);
  incompatible.schemaVersion = 900;
  assert.throws(() => TrafficSimulation.restore(JSON.stringify(incompatible)), /version/i);
  assert.throws(() => TrafficSimulation.restore('{bad json'), /state|snapshot|JSON/i);
  const instance = createTrafficSimulation();
  instance.restore(serialized);
  assert.equal(instance.serialize(), serialized);
});

// Re-sign deliberate invalid fixtures using the documented non-cryptographic checksum.
// Checksums detect corruption; semantic validation must also reject impossible state.
function resignCheckpoint(checkpoint) {
  const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
    : value !== null && typeof value === 'object'
      ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
      : JSON.stringify(value);
  const { checksum: ignored, ...body } = checkpoint;
  let checksum = 2166136261;
  for (const character of canonical(body)) checksum = Math.imul(checksum ^ character.charCodeAt(0), 16777619);
  return JSON.stringify({ ...body, checksum: (checksum >>> 0).toString(16).padStart(8, '0') });
}

test('restore rejects impossible overlapping bodies even when a checkpoint checksum is valid', () => {
  const checkpoint = JSON.parse(createTrafficSimulation({ seed: 17 }).serialize());
  checkpoint.payload.vehicles[1].route = [...checkpoint.payload.vehicles[0].route];
  checkpoint.payload.vehicles[1].segment = checkpoint.payload.vehicles[0].segment;
  checkpoint.payload.vehicles[1].position = checkpoint.payload.vehicles[0].position;
  assert.throws(() => TrafficSimulation.restore(resignCheckpoint(checkpoint)), /overlap/i);
});

test('restore rejects a completion window that contradicts lifetime trip totals', () => {
  const simulation = createTrafficSimulation({ seed: 17 });
  simulation.step(600);
  const checkpoint = JSON.parse(simulation.serialize());
  assert.ok(checkpoint.payload.totals.completed < 100);
  checkpoint.payload.completions = Array.from({ length: 100 }, () => ({ tick: 600, travelTicks: 0, waitTicks: 0 }));
  assert.throws(() => TrafficSimulation.restore(resignCheckpoint(checkpoint)), /completion/i);
});

test('restore rejects a vehicle reservation granted to the opposing signal phase', () => {
  const { buildTrip } = require('./authority.cjs').network;
  const simulation = createTrafficSimulation({ seed: 17 });
  simulation.step(600);
  const checkpoint = JSON.parse(simulation.serialize());
  const owner = checkpoint.payload.vehicles.find(vehicle => {
    const part = buildTrip(vehicle.route).segments[vehicle.segment];
    return part.kind === 'lane' && part.junction !== null && checkpoint.payload.signals[part.junction].reservation === null;
  });
  assert.ok(owner, 'fixture needs an unreserved approach');
  const part = buildTrip(owner.route).segments[owner.segment];
  const signal = checkpoint.payload.signals[part.junction];
  signal.reservation = owner.id;
  signal.stage = part.approach === 'ns' ? 2 : 0;
  signal.started = 600;
  signal.deadline = 960;
  assert.throws(() => TrafficSimulation.restore(resignCheckpoint(checkpoint)), /reservation|phase/i);
});

test('citizens keep physical space at shared corners and complete safe crossings', () => {
  const simulation = createTrafficSimulation({ seed: 2026 });
  for (let tick = 0; tick <= 1800; tick++) {
    if (tick) simulation.step();
    const frame = simulation.snapshot();
    const people = frame.pedestrians.map(person => ({ ...person, length: 0.55, width: 0.55 }));
    for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
      if (Math.abs(people[i].x - people[j].x) > 1 || Math.abs(people[i].z - people[j].z) > 1) continue;
      assert.ok(!rectanglesOverlap(people[i], people[j]), `citizen overlap at tick ${tick}: ${people[i].id},${people[j].id}`);
    }
  }
  const frame = simulation.snapshot();
  assert.ok(frame.metrics.pedestrianCrossings > 0);
  assert.ok(frame.metrics.pedestrianCompleted > 0);
});

function sharedLandingFixture() {
  const checkpoint = JSON.parse(createTrafficSimulation({ seed: 2026, policy: 'fixed' }).serialize());
  const older = checkpoint.payload.pedestrians.find(person => person.id === 48);
  const later = checkpoint.payload.pedestrians.find(person => person.id === 1);
  Object.assign(older, { route: [61, 62], nextRoute: [62, 63, 60], edge: 0, position: 1.4,
    cornerFrom: null, cornerProgress: 0, speed: 0, waiting: true });
  Object.assign(later, { route: [63, 62], nextRoute: [62, 61, 60], edge: 0, position: 0,
    cornerFrom: null, cornerProgress: 0, speed: 0, waiting: true });
  Object.assign(checkpoint.payload.signals[15], { stage: 3, started: 0, deadline: 90, reservation: null });
  return checkpoint;
}

test('an older eligible citizen gets a shared landing before a later lower-ID arrival', () => {
  // Both real walking lanes end at the same outer corner. Citizen 48 reaches
  // the curb first; citizen 1 reaches the other curb while the same red holds.
  // No speed threshold or aggregate journey count can substitute for service
  // order here: the first usable walk window must serve the earlier request.
  const checkpoint = sharedLandingFixture();
  const simulation = TrafficSimulation.restore(resignCheckpoint(checkpoint));
  simulation.step(89);
  const staged = JSON.parse(simulation.serialize()).payload;
  for (const id of [1, 48]) {
    const person = staged.pedestrians.find(candidate => candidate.id === id);
    assert.equal(person.position, 1.4, `citizen ${id} must be physically staged before the same walk window`);
    assert.equal(person.speed, 0);
  }
  assert.ok(staged.pedestrians.find(person => person.id === 48).requestTick
    < staged.pedestrians.find(person => person.id === 1).requestTick, 'the tested arrivals must have distinct persistent ages');
  const restored = TrafficSimulation.restore(simulation.serialize());
  simulation.step();
  restored.step();
  const admitted = JSON.parse(simulation.serialize()).payload;
  assert.equal(admitted.signals[15].stage, 4);
  assert.equal(admitted.cornerOwners[62], 48, 'a later lower ID must not bypass the older eligible landing request');
  assert.ok(simulation.snapshot().pedestrians.find(person => person.id === 48).crossing);
  assert.equal(simulation.serialize(), restored.serialize(), 'waiting priority must survive a real checkpoint');
});

test('equal-age corner requests clear an occupied far-side refuge before reserving a new landing', () => {
  const checkpoint = sharedLandingFixture();
  checkpoint.payload.pedestrians.find(person => person.id === 48).position = 16.2;
  checkpoint.payload.pedestrians.find(person => person.id === 1).position = 1.4;
  Object.assign(checkpoint.payload.signals[15], { stage: 4, deadline: 450 });
  const simulation = TrafficSimulation.restore(resignCheckpoint(checkpoint));
  simulation.step();
  const state = JSON.parse(simulation.serialize()).payload;
  assert.equal(state.cornerOwners[62], 48, 'clear the citizen already beside the shared corner when request ages tie');
  assert.ok(state.pedestrians.find(person => person.id === 48).position > 16.2);
  assert.equal(state.pedestrians.find(person => person.id === 1).position, 1.4);
});

test('yielding a blocked far-side corner preserves request age through restore and later service', () => {
  const checkpoint = sharedLandingFixture();
  checkpoint.payload.pedestrians.find(person => person.id === 48).position = 16.2;
  checkpoint.payload.cornerOwners[62] = 48;
  const blocker = checkpoint.payload.pedestrians.find(person => person.id === 2);
  Object.assign(blocker, { route: [62, 63], nextRoute: [63, 60], edge: 0, position: 1.4,
    cornerFrom: null, cornerProgress: 0, speed: 0, waiting: true });
  const simulation = TrafficSimulation.restore(resignCheckpoint(checkpoint));
  simulation.step(60);
  const waiting = JSON.parse(simulation.serialize()).payload;
  assert.equal(waiting.pedestrians.find(person => person.id === 48).requestTick, 1);
  assert.equal(waiting.cornerOwners[62], null, 'the blocked refuge must release its corner without losing its request');
  const restored = TrafficSimulation.restore(simulation.serialize());
  let served = false;
  for (let ticks = 0; ticks < 600; ticks++) {
    simulation.step(); restored.step();
    const state = JSON.parse(simulation.serialize()).payload;
    const person = state.pedestrians.find(candidate => candidate.id === 48);
    if (person.route[person.edge] !== 61) { served = true; break; }
    assert.equal(person.requestTick, 1, 'crossing, yielding and reacquiring must not reset the waiting episode');
  }
  assert.ok(served, 'the waiting citizen must eventually pass the real corner');
  assert.equal(simulation.serialize(), restored.serialize());
});

test('restore validates pending citizen request ages and approach relationships atomically', () => {
  const simulation = createTrafficSimulation({ seed: 2026 });
  simulation.step(600);
  const checkpoint = JSON.parse(simulation.serialize());
  const waiting = checkpoint.payload.pedestrians.find(person => person.requestTick !== null && person.edgeEnteredTick > 0);
  const walking = checkpoint.payload.pedestrians.find(person => person.requestTick === null);
  assert.ok(waiting && walking, 'the fixture must include both a pending approach and an unrelated walking edge');
  const recipient = createTrafficSimulation({ seed: 17 });
  const unchanged = recipient.serialize();
  const mutations = [
    state => { state.pedestrians.find(person => person.id === waiting.id).requestTick = state.tick + 1; },
    state => { state.pedestrians.find(person => person.id === waiting.id).requestTick = waiting.edgeEnteredTick - 1; },
    state => { state.pedestrians.find(person => person.id === waiting.id).requestTick = null; },
    state => { state.pedestrians.find(person => person.id === walking.id).requestTick = state.tick; },
  ];
  for (const mutate of mutations) {
    const invalid = structuredClone(checkpoint);
    mutate(invalid.payload);
    assert.throws(() => recipient.restore(resignCheckpoint(invalid)), error => error.code === 'INVALID_STATE');
    assert.equal(recipient.serialize(), unchanged, 'an invalid fairness history must not replace the recipient');
  }
});

test('palette random draws are isolated from traffic and citizen decisions', () => {
  const original = createTrafficSimulation({ seed: 410 });
  original.step(900);
  const checkpoint = JSON.parse(original.serialize());
  checkpoint.payload.rng.palette = (checkpoint.payload.rng.palette ^ 0x55aa55aa) >>> 0 || 1;
  const altered = TrafficSimulation.restore(resignCheckpoint(checkpoint));
  original.step(900);
  altered.step(900);
  const withoutColors = snapshot => ({ ...snapshot,
    vehicles: snapshot.vehicles.map(({ color, ...vehicle }) => vehicle),
    pedestrians: snapshot.pedestrians.map(({ color, ...person }) => person),
  });
  assert.deepEqual(withoutColors(altered.snapshot()), withoutColors(original.snapshot()));
});

test('demand, policy and a localized road incident have actual bounded effects', () => {
  const low = createTrafficSimulation({ seed: 84, demand: 0.25, policy: 'fixed' });
  const high = createTrafficSimulation({ seed: 84, demand: 2, policy: 'adaptive' });
  low.step(1800);
  high.step(1800);
  assert.ok(high.snapshot().metrics.generated > low.snapshot().metrics.generated);
  assert.notDeepEqual(low.snapshot().signals, high.snapshot().signals);
  high.command({ type: 'toggle-incident' });
  let sawRestrictedVehicle = false;
  for (let tick = 0; tick < 9000; tick += 15) {
    high.step(15);
    const frame = high.snapshot();
    for (const vehicle of frame.vehicles) {
      if (vehicle.laneId === 'j5>j6' && vehicle.laneProgress > 4 && vehicle.laneProgress < 20) {
        sawRestrictedVehicle = true;
        assert.ok(vehicle.speed <= 3.01, 'roadworks must physically slow their lane');
      }
    }
    assert.ok(frame.vehicles.length <= TRAFFIC_LIMITS.vehicles);
    assert.ok(frame.pedestrians.length <= TRAFFIC_LIMITS.pedestrians);
    assert.ok(frame.metrics.pending <= TRAFFIC_LIMITS.pending);
    assert.ok(frame.events.length <= TRAFFIC_LIMITS.events);
    assert.equal(frame.metrics.generated,
      frame.metrics.active + frame.metrics.pending + frame.metrics.completed + frame.metrics.rejected);
  }
  assert.ok(sawRestrictedVehicle, 'the incident scenario must exercise its restricted road');
  assert.ok(high.serialize().length < 1_000_000, 'checkpoints must remain bounded');
});

test('sustained excess demand keeps completing trips and recovers blocked receiving lanes', t => {
  for (const seed of [1, 42, 0xffffffff]) {
    const simulation = createTrafficSimulation({ seed, demand: 2 });
    let previous = 0;
    for (let minute = 1; minute <= 12; minute++) {
      if (minute === 5) simulation.command({ type: 'toggle-incident' });
      simulation.step(1800);
      const frame = simulation.snapshot();
      if (minute >= 3) assert.ok(frame.metrics.completed > previous,
        `seed ${seed} must continue completing real trips in high-demand minute ${minute}`);
      previous = frame.metrics.completed;
    }
    const state = JSON.parse(simulation.serialize()).payload;
    const maxStall = Math.max(...state.vehicles.map(vehicle => state.tick - vehicle.lastProgressTick)) / 30;
    assert.ok(maxStall < 180, `seed ${seed}: blocked drivers must find progress within 180 simulated seconds`);
    assert.ok(simulation.snapshot().metrics.reroutes > 0, 'the scenario must exercise actual detours');
    assert.equal(state.totals.generated,
      state.vehicles.length + state.pending.length + state.totals.completed + state.totals.rejected);
    t.diagnostic(JSON.stringify({ seed, completed: state.totals.completed, reroutes: state.totals.reroutes,
      maxStallSeconds: maxStall, active: state.vehicles.length, pending: state.pending.length,
      flow: simulation.snapshot().metrics.flow }));
  }
});
