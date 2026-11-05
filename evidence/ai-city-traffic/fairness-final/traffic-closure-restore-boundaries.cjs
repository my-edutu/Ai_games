'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { createTrafficSimulation, TrafficSimulation } = require('./authority.cjs').simulation;
const { buildTrip, roadLane } = require('./authority.cjs').network;
const results = { environment: { node: process.version }, malformed: [], genuine: [], scan: {} };
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
function sha(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
const clean = createTrafficSimulation({ seed: 17 });
clean.step(600);
const stable = clean.serialize();
const base = JSON.parse(stable);
const recipient = createTrafficSimulation({ seed: 88 });
recipient.step(91);
function bad(name, alter) {
  const fixture = JSON.parse(stable); alter(fixture.payload);
  const before = recipient.serialize();
  let accepted = true, code = null, error = null;
  try { recipient.restore(sign(fixture)); }
  catch (e) { accepted = false; code = e.code; error = e.message; }
  results.malformed.push({ name, accepted, code, error, atomic: recipient.serialize() === before });
}
bad('exact_100_legacy_completion_entries_with_3_total', s => { s.completions = Array.from({ length: 100 }, () => ({ tick: 600, travelTicks: 0, waitTicks: 0 })); });
bad('100_current_schema_completion_entries_with_3_total', s => { s.completions = Array.from({ length: 100 }, (_, i) => ({ ...base.payload.completions[i % base.payload.completions.length] })); });
bad('duplicate_completed_trip_id_with_valid_count', s => { s.completions[1] = { ...s.completions[1], id: s.completions[0].id }; });
bad('zero_travel_time_current_schema', s => { s.completions[0].travelTicks = 0; s.completions[0].bornTick = s.completions[0].tick; });
bad('wait_time_exceeds_trip_lifetime', s => { s.completions[0].waitTicks = s.completions[0].travelTicks + 1; });
bad('birth_time_disagrees_with_duration', s => { s.completions[0].bornTick++; });
bad('window_travel_sum_exceeds_lifetime_total', s => { s.totals.totalTravelTicks--; });
bad('initial_window_underaccounts_lifetime_travel', s => { s.totals.totalTravelTicks++; });
bad('completed_id_still_active', s => { s.completions[0].id = s.vehicles[0].id; });
bad('incoming_reservation_under_opposing_green', s => {
  const owner = s.vehicles.find(v => { const p = buildTrip(v.route).segments[v.segment]; return p.kind === 'lane' && p.junction !== null && s.signals[p.junction].reservation === null; });
  const part = buildTrip(owner.route).segments[owner.segment];
  const signal = s.signals[part.junction];
  signal.reservation = owner.id; signal.stage = part.approach === 'ns' ? 2 : 0; signal.started = 600; signal.deadline = 960;
});
const scan = createTrafficSimulation({ seed: 17 });
const seen = new Set();
const pending = [];
function addCase(name, tick, state) {
  if (seen.has(name)) return;
  seen.add(name);
  const serialized = scan.serialize();
  const item = { name, tick, accepted: false, identicalAtRestore: false, continuationTicks: 90,
    reservations: state.signals.filter(s => s.reservation !== null).length,
    cornerOwners: state.cornerOwners.filter(x => x !== null).length,
    completionWindow: state.completions.length, lifetimeCompleted: state.totals.completed,
    originalSha256: sha(serialized) };
  try {
    const clone = TrafficSimulation.restore(serialized);
    item.accepted = true; item.identicalAtRestore = clone.serialize() === serialized;
    pending.push({ clone, due: tick + 90, item });
  } catch (e) { item.error = e.message; item.code = e.code; }
  results.genuine.push(item);
}
try {
  for (let tick = 0; tick <= 3690; tick++) {
    if (tick) { scan.step(); for (const task of pending) task.clone.step(); }
    for (let i = pending.length - 1; i >= 0; i--) if (pending[i].due === tick) {
      const task = pending[i];
      task.item.identicalAfterContinuation = task.clone.serialize() === scan.serialize();
      task.item.continuedSha256 = sha(scan.serialize());
      pending.splice(i, 1);
    }
    if (tick > 3600) continue;
    const state = JSON.parse(scan.serialize()).payload;
    if (tick === 600) addCase('genuine_early_completion_window', tick, state);
    if (tick === 3600) addCase('genuine_truncated_completion_window', tick, state);
    if (state.pedestrians.some(p => p.cornerFrom !== null)) addCase('genuine_occupied_corner', tick, state);
    if (scan.snapshot().pedestrians.some(p => p.crossing)) addCase('genuine_pedestrian_in_road', tick, state);
    for (let junction = 0; junction < state.signals.length; junction++) {
      const signal = state.signals[junction];
      if (signal.reservation === null) continue;
      const driver = state.vehicles.find(v => v.id === signal.reservation);
      const part = buildTrip(driver.route).segments[driver.segment];
      const place = part.kind === 'junction' ? 'junction' : roadLane(part.laneId).from === junction ? 'outgoing_tail' : 'incoming';
      const phase = signal.stage % 2 === 1 ? 'clearance' : 'green';
      addCase(`genuine_${place}_${phase}_reservation`, tick, state);
    }
  }
  results.scan = { seed: 17, ticks: 3690, finalMetrics: scan.snapshot().metrics };
} catch (e) { results.scan.error = { message: e.message, code: e.code }; }
results.pass = results.malformed.every(x => !x.accepted && x.code === 'INVALID_STATE' && x.atomic)
  && results.genuine.length >= 9 && results.genuine.every(x => x.accepted && x.identicalAtRestore && x.identicalAfterContinuation)
  && !results.scan.error;
fs.writeFileSync(__dirname + '/traffic-closure-restore-boundaries-results.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
process.exitCode = results.pass ? 0 : 1;
