'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const {checksum}=require('../../dist/packages/replay/src/index.js');
const {parseCivilizationConfig}=require('../../dist/games/ai-civilization/src/config/schema.js');
const {createInitialCivilizationState}=require('../../dist/games/ai-civilization/src/index.js');
const {legalCivilizationActions,decideCivilizationAction}=require('../../dist/games/ai-civilization/src/ai/policy.js');
const {applyCivilizationAction,assertCivilizationInvariants}=require('../../dist/games/ai-civilization/src/rules/step.js');
const {CivilizationRuntime}=require('../../dist/games/ai-civilization/src/runtime/run.js');
const {createCivilizationSnapshot,restoreCivilizationSnapshot}=require('../../dist/games/ai-civilization/src/persistence/snapshot.js');
const {runCivilizationHeadless}=require('../../dist/games/ai-civilization/src/testing/headless.js');

test('policy always selects a legal deterministic action and uses emergency food reflex',()=>{
  const c=parseCivilizationConfig({});
  const state=createInitialCivilizationState(c,'policy','run-policy');
  state.resources.food=0;
  const a=decideCivilizationAction(state);
  const b=decideCivilizationAction(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(a,b);
  assert.ok(legalCivilizationActions(state).some(x=>x.key===a.action.key));
  assert.match(a.intent.pressure,/food|starvation/i);
});

test('one rule step preserves bounded resources, state invariants and semantic order',()=>{
  const c=parseCivilizationConfig({});
  const rng=NamedRng.fromSeed('step');
  const state=createInitialCivilizationState(c,'step','run-step',rng);
  const decision=decideCivilizationAction(state);
  const out=applyCivilizationAction(state,decision.action,rng);
  assert.equal(out.state.tick,1);
  assert.ok(out.events.length>0);
  assert.ok(out.events.every((e,i)=>e.seq===i));
  assert.doesNotThrow(()=>assertCivilizationInvariants(out.state));
  for(const value of Object.values(out.state.resources))assert.ok(Number.isInteger(value)&&value>=0&&value<=c.storageCap);
});

test('10,000 production-rule steps never violate invariants or action legality',()=>{
  const runtime=CivilizationRuntime.create({maxRunDays:20000,legendaryRenown:999999},'property');
  for(let i=0;i<10000;i++){
    if(runtime.state.lifecycle!=='running') runtime.step();
    else {
      const legal=legalCivilizationActions(runtime.state);
      const decision=decideCivilizationAction(runtime.state);
      assert.ok(legal.some(a=>a.key===decision.action.key));
      runtime.step();
      assert.doesNotThrow(()=>assertCivilizationInvariants(runtime.state));
    }
  }
});

test('snapshot restore matches uninterrupted authority and preserves event sequence',()=>{
  const a=CivilizationRuntime.create({maxRunDays:3000},'restore-seed');
  for(let i=0;i<240;i++)a.step();
  const snap=createCivilizationSnapshot(a);
  const b=restoreCivilizationSnapshot(snap);
  assert.equal(b.getNextEventSequence(),a.getNextEventSequence());
  assert.equal(b.state.config,b.config);
  assert.equal(Object.isFrozen(b.state.config),true);
  for(let i=0;i<300;i++){a.step();b.step();}
  assert.equal(checksum(a.state),checksum(b.state));
  assert.deepEqual(a.rng.snapshot(),b.rng.snapshot());
});

test('snapshot rejects corruption and unsupported deterministic versions',()=>{
  const runtime=CivilizationRuntime.create({},'corrupt');
  for(let i=0;i<20;i++)runtime.step();
  const snap=createCivilizationSnapshot(runtime);
  const corrupt=JSON.parse(JSON.stringify(snap)); corrupt.payload.resources.food++;
  assert.throws(()=>restoreCivilizationSnapshot(corrupt),/checksum/);
  const unsupported=JSON.parse(JSON.stringify(snap)); unsupported.deterministicVersion='future';
  assert.throws(()=>restoreCivilizationSnapshot(unsupported),/deterministicVersion/);
});

test('headless runs are deterministic and classify technical outcomes separately',()=>{
  const one=runCivilizationHeadless({seed:'headless',maxDays:1200});
  const two=runCivilizationHeadless({seed:'headless',maxDays:1200});
  assert.deepEqual(one,two);
  assert.ok(['legendary-victory','population-collapse','state-collapse','capital-fallen','era-timeout','running-cap'].includes(one.outcome));
  assert.equal(one.integrityFailures,0);
  assert.ok(one.finalChecksum.length===8);
});
