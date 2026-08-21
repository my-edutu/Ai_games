'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const {FloorsRuntime}=require('../../dist/games/ai-vs-1000-floors/src/runtime/run.js');
const {submitFloorsInfluence,applyScheduledFloorsInfluence,reverseFloorsInfluence,openFloorsVote,submitFloorsVote,resolveFloorsVote}=require('../../dist/games/ai-vs-1000-floors/src/influence/system.js');

const request=(id,effectId='supply-cache',tick=0)=>({id,effectId,source:'free',receivedAtTick:tick,policyVersion:'floors-influence-v1'});

test('duplicate, stale, malformed and queue-overflow influence fails safely',()=>{
  let state=FloorsRuntime.create({},'influence').state;
  const first=submitFloorsInfluence(state,request('same-key'));assert.equal(first.status,'accepted');state=first.state;
  const duplicate=submitFloorsInfluence(state,request('same-key'));assert.equal(duplicate.status,'duplicate');assert.equal(Object.keys(duplicate.state.influence.applied).length,0);
  assert.equal(submitFloorsInfluence(state,{...request('bad','unknown'),effectId:'unknown'}).status,'rejected');
  assert.equal(submitFloorsInfluence(state,{...request('stale','route-scan'),receivedAtTick:-999}).status,'rejected');
  for(let i=0;i<64;i++){const result=submitFloorsInfluence(state,request(`q-${i}`,i%2?'route-scan':'sector-theme'));if(result.status==='accepted')state=result.state}
  assert.ok(state.influence.queued.length<=32);
});

test('scheduled effects apply at most once and remain bounded',()=>{
  let state=FloorsRuntime.create({},'apply').state;state=submitFloorsInfluence(state,request('cache')).state;
  const before={health:state.player.health,credits:state.player.credits,pressure:state.influence.pressure};
  let applied=applyScheduledFloorsInfluence(state,state.tick+2,NamedRng.fromSeed('apply'));state=applied.state;
  assert.equal(applied.applied.length,1);assert.ok(state.player.health<=state.player.maxHealth);assert.ok(state.player.credits<=99);assert.ok(state.influence.pressure>=0&&state.influence.pressure<=5);
  const repeated=applyScheduledFloorsInfluence(state,state.tick+2,NamedRng.fromSeed('apply'));assert.equal(repeated.applied.length,0);assert.ok(state.player.health>=before.health);assert.ok(state.player.credits>=before.credits);
  assert.equal(reverseFloorsInfluence(state,'cache').status,'already-applied');
});

test('queued reversal prevents application without pretending applied state was undone',()=>{
  let state=FloorsRuntime.create({},'reverse').state;state=submitFloorsInfluence(state,request('queued-cache')).state;const reversed=reverseFloorsInfluence(state,'queued-cache');assert.equal(reversed.status,'reversed');const applied=applyScheduledFloorsInfluence(reversed.state,reversed.state.tick+2,NamedRng.fromSeed('reverse'));assert.equal(applied.applied.length,0);assert.equal(Object.prototype.hasOwnProperty.call(applied.state.influence.applied,'queued-cache'),false);
});

test('paid and free sources share the same eligibility and cannot encode terminal outcomes',()=>{
  const state=FloorsRuntime.create({},'paid-free').state;
  const free=submitFloorsInfluence(state,request('free','elite-contract'));
  const paid=submitFloorsInfluence(state,{...request('paid','elite-contract'),source:'paid-eligible'});
  assert.equal(free.status,paid.status);assert.equal(free.status,'accepted');
  const json=JSON.stringify(paid.state.influence);for(const forbidden of ['winner','victory','defeat','cash','amount','message','displayName'])assert.equal(json.includes(forbidden),false,forbidden);
});

test('votes use logical ticks, one identity vote, deterministic ties, and report queue result',()=>{
  let state=FloorsRuntime.create({},'vote').state;
  let opened=openFloorsVote(state,['route-scan','hazard-pulse'],state.tick+10);state=opened.state;
  state=submitFloorsVote(state,opened.vote.id,'viewer-a','route-scan').state;
  state=submitFloorsVote(state,opened.vote.id,'viewer-b','hazard-pulse').state;
  assert.equal(submitFloorsVote(state,opened.vote.id,'viewer-a','hazard-pulse').status,'duplicate');
  const a=resolveFloorsVote(state,opened.vote.id,state.tick+10,NamedRng.fromSeed('vote-tie'));
  const b=resolveFloorsVote(state,opened.vote.id,state.tick+10,NamedRng.fromSeed('vote-tie'));
  assert.equal(a.status,'resolved');assert.equal(a.winner,b.winner);assert.ok(['route-scan','hazard-pulse'].includes(a.winner));assert.ok(['queued','blocked'].includes(a.applicationStatus));
});
