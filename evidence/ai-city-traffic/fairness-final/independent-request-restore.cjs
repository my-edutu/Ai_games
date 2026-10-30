'use strict';
const fs = require('node:fs');
const { simulation: { createTrafficSimulation, TrafficSimulation }, network: { walkEdge }, buildDirectory } = require('./authority.cjs');
function sign(envelope) {
  const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
    : value !== null && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
  const { checksum, ...body } = envelope;
  let h = 2166136261;
  for (const c of canonical(body)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return JSON.stringify({ ...body, checksum: (h >>> 0).toString(16).padStart(8, '0') });
}
const result = { buildDirectory, malformed: [], genuine: [], fixtures: {}, scannedTicks: 0 };
const source = createTrafficSimulation({ seed: 2026 });
source.step(600);
const fixture = JSON.parse(source.serialize());
const waiting = fixture.payload.pedestrians.find(p => p.requestTick !== null && p.edgeEnteredTick > 0);
const walking = fixture.payload.pedestrians.find(p => p.requestTick === null && p.cornerFrom === null);
const connecting = fixture.payload.pedestrians.find(p => p.cornerFrom !== null);
if (!waiting || !walking || !connecting) throw new Error('Missing intended fixture states');
result.fixtures = { waiting, walking, connecting, tick: fixture.payload.tick };
const recipient = createTrafficSimulation({ seed: 881 }); recipient.step(127);
function reject(name, mutate, expectedCode = 'INVALID_STATE') {
  const changed = structuredClone(fixture);
  mutate(changed.payload, changed);
  const before = recipient.serialize();
  let accepted = true, code = null, error = null;
  try { recipient.restore(sign(changed)); } catch (e) { accepted = false; code = e.code; error = e.message; }
  result.malformed.push({ name, expectedCode, accepted, code, error, atomic: recipient.serialize() === before });
}
const p = (state, id) => state.pedestrians.find(x => x.id === id);
reject('missing_edge_entered_tick', s => { delete p(s, waiting.id).edgeEnteredTick; });
reject('missing_request_tick', s => { delete p(s, waiting.id).requestTick; });
reject('negative_edge_entered_tick', s => { p(s, waiting.id).edgeEnteredTick = -1; });
reject('future_edge_entered_tick', s => { p(s, waiting.id).edgeEnteredTick = s.tick + 1; });
reject('fractional_edge_entered_tick', s => { p(s, waiting.id).edgeEnteredTick = .5; });
reject('nonnumeric_edge_entered_tick', s => { p(s, waiting.id).edgeEnteredTick = '0'; });
reject('future_request_tick', s => { p(s, waiting.id).requestTick = s.tick + 1; });
reject('negative_request_tick', s => { p(s, waiting.id).requestTick = -1; });
reject('fractional_request_tick', s => { p(s, waiting.id).requestTick += .5; });
reject('nonnumeric_request_tick', s => { p(s, waiting.id).requestTick = String(waiting.requestTick); });
reject('request_predates_current_edge', s => { p(s, waiting.id).requestTick = waiting.edgeEnteredTick - 1; });
reject('edge_entered_after_request', s => { p(s, waiting.id).edgeEnteredTick = waiting.requestTick + 1; });
reject('pending_approach_has_no_age', s => { p(s, waiting.id).requestTick = null; });
reject('unrelated_walking_edge_has_request', s => { p(s, walking.id).requestTick = s.tick; });
reject('connector_has_previous_approach_request', s => { p(s, connecting.id).requestTick = s.tick; });
reject('old_pre_fairness_config_is_incompatible', (s, envelope) => { envelope.configHash = '4127a5e0'; }, 'VERSION_MISMATCH');

const scan = createTrafficSimulation({ seed: 2026 });
const seen = new Set(), continuations = [];
function checkpoint(name, extra = {}) {
  if (seen.has(name)) return;
  seen.add(name);
  const serialized = scan.serialize();
  const entry = { name, tick: scan.state.tick, accepted: false, equalAtRestore: false, continuationTicks: 180, ...extra };
  try {
    const clone = TrafficSimulation.restore(serialized);
    entry.accepted = true; entry.equalAtRestore = clone.serialize() === serialized;
    continuations.push({ clone, until: scan.state.tick + 180, entry });
  } catch (e) { entry.code = e.code; entry.error = e.message; }
  result.genuine.push(entry);
}
checkpoint('initial_null_ages_are_valid');
for (let tick = 1; tick <= 12000; tick++) {
  const previous = new Map(scan.state.pedestrians.map(p => [p.id, { entered: p.edgeEnteredTick, request: p.requestTick, from: p.route[p.edge], to: p.route[p.edge + 1], owner: scan.state.cornerOwners[p.route[p.edge + 1]] }]));
  scan.step();
  for (const item of continuations) item.clone.step();
  for (let i = continuations.length - 1; i >= 0; i--) if (continuations[i].until === tick) {
    const item = continuations[i];
    item.entry.equalAfterContinuation = item.clone.serialize() === scan.serialize();
    continuations.splice(i, 1);
  }
  const s = scan.state;
  for (const person of s.pedestrians) {
    const edge = walkEdge(person.route[person.edge], person.route[person.edge + 1]);
    const prior = previous.get(person.id);
    if (person.requestTick !== null && edge.crossing && person.position <= 1.400001)
      checkpoint('persisted_near_curb_request', { id: person.id, requestTick: person.requestTick });
    if (person.requestTick !== null && edge.crossing && person.position > 1.400001 && person.position < edge.length - 1.400001)
      checkpoint('in_road_request_and_landing', { id: person.id, requestTick: person.requestTick });
    if (person.requestTick !== null && edge.crossing && person.position >= edge.length - 1.400001
      && prior.owner === person.id && s.cornerOwners[edge.to] !== person.id && person.edgeEnteredTick === prior.entered
      && person.requestTick === prior.request)
      checkpoint('safely_released_far_refuge_keeps_age', { id: person.id, requestTick: person.requestTick, corner: edge.to });
    if (person.cornerFrom !== null && person.edgeEnteredTick === tick && person.requestTick === null)
      checkpoint('connector_enters_new_approach_with_reset_age', { id: person.id, edgeEnteredTick: person.edgeEnteredTick });
    if (person.requestTick !== null && s.pedestrians.some(q => q.id !== person.id && q.requestTick !== null && q.requestTick !== person.requestTick && q.route[q.edge + 1] === edge.to))
      checkpoint('competing_distinct_persistent_request_ages', { id: person.id, requestTick: person.requestTick, corner: edge.to });
  }
  result.scannedTicks = tick;
  if (seen.size === 6 && continuations.length === 0) break;
}
result.pass = result.malformed.every(x => !x.accepted && x.code === x.expectedCode && x.atomic)
  && seen.size === 6 && result.genuine.every(x => x.accepted && x.equalAtRestore && x.equalAfterContinuation);
fs.writeFileSync(`${__dirname}/independent-request-restore.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
