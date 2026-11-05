'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { simulation: { createTrafficSimulation }, network: { walkEdge, pointOnWalk }, buildDirectory } = require('./authority.cjs');
const scenario = process.argv[2];
if (!['default', 'high'].includes(scenario)) throw new Error('Choose default or high');
const options = scenario === 'high' ? { seed: 2026, demand: 2, policy: 'fixed' } : { seed: 2026 };
const observed = createTrafficSimulation(options);
const plain = createTrafficSimulation(options);
const result = {
  scenario, options, buildDirectory, ticks: 27000,
  method: 'Read-only runtime observer wraps moveCitizens and records every non-null corner-owner write, including same-tick release/regrant; independent eligibility oracle reads actual pre-movement geometry and post-signal-update state. A second uninstrumented production run must serialize identically each minute.',
  grants: 0, contestedGrants: 0, sameTickReleaseAndGrants: 0, contestedSameTickReleaseAndGrants: 0,
  olderHigherIdWins: 0, tieClearanceWins: 0, releasesWithPendingAge: 0,
  preservedAgesAcrossTicks: 0, preservedAgesAcrossRelease: 0, newApproaches: 0,
  olderEligibleBypasses: [], wrongTieBreaks: [], invalidGrants: [], unexpectedAgeChanges: [],
  examples: { olderHigherId: [], releaseAndGrant: [], tieClearance: [], trackedCitizens: [] },
  serializationChecks: [], longestStationary: [], stationaryOver60: 0, stationaryOver120: 0,
  sampledStationaryOver60: 0, sampledStationaryOver120: 0, sampledLongest: [],
  oldHighCitizen20Interval: { start: 7032, end: 18387, movedDuring: false, longestStop: 0 },
  oldDefaultCitizen44Interval: { start: 12570, end: 19680, movedDuring: false, longestStop: 0 }
};
const GATE = 1.4, SPACING = .84, EPSILON = .000001;
function edgeOf(p) { return walkEdge(p.route[p.edge], p.route[p.edge + 1]); }
function describe(p) {
  const edge = edgeOf(p);
  return { id: p.id, since: p.requestTick, entered: p.edgeEnteredTick, from: edge.from, to: edge.to,
    position: p.position, cornerFrom: p.cornerFrom, next: p.edge + 2 < p.route.length ? p.route[p.edge + 2] : p.nextRoute[1] };
}
function point(p) {
  const outgoing = edgeOf(p);
  if (p.cornerFrom === null) return pointOnWalk(outgoing, p.position);
  const incoming = walkEdge(p.cornerFrom, outgoing.from);
  const a = pointOnWalk(incoming, incoming.length), b = pointOnWalk(outgoing, 0);
  const d = Math.hypot(b.x - a.x, b.z - a.z);
  if (d < EPSILON) return b;
  const f = Math.min(1, p.cornerProgress / d);
  return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f };
}
function clearanceRank(p, owners) {
  const edge = edgeOf(p);
  if (p.cornerFrom !== null || p.position >= edge.length - GATE - EPSILON || owners[edge.from] === p.id) return 0;
  return edge.crossing && p.position > GATE + EPSILON && p.position < edge.length - GATE - EPSILON ? 1 : 2;
}
function eligibleAt(p, corner, s, initialPoints) {
  if (p.requestTick === null || p.cornerFrom !== null) return false;
  const edge = edgeOf(p);
  if (edge.to !== corner) return false;
  if (edge.crossing && p.position <= GATE + EPSILON) {
    const signal = s.signals[edge.junction];
    const roadTicks = Math.ceil((edge.length - 2 * GATE) / p.desiredSpeed * 30) + 3;
    if (signal.stage !== 4 || signal.reservation !== null || signal.deadline - s.tick < roadTicks) return false;
    const landing = pointOnWalk(edge, edge.length - GATE);
    return s.pedestrians.every(q => q.id === p.id || Math.hypot(landing.x - initialPoints.get(q.id).x, landing.z - initialPoints.get(q.id).z) >= SPACING);
  }
  const next = p.edge + 2 < p.route.length ? p.route[p.edge + 2] : p.nextRoute[1];
  return s.pedestrians.every(q => q.id === p.id || q.route[q.edge] !== corner || q.route[q.edge + 1] !== next || q.position >= GATE + SPACING + .1);
}
function keep(array, item, limit = 20) { if (array.length < limit) array.push(item); }
const moveCitizens = observed.moveCitizens;
observed.moveCitizens = function () {
  const s = this.state, owners = s.cornerOwners;
  const before = new Map(s.pedestrians.map(p => [p.id, describe(p)]));
  const initialPoints = new Map(s.pedestrians.map(p => [p.id, point(p)]));
  const released = new Map();
  s.cornerOwners = new Proxy(owners, { set(target, property, value) {
    const corner = Number(property), old = target[property];
    if (Number.isInteger(corner) && corner >= 0 && corner < 64 && value !== old) {
      if (value === null && old !== null) {
        const person = s.pedestrians.find(p => p.id === old);
        released.set(corner, { owner: old, age: person.requestTick, approach: describe(person) });
        if (person.requestTick !== null) result.releasesWithPendingAge++;
      } else if (value !== null) {
        result.grants++;
        const claimant = s.pedestrians.find(p => p.id === value);
        const candidates = s.pedestrians.filter(p => eligibleAt(p, corner, s, initialPoints))
          .sort((a, b) => a.requestTick - b.requestTick || clearanceRank(a, owners) - clearanceRank(b, owners) || a.id - b.id);
        const record = { tick: s.tick, corner, served: describe(claimant), eligible: candidates.map(describe), previousOwner: released.get(corner) ?? null };
        if (old !== null || !candidates.some(p => p.id === value)) keep(result.invalidGrants, record);
        if (candidates.length >= 2) result.contestedGrants++;
        if (released.has(corner)) {
          result.sameTickReleaseAndGrants++;
          if (candidates.length >= 2) result.contestedSameTickReleaseAndGrants++;
          keep(result.examples.releaseAndGrant, record);
        }
        if (candidates.some(p => p.requestTick < claimant.requestTick)) keep(result.olderEligibleBypasses, record, 100);
        if (candidates.length && candidates[0].id !== value && candidates[0].requestTick === claimant.requestTick) keep(result.wrongTieBreaks, record, 100);
        if (candidates.some(p => p.id < value && p.requestTick > claimant.requestTick)) {
          result.olderHigherIdWins++;
          keep(result.examples.olderHigherId, record);
        }
        if (candidates.some(p => p.requestTick === claimant.requestTick && clearanceRank(p, owners) > clearanceRank(claimant, owners))) {
          result.tieClearanceWins++; keep(result.examples.tieClearance, record);
        }
        if ([20, 31, 44].includes(value)) keep(result.examples.trackedCitizens, record, 150);
      }
    }
    target[property] = value;
    return true;
  }});
  try { moveCitizens.call(this); }
  finally { s.cornerOwners = owners; }
  for (const p of s.pedestrians) {
    const prior = before.get(p.id), now = describe(p);
    const sameApproach = prior.entered === now.entered && prior.from === now.from && prior.to === now.to;
    if (sameApproach && prior.since !== null) {
      result.preservedAgesAcrossTicks++;
      if (p.requestTick !== prior.since) keep(result.unexpectedAgeChanges, { tick: s.tick, before: prior, after: now });
    }
    if (!sameApproach) {
      result.newApproaches++;
      if (p.edgeEnteredTick !== s.tick || p.requestTick !== null) keep(result.unexpectedAgeChanges, { tick: s.tick, kind: 'transition', before: prior, after: now });
    }
    for (const release of released.values()) if (release.owner === p.id && release.age !== null && sameApproach) {
      if (p.requestTick === release.age) result.preservedAgesAcrossRelease++;
      else keep(result.unexpectedAgeChanges, { tick: s.tick, kind: 'release', release, after: now });
    }
  }
};
const progress = new Map(observed.snapshot().pedestrians.map(p => [p.id, { x: p.x, z: p.z, start: null, longest: null, sampleX: p.x, sampleZ: p.z, sampleStart: null, sampleLongest: null }]));
function closeStop(id, p, end, sampled = false, ongoing = false) {
  const field = sampled ? 'sampleStart' : 'start', longestField = sampled ? 'sampleLongest' : 'longest';
  if (p[field] === null) return;
  const duration = end - p[field] + 1, seconds = duration / (sampled ? 1 : 30);
  const interval = { id, start: p[field], end, seconds, ongoing };
  if (!p[longestField] || seconds > p[longestField].seconds) p[longestField] = interval;
  if (seconds > 60) result[sampled ? 'sampledStationaryOver60' : 'stationaryOver60']++;
  if (seconds > 120) result[sampled ? 'sampledStationaryOver120' : 'stationaryOver120']++;
  p[field] = null;
}
for (let tick = 1; tick <= result.ticks; tick++) {
  const command = scenario !== 'high' ? null : tick === 1801 || tick === 7201 ? { type: 'toggle-incident' }
    : tick === 12601 ? { type: 'set-policy', value: 'adaptive' } : tick === 19801 ? { type: 'set-demand', value: .25 } : null;
  if (command) { observed.command(command); plain.command(command); }
  observed.step(); plain.step();
  const frame = observed.snapshot();
  for (const person of frame.pedestrians) {
    const p = progress.get(person.id);
    const stationary = Math.hypot(person.x - p.x, person.z - p.z) < EPSILON;
    if (stationary) p.start ??= tick; else closeStop(person.id, p, tick - 1);
    if (scenario === 'high' && person.id === 20 && tick >= 7032 && tick <= 18387 && !stationary) result.oldHighCitizen20Interval.movedDuring = true;
    if (scenario === 'default' && person.id === 44 && tick >= 12570 && tick <= 19680 && !stationary) result.oldDefaultCitizen44Interval.movedDuring = true;
    p.x = person.x; p.z = person.z;
    if (tick % 30 === 0) {
      const sampledStationary = Math.hypot(person.x - p.sampleX, person.z - p.sampleZ) < .001;
      if (sampledStationary) p.sampleStart ??= tick / 30; else closeStop(person.id, p, tick / 30 - 1, true);
      p.sampleX = person.x; p.sampleZ = person.z;
    }
  }
  if (tick % 1800 === 0) {
    const identical = observed.serialize() === plain.serialize();
    result.serializationChecks.push({ tick, identical });
    assert.equal(identical, true, `runtime observation must not change production behavior at tick ${tick}`);
  }
}
for (const [id, p] of progress) {
  closeStop(id, p, result.ticks, false, true);
  closeStop(id, p, result.ticks / 30, true, true);
  if (p.longest) result.longestStationary.push(p.longest);
  if (p.sampleLongest) result.sampledLongest.push(p.sampleLongest);
}
result.longestStationary.sort((a, b) => b.seconds - a.seconds);
result.sampledLongest.sort((a, b) => b.seconds - a.seconds);
result.oldHighCitizen20Interval.longestStop = progress.get(20).longest;
result.oldDefaultCitizen44Interval.longestStop = progress.get(44).longest;
result.finalMetrics = observed.snapshot().metrics;
result.configHash = JSON.parse(observed.serialize()).configHash;
result.pass = !result.olderEligibleBypasses.length && !result.wrongTieBreaks.length && !result.invalidGrants.length
  && !result.unexpectedAgeChanges.length && result.contestedGrants > 0 && result.olderHigherIdWins > 0
  && result.preservedAgesAcrossRelease > 0 && result.serializationChecks.every(p => p.identical);
fs.writeFileSync(`${__dirname}/independent-allocation-${scenario}.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ...result, examples: Object.fromEntries(Object.entries(result.examples).map(([k, v]) => [k, v.slice(0, 2)])), longestStationary: result.longestStationary.slice(0, 5), sampledLongest: result.sampledLongest.slice(0, 5) }, null, 2));
process.exitCode = result.pass ? 0 : 1;
