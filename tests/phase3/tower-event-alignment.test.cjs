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
    source(0,{runToken:'run-b',floor:0,guardians:[],atMs:1200})],[]);
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
    source(0,{runToken:'run-b',floor:0,guardians:[],atMs:1600}),
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

test('earned cap approach is sampled geometry, and a same-run floor-nine handoff is NOT visual crossing proof',()=>{
 const cap={id:'f8:cap',x:100000,y:700000,width:400000,height:16000};
 const p=x=>({x,y:cap.y+cap.height+18000,halfWidth:12000,halfHeight:18000,health:5});
 const dead={id:'guardian',active:false,health:0};
 const base={cap,player:p(350000),guardians:[dead],routeTarget:'f8:cap'};
 const ticks=[source(1,{...base,player:p(360000)}),
   source(2,{...base,player:p(401000)}),
   source(3,{...base,player:p(408000)}),
   source(4,{floor:9,cap:null,player:p(0),guardians:[],routeTarget:'f9:p0'})];
 const r=indexTowerCaptureEvents(ticks,[]);
 const arrival=r.events.find(e=>e.kind==='source-supported-gate-approach');
 const advance=r.events.find(e=>e.kind==='guardian-earned-floor-nine-handoff');
 assert.ok(arrival,'physical, defeated, supported cap approach');
 assert.ok(advance,'source earned floor transition observed after supported approach');
 assert.equal(arrival.observedEpisode,0);
 assert.equal(advance.observedEpisode,0);
 assert.equal(advance.precedingObservedClearanceGap,12000);
 assert.match(advance.interpretation,/no frame-visible/);
});
test('alive guardian, unsupported body, or different episode cannot invent earned source handoff',()=>{
 const cap={id:'f8:cap',x:100000,y:700000,width:400000,height:16000};
 const player={x:400000,y:cap.y+cap.height+18000,halfWidth:12000,halfHeight:18000,health:5};
 const bad=source(1,{cap,player,guardians:[{id:'guardian',active:true,health:2}]});
 const next=source(2,{floor:9,cap:null,guardians:[]});
 const unsupported=source(3,{cap,player:{...player,y:player.y+19000},guardians:[{id:'guardian',active:false,health:0}]});
 const another=source(0,{runToken:'second-run',floor:9,cap:null,guardians:[],atMs:1200});
 const r=indexTowerCaptureEvents([bad,next,unsupported,another],[]);
 assert.equal(r.events.some(e=>e.kind==='guardian-earned-floor-nine-handoff'),false);
 assert.equal(r.events.some(e=>e.kind==='source-supported-gate-approach'),false);
 assert.equal(r.events.find(e=>e.kind==='source-run-token-change').observedEpisode,1);
});

test('candidate source crossing is indexed without inventing visible video proof',()=>{
 const c={fromFloor:8,capId:'f8:cap',groundedPlatformId:'f8:cap',
   guardianId:'f8:guardian',exitX:252000,clearanceX:268000,crossingX:269000};
 const trace=source(42,{floor:9,sourceEvents:[
   {type:'floor-complete',floor:9,guardianPassage:c}]});
 const a=indexTowerCaptureEvents([source(41),source(42,{floor:9,guardians:[]})],[],
   {authoritativeTrace:[trace]});
 const crossing=a.events.find(e=>e.kind==='guardian-source-physical-threshold');
 assert.ok(crossing);
 assert.equal(crossing.physicalCrossingX,269000);
 assert.equal(crossing.observedEpisode,0);
 assert.match(crossing.interpretation,/NOT proof/);
 const b=indexTowerCaptureEvents([source(41),source(42,{floor:9})],[],
   {authoritativeTrace:[source(42,{floor:9,sourceEvents:[
     {type:'floor-complete',floor:9,guardianPassage:{...c,crossingX:267999}}
   ]})]});
 assert.equal(b.eventCounts['guardian-source-physical-threshold']||0,0);
});

