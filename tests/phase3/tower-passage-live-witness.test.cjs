'use strict';
// P0 real render/camera/lighting loop: the full forensic passage report is
// O(3D objects) and must not be sampled 15+ times per animation frame.
const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const live=import('../../public/infinite-tower-climb/visuals/passage-live-witness.mjs');
const root=path.resolve(__dirname,'../../public/infinite-tower-climb/visuals');
const base={active:true,stage:'handoff',runToken:'source-run',floor:9,sourceTick:475,
 ageSeconds:.6,durationSeconds:2.8,handoffSubmittedFrames:1,
 handoffDisplaySeconds:.28,handoffVisibleWindowSeconds:2.8,
 continuousGroundedHandoff:true,exteriorMemoryFrameVisible:false,
 innerDoorAssemblyVisible:true,sourceMeasuredApproachOpen:.76,
 inlayProgress:.61,inlaySourceTick:475,focus:{x:4,y:28,z:22}};
test('source-authentic old/new physical handoff keeps world camera and light fields',async()=>{
 const {towerPassageLiveWitness}=await live;
 const s=towerPassageLiveWitness(base);
 assert.deepEqual({stage:s.stage,runToken:s.runToken,floor:s.floor,sourceTick:s.sourceTick,
   age:s.ageSeconds,duration:s.durationSeconds,frames:s.handoffSubmittedFrames,
   display:s.handoffDisplaySeconds,window:s.handoffVisibleWindowSeconds,
   continuous:s.continuousGroundedHandoff,inner:s.innerDoorAssemblyVisible,
   exterior:s.exteriorMemoryFrameVisible,focus:s.focusPosition,inlay:s.inlayProgress},
   {stage:'handoff',runToken:'source-run',floor:9,sourceTick:475,age:.6,duration:2.8,
   frames:1,display:.28,window:2.8,continuous:true,inner:true,exterior:false,
   focus:[4,28,22],inlay:.61});
 assert.equal(s.sourceBound,true);
});
test('no fabricated handoff when inactive locked or not source-confirmed',async()=>{
 const {towerPassageLiveWitness}=await live;
 for(const state of [{...base,active:false},{...base,stage:'guardian-locked'},
                   {...base,continuousGroundedHandoff:false}]) {
   const s=towerPassageLiveWitness(state);
   assert.equal(s.continuousGroundedHandoff,false);
   if(!state.active) {assert.equal(s.focusPosition,null);assert.equal(s.innerDoorAssemblyVisible,false);}
 }
});
test('live sightline witness detaches physical focus and rejects invalid camera coordinates',async()=>{
 const {towerPassageLiveWitness}=await live;
 const focus={x:4,y:28,z:22},s=towerPassageLiveWitness({...base,focus});
 focus.x=99;s.focusPosition[1]=999;
 assert.equal(s.focusPosition[0],4);
 assert.deepEqual(towerPassageLiveWitness({...base,focus:{x:4,y:28,z:22}}).focusPosition,[4,28,22]);
 assert.equal(towerPassageLiveWitness({...base,focus:{x:0,y:NaN,z:0}}).focusPosition,null);
 assert.equal(towerPassageLiveWitness(null).active,false);
});
test('main Three.js frame does not allocate the full passage forensic tree repeatedly',()=>{
 const scene=fs.readFileSync(path.join(root,'scene.mjs'),'utf8');
 const passage=fs.readFileSync(path.join(root,'guardian-passage.mjs'),'utf8');
 const renderBody=scene.slice(scene.indexOf('  function update(dt) {'),scene.indexOf('  function clearTowerRenderFault()'));
 assert.ok(renderBody.includes('passage.liveWitness()'));
 assert.ok(renderBody.includes('passageLiveFrame'));
 assert.equal((renderBody.match(/passage\.diagnostics\(\)/g)||[]).length,0);
 assert.ok(passage.includes('liveWitness'));
 assert.ok(passage.includes('function diagnostics()'),'full forensic path must survive intact');
 assert.ok(scene.includes('passage: passage.diagnostics()'),'explicit full forensic endpoint must be preserved');
});
