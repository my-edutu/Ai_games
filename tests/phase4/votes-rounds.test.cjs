const test=require('node:test');
const assert=require('node:assert/strict');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const {
  createVoteWindow,submitVote,resolveVote,publicTally,
  createChatVsAiState,openChatVsAiRound,completeChatVsAiRound
}=require('../../dist/packages/interaction-core/src/index.js');

function input(serial,overrides={}){
  return {
    schemaVersion:1,provider:'fixture',providerEventId:`evt-${serial}`,
    occurredAtMs:1000,receivedAtMs:1000,channelRef:'channel',viewerRef:`viewer-${serial}`,
    displayName:`Viewer ${serial}`,kind:'vote',fixedToken:'A',entitlementBand:'none',entitlementWeight:1,
    rawDigest:`digest-${serial}`,reversalOf:null,idempotencyKey:`key-${serial}`,...overrides
  };
}
const options=[
  {id:'a',label:'Bonus food',effectId:'bonus-food',candidateId:'food-1'},
  {id:'b',label:'Fog field',effectId:'fog-field',candidateId:'fog-1'},
];

test('vote window accepts one bounded vote per viewer and is retry-idempotent',()=>{
  let w=createVoteWindow({id:'vote-1',runToken:'run',startTick:10,endTick:20,options});
  let r=submitVote(w,input('1'),{A:'a',B:'b'},12); w=r.window;
  assert.equal(r.status,'accepted');
  const retry=submitVote(w,input('1'),{A:'a',B:'b'},12);
  assert.equal(retry.status,'duplicate');
  const second=submitVote(w,input('2',{viewerRef:'viewer-1',fixedToken:'B',idempotencyKey:'key-2'}),{A:'a',B:'b'},13);
  assert.equal(second.status,'rejected'); assert.equal(second.reason,'viewer-already-voted');
  assert.equal(Object.keys(second.window.votesByViewer).length,1);
});

test('invalid token and late vote do not mutate authoritative window',()=>{
  const w=createVoteWindow({id:'vote-2',runToken:'run',startTick:10,endTick:20,options});
  const invalid=submitVote(w,input('x',{fixedToken:'Z'}),{A:'a',B:'b'},12);
  assert.equal(invalid.status,'rejected'); assert.deepEqual(invalid.window,w);
  const late=submitVote(w,input('y'),{A:'a',B:'b'},21);
  assert.equal(late.reason,'late'); assert.deepEqual(late.window,w);
});

test('weighted tally is bounded and public tally contains no viewer identity',()=>{
  let w=createVoteWindow({id:'vote-3',runToken:'run',startTick:0,endTick:5,options});
  w=submitVote(w,input('1',{entitlementWeight:3}),{A:'a',B:'b'},1).window;
  w=submitVote(w,input('2',{fixedToken:'B',entitlementWeight:2}),{A:'a',B:'b'},2).window;
  const tally=publicTally(w);
  assert.deepEqual(tally,{a:3,b:2});
  assert.equal(JSON.stringify(tally).includes('viewer-'),false);
});

test('vote resolution and tie-break replay deterministically from named RNG state',()=>{
  let w=createVoteWindow({id:'vote-4',runToken:'run',startTick:0,endTick:5,options});
  w=submitVote(w,input('1'),{A:'a',B:'b'},1).window;
  w=submitVote(w,input('2',{fixedToken:'B'}),{A:'a',B:'b'},2).window;
  const a=NamedRng.fromSeed('vote-tie'); const snap=a.snapshot();
  const r1=resolveVote(w,a,5);
  const r2=resolveVote(w,NamedRng.restore(snap),5);
  assert.deepEqual(r1,r2); assert.equal(r1.window.status,'resolved');
  assert.ok(['a','b'].includes(r1.result.optionId));
});

test('resolved vote is immutable to late retries and cannot be resolved twice differently',()=>{
  const w=createVoteWindow({id:'vote-5',runToken:'run',startTick:0,endTick:1,options});
  const resolved=resolveVote(w,NamedRng.fromSeed('empty'),1);
  const late=submitVote(resolved.window,input('late'),{A:'a'},1);
  assert.equal(late.status,'rejected'); assert.equal(late.reason,'closed');
  const again=resolveVote(resolved.window,NamedRng.fromSeed('other'),2);
  assert.deepEqual(again,resolved);
});

test('Chat vs AI rounds obey lifecycle, overlap, cooldown and pressure caps',()=>{
  let state=createChatVsAiState({enabled:true,pressureCap:5});
  const blocked=openChatVsAiRound(state,{tick:10,lifecycle:'result',window:createVoteWindow({id:'x',runToken:'r',startTick:10,endTick:20,options})});
  assert.equal(blocked.status,'suppressed');
  const opened=openChatVsAiRound(state,{tick:10,lifecycle:'running',window:createVoteWindow({id:'y',runToken:'r',startTick:10,endTick:20,options})});
  assert.equal(opened.status,'opened'); state=opened.state;
  assert.equal(openChatVsAiRound(state,{tick:11,lifecycle:'running',window:createVoteWindow({id:'z',runToken:'r',startTick:11,endTick:21,options})}).reason,'overlap');
  state=completeChatVsAiRound(state,{resolvedTick:20,pressureAdded:99,cooldownTicks:30}).state;
  assert.equal(state.pressure,5); assert.equal(state.roundsCompleted,1); assert.equal(state.cooldownUntilTick,50);
  assert.equal(openChatVsAiRound(state,{tick:49,lifecycle:'running',window:createVoteWindow({id:'q',runToken:'r',startTick:49,endTick:60,options})}).reason,'cooldown');
});