test('source-authentic guardian/cap chain survives sparse browser polling',()=>{
 const cap={id:'f8:cap',x:100000,y:700000,width:400000,height:16000};
 const player=x=>({x,y:734000,halfWidth:12000,halfHeight:18000,health:5});
 const trace=[
  source(1,{player:player(380000),cap}),
  source(2,{player:player(380000),cap,guardians:[{id:'f8:guardian',active:true,health:6}]}),
  source(3,{player:player(380000),cap,guardians:[{id:'f8:guardian',active:false,health:0}]}),
  source(4,{player:player(400000),cap,guardians:[{id:'f8:guardian',active:false,health:0}]}),
  source(5,{player:player(413000),cap,guardians:[{id:'f8:guardian',active:false,health:0}]}),
  source(6,{floor:9,player:player(0),cap:null,guardians:[],sourceEvents:[{
   type:'floor-complete',floor:9,guardianPassage:{
    fromFloor:8,capId:'f8:cap',groundedPlatformId:'f8:cap',
    guardianId:'f8:guardian',exitX:404000,clearanceX:420000,crossingX:421000}}]})
 ];
 const sparse=[trace[0],trace[5]];
 const before=indexTowerCaptureEvents(sparse,[],{authoritativeTrace:[]});
 assert.equal(before.events.some(e=>e.kind==='guardian-source-defeated'),false);
 const after=indexTowerCaptureEvents(sparse,[],{authoritativeTrace:trace});
 for(const kind of ['guardian-hp-decrease','guardian-source-defeated',
   'source-supported-gate-approach','guardian-earned-floor-nine-handoff',
   'guardian-source-physical-threshold'])
    assert.ok(after.events.some(e=>e.kind===kind),kind);
 assert.equal(after.sourceWitnessMode,'original-host-fixed-step');
 assert.equal(after.verdict,'NOT EVALUATED');
});

test('source outcome carries two valid same-tick phases, not duplicate polls',()=>{
 const terminal={kind:'game',reason:'health-depleted'};
 const ticks=[
  source(10,{floor:0,guardians:[]}),
  source(10,{atMs:1510,floor:0,guardians:[],lifecycle:'result',result:terminal}),
  source(10,{atMs:1520,floor:0,guardians:[],lifecycle:'result',result:terminal}),
  source(10,{atMs:1540,floor:0,guardians:[],lifecycle:'intermission',result:terminal}),
  source(10,{atMs:1560,floor:0,guardians:[],lifecycle:'intermission',result:terminal}),
  source(0,{atMs:1600,floor:0,runToken:'run-b',guardians:[]}),
 ];
 const before=JSON.stringify(ticks),index=indexTowerCaptureEvents(ticks,[]);
 assert.deepEqual(index.events.filter(e=>e.kind==='source-result-phase').map(e=>e.phase),
  ['result','intermission']);
 assert.equal(index.sameTickLifecyclePhaseTransitions,2);
 assert.equal(index.repeatedPublicTickSamples,2);
 assert.equal(index.eventCounts['source-run-token-change'],1);
 assert.equal(index.verdict,'NOT EVALUATED');
 assert.equal(JSON.stringify(ticks),before);
});
test('same-tick lifecycle reversal cannot fabricate terminal source evidence',()=>{
 const terminal={kind:'game',reason:'fall'};
 const index=indexTowerCaptureEvents([
  source(10,{floor:0,guardians:[],lifecycle:'result',result:terminal}),
  source(10,{atMs:1510,floor:0,guardians:[],lifecycle:'running'}),
  source(10,{atMs:1520,floor:0,guardians:[],lifecycle:'intermission',result:terminal})
 ],[]);
 assert.equal(index.eventCounts['source-result-phase']||0,1);
 assert.equal(index.sameTickLifecyclePhaseTransitions,1);
 assert.equal(index.repeatedPublicTickSamples,1);
});
