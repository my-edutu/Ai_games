'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const load=()=>import('../../public/infinite-tower-climb/visuals/first-f9-return-search-budget.mjs');
const source={floor:9,theme:'void',lifecycle:'running',
  runToken:'authentic-run',tick:476,player:{health:4}};
const held={runToken:source.runToken,floor:9,
  guardianGateRetained:true,verifiedObservedFloorAdvance:true,
  oldCapId:'f8:cap',crossingTick:475};
const lens={sourceBound:true,coldOriginalArch:true,sourceTick:476};
const previous={runToken:source.runToken,floor:8,tick:474};
const options={camera:'follow',stale:false,reducedMotion:false};
test('one original grounded gateway cold frame limits both costly camera searches without skipping safety',async()=>{
  const {firstF9ReturnedGatewaySearchBudget:budget}=await load();
  const result=budget(source,held,lens,previous,options);
  assert.equal(result.sourceBound,true);
  assert.equal(result.sourceTick,476);
  assert.equal(result.deckTrialLimit,3);
  assert.equal(result.doorwayTrialLimit,2);
  assert.ok(Object.isFrozen(result));
});
test('after one actual returned F9 frame, full camera search automatically resumes',async()=>{
  const {firstF9ReturnedGatewaySearchBudget:budget}=await load();
  assert.equal(budget(source,held,lens,{...previous,floor:9},options),null);
  assert.equal(budget(source,held,lens,{...previous,runToken:'restart'},options),null);
  assert.equal(budget({...source,tick:473},held,{...lens,sourceTick:473},previous,options),null);
  assert.equal(budget({...source,runToken:'restart'},held,lens,previous,options),null);
});
test('manual, stale, reduced-motion, inactive HP or unearned old door NEVER get cold lens budget',async()=>{
  const {firstF9ReturnedGatewaySearchBudget:budget}=await load();
  assert.equal(budget(source,held,lens,previous,{...options,camera:'orbit'}),null);
  assert.equal(budget(source,held,lens,previous,{...options,reducedMotion:true}),null);
  assert.equal(budget(source,held,lens,previous,{...options,stale:true}),null);
  assert.equal(budget(source,{...held,guardianGateRetained:false},lens,previous,options),null);
  assert.equal(budget(source,{...held,verifiedObservedFloorAdvance:false},lens,previous,options),null);
  assert.equal(budget(source,held,{...lens,sourceBound:false},previous,options),null);
  assert.equal(budget({...source,player:{health:0}},held,lens,previous,options),null);
  assert.equal(budget({...source,floor:10},held,lens,previous,options),null);
});
test('two independent search ladders retain original and spatially spread physical candidates',async()=>{
  const {sampleColdFirstReturnGatewayTrials:sample}=await load();
  const deck=Array.from({length:8},(_,i)=>Object.freeze([i,i/2,0]));
  const optics=Array.from({length:6},(_,i)=>Object.freeze([i,0,0]));
  assert.deepEqual(sample(deck,3).map(x=>x[0]),[0,4,7]);
  assert.deepEqual(sample(optics,2).map(x=>x[0]),[0,5]);
  assert.equal(deck.length,8);
  assert.equal(sample(deck,8),deck);
  assert.deepEqual(sample([],3),[]);
  assert.deepEqual(sample(deck,1),[deck[0]]);
});
test('the real scene preserves each pre-existing hero/core/deck/steel ray gate when sampling cold camera trials',()=>{
  const scene=fs.readFileSync('public/infinite-tower-climb/visuals/scene.mjs','utf8');
  assert.match(scene,/firstF9ReturnedGatewaySearchBudget\(\s*snapshot,coldArchProof,coldArchLens,lastSubmittedGuardian/);
  assert.match(scene,/sampleColdFirstReturnGatewayTrials\(clearance,\s*firstGatewaySearchBudget\.deckTrialLimit\)/);
  assert.match(scene,/sampleColdFirstReturnGatewayTrials\(opticalTrials,\s*firstGatewaySearchBudget\.doorwayTrialLimit\)/);
  assert.match(scene,/sourceThreeSubjectRaySafe\(\s*deckViewBeforeThreshold,currentRays\)/);
  assert.match(scene,/towerCoreSightlineClear\(camera\.position,thresholdHero,23\.5\)/);
  assert.match(scene,/world\.projectedOriginalGateSteel\(snapshot,camera\)/);
});
