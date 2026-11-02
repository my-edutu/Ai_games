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