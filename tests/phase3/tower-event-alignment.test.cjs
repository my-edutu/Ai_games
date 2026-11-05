'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { indexTowerCaptureEvents } = require('../../scripts/tower-event-alignment.cjs');

function source(tick, changes = {}) {
  return { atMs: 1000 + tick * 50, runToken: 'run-a', tick, floor: 8,
    lifecycle: 'running', routeTarget: 'f8:p2',
    guardians: [{ id: 'f8:guardian', active: true, health: 8 }],
    scheduledHazardCharges: [], movingDecks: [{id:'f8:p3', x:200,y:350}],
    result: null, ...changes };
}

test('event index locates real route, hazard, HP, defeat and floor progression without inventing a film win', () => {
  const ticks = [
    source(1),
    source(2, {routeTarget:'f8:p3',movingDecks:[{id:'f8:p3',x:205,y:350}]}),
    source(3, {routeTarget:'f8:p3',guardians:[{id:'f8:guardian',active:true,health:6}],
      scheduledHazardCharges:[{id:'f8:crusher',chargeTicksRemaining:12}]}),
    source(4, {routeTarget:'f8:p3',guardians:[{id:'f8:guardian',active:false,health:0}]}),
    source(5, {floor:9, guardians:[],routeTarget:'f9:p1'}),
  ];
  const frozen = JSON.stringify(ticks);
  const result = indexTowerCaptureEvents(ticks, [{atMs:1000, tick:1}], {
    sourceSha:'abc', scenario:'danger',viewport:{width:960,height:600},seed:'same',
  });
  for (const kind of ['route-selection','hazard-charge-begin','guardian-hp-decrease',
    'guardian-source-defeated','floor-transition','observed-moving-deck-position-change']) {
    assert.ok(result.events.some(e => e.kind === kind), kind);
  }
  assert.equal(result.events.find(e=>e.kind==='floor-transition').toFloor,9);
  assert.equal(result.baselineCandidateEventMatched,false);
  assert.equal(result.verdict,'NOT EVALUATED');
  assert.match(result.videoClockCalibration,/NOT EVALUATED/);
  assert.equal(JSON.stringify(ticks), frozen, 'never modify source samples');
});
test('source guardian disappearing or a run rollover never fabricates death or victory', () => {
  const result = indexTowerCaptureEvents([source(1),
    source(2,{guardians:[]}),source(3,{guardians:[]}),
    source(0,{runToken:'run-b',floor:0,guardians:[]})],[]);
  assert.equal(result.events.some(e=>e.kind==='guardian-source-defeated'),false);
  assert.equal(result.eventCounts['source-run-token-change'],1);
  assert.equal(result.eventCounts['floor-transition'] || 0,0);
});
test('source gaps, stale and out-of-order frames are disclosed, not marked event matching', () => {
  const result=indexTowerCaptureEvents([source(1),source(1),source(5),
    source(4),source(6)], []);
  assert.equal(result.repeatedPublicTickSamples,1);
  assert.equal(result.outOfOrderSamples,1);
  assert.equal(result.unobservedFixedStepTicks,3);
  assert.equal(result.sourceTicksObserved,3);
});
test('recorded outcome is a source phase, not a displayed result card', () => {
  const result=indexTowerCaptureEvents([
    source(9,{floor:0,guardians:[]}),
    source(10,{floor:0,guardians:[],lifecycle:'intermission',
      result:{kind:'game',reason:'health-depleted'}}),
    source(11,{floor:0,guardians:[],lifecycle:'intermission',
      result:{kind:'game',reason:'health-depleted'}}),
    source(0,{runToken:'run-b',floor:0,guardians:[]}),
  ],[]);
  assert.equal(result.eventCounts['source-result-phase'],1);
  assert.equal(result.eventCounts['source-run-token-change'],1);
  assert.ok(result.events.find(e=>e.kind==='source-result-phase')
    .interpretation.includes('NOT verified'));
});
test('missing or corrupted source observations cannot earn fabricated evidence', () => {
  const empty=indexTowerCaptureEvents(null, [{atMs:1000}], {});
  assert.equal(empty.sourceTicksObserved,0);
  assert.equal(empty.events.length,0);
  assert.equal(empty.verdict,'NOT EVALUATED');
  const corrupt=indexTowerCaptureEvents([null,{atMs:NaN},source(2)],[]);
  assert.equal(corrupt.malformedSamples,2);
});
test('sampled rendered contacts remain distinct from authoritative physical crossings', () => {
  const o={atMs:1150,scene:'running',runToken:'run-a',floor:8,tick:3,
    observedPhysicalTouchdown:{physicalDeckContact:true,platformId:'f8:p3'}};
  const r=indexTowerCaptureEvents([source(2),source(3)],[o,o]);
  assert.equal(r.eventCounts['sampled-render-deck-contact'],1);
  assert.equal(r.eventCounts['floor-transition']||0,0);
  assert.ok(r.events.find(e=>e.kind==='sampled-render-deck-contact')
    .interpretation.includes('independent film review'));
});
