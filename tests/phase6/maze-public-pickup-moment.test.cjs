'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),path=require('node:path');
const modulePromise=import(pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs')).href);
const state=(extra={})=>({runToken:'observed',tick:8,width:7,height:9,
  currentCell:24,cells:[{cell:24},{cell:25}],
  keys:[{id:'amber',cell:24,collected:false}],inventory:[],...extra});
test('physical pickup follows a truly observed public collection and changes no source state',async()=>{
  const {publicKeyCollectionMoment:cue}=await modulePromise;
  const before=state(),after=state({tick:9,keys:[{id:'amber',cell:24,collected:true}],inventory:['amber']});
  const originals=[JSON.stringify(before),JSON.stringify(after)];
  assert.deepEqual(cue(before,after),{id:'amber',cell:24});
  assert.deepEqual([JSON.stringify(before),JSON.stringify(after)],originals);
});
test('no display from unknown, inferred, moved, uncollected or uninventoried keys',async()=>{
  const {publicKeyCollectionMoment:cue}=await modulePromise;
  const before=state(),after=state({tick:9,keys:[{id:'amber',cell:24,collected:true}],inventory:['amber']});
  assert.equal(cue(state({cells:[{cell:25}]}),after),null);
  assert.equal(cue(before,state({tick:9,keys:[],inventory:['amber']})),null);
  assert.equal(cue(before,state({tick:9,keys:[{id:'amber',cell:25,collected:true}],inventory:['amber']})),null);
  assert.equal(cue(before,state({tick:9,keys:[{id:'amber',cell:24,collected:false}],inventory:['amber']})),null);
  assert.equal(cue(before,state({tick:9,keys:[{id:'amber',cell:24,collected:true}],inventory:[]})),null);
  assert.equal(cue(state({keys:[{id:'amber',cell:24,collected:true}]}),after),null);
});
test('terminal, new run, replay, nonmonotonic tick, changed dimensions rejected',async()=>{
  const {publicKeyCollectionMoment:cue}=await modulePromise;
  const before=state(),after=state({tick:9,keys:[{id:'amber',cell:24,collected:true}],inventory:['amber']});
  assert.equal(cue(before,{...after,runToken:'another'}),null);
  assert.equal(cue(before,{...after,tick:8}),null);
  assert.equal(cue(before,{...after,tick:7}),null);
  assert.equal(cue({...before,result:{reason:'capture'}},after),null);
  assert.equal(cue(before,{...after,result:{reason:'escape'}}),null);
  assert.equal(cue(before,{...after,width:8}),null);
  assert.equal(cue(null,after),null);
});
test('simultaneous disclosed pickups choose same authentic source ID regardless of order',async()=>{
  const {publicKeyCollectionMoment:cue}=await modulePromise;
  const keys=[{id:'zinc',cell:25,collected:false},{id:'amber',cell:24,collected:false}];
  const collected=keys.map(x=>({...x,collected:true}));
  const before=state({keys}),after=state({tick:9,keys:collected,inventory:['zinc','amber']});
  assert.deepEqual(cue(before,after),{id:'amber',cell:24});
  assert.deepEqual(cue({...before,keys:[...keys].reverse()},{...after,keys:[...collected].reverse()}),{id:'amber',cell:24});
});
// A real browser failure (2026-11-02, focused CI 41439120617) revealed
// KEY FOUND expired on wall time while its 3D shards were still being rendered.
// Preserve exact same-run source truth and make both displays share one clock.
test('public key feedback stays coupled to actual frame-limited 3D pickup, not CPU wall stalls',async()=>{
  const fs=require('node:fs');
  const {advanceGateVisualClock,MAX_GATE_VISUAL_FRAME_SECONDS,PUBLIC_PICKUP_VISUAL_SECONDS}=await import(
    pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/gate-moment.mjs')).href);
  const app=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/app.js'),'utf8');
  const three=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
  assert.match(app,/hudVisualTime=advanceGateVisualClock\(hudVisualTime,wallDelta\)/);
  assert.match(app,/until:hudVisualTime\+PUBLIC_PICKUP_VISUAL_SECONDS/);
  assert.match(app,/hudVisualTime<pickupMilestone\.until/);
  assert.doesNotMatch(app,/performance\.now\(\)<pickupMilestone\.until/);
  assert.match(three,/pickupAge < PUBLIC_PICKUP_VISUAL_SECONDS/);
  assert.match(three,/pickupAge\/PUBLIC_PICKUP_VISUAL_SECONDS/);
  assert.ok(PUBLIC_PICKUP_VISUAL_SECONDS>MAX_GATE_VISUAL_FRAME_SECONDS*10);
  let time=advanceGateVisualClock(0,12);
  assert.equal(time,MAX_GATE_VISUAL_FRAME_SECONDS,
    'a 12s software stall is not 12s of visible animated key fragments');
  for(let i=0;i<14;i++)time=advanceGateVisualClock(time,12);
  assert.ok(time<PUBLIC_PICKUP_VISUAL_SECONDS,
    'key feedback and physical shards must both survive 15 deliberately slow frames');
  for(let i=0;i<14;i++)time=advanceGateVisualClock(time,12);
  assert.ok(time>=PUBLIC_PICKUP_VISUAL_SECONDS,
    'the real pickup beat must expire after enough rendered frames');
});
