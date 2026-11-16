'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
  '../../public/ai-maze-escape/guardian-duel-camera.mjs')).href);
const base={yaw:0,fit:true,score:2,pipTorsoClear:false,
  pipBootsClear:false,guardianTorsoClear:true};
const clear={yaw:-1.35,fit:true,score:6,pipTorsoClear:true,
  pipBootsClear:true,guardianTorsoClear:true};
test('full-actor source public earned counter alone can choose a real clear side',async()=>{
  const {publicGuardianCinematicSightlineChoice:choose}=await load();
  assert.equal(choose([base,clear],true,false),-1.35);
  assert.equal(choose([base,clear],false,false),0);
  assert.equal(choose([base,clear],true,true),0);
});
test('never substitute unsafe, still occluded or marginal camera for original',async()=>{
  const {publicGuardianCinematicSightlineChoice:choose}=await load();
  assert.equal(choose([base,{...clear,fit:false}],true),0);
  assert.equal(choose([base,{...clear,pipBootsClear:false}],true),0);
  assert.equal(choose([base,{...clear,guardianTorsoClear:false}],true),0);
  assert.equal(choose([{...base,score:4},{...clear,score:5}],true),0);
  assert.equal(choose([{...base,fit:false},clear],true),0);
  assert.equal(choose([base,{...clear,score:4}],true),0);
  assert.equal(choose([base,{...clear,score:Number.NaN}],true),0);
});
test('prefer a stronger earned full-body camera, then restrained rotation',async()=>{
  const {publicGuardianCinematicSightlineChoice:choose}=await load();
  assert.equal(choose([base,{...clear,yaw:Math.PI},
    {...clear,yaw:1.35}],true),1.35);
  assert.equal(choose([base,{...clear,score:5,yaw:1.35},
    {...clear,score:6,yaw:Math.PI}],true),Math.PI);
});
