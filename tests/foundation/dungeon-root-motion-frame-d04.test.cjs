'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const fs=require('node:fs');
const project=path.resolve(__dirname,'../..');
const load=name=>import(pathToFileURL(path.join(project,'public/ai-dungeon',name)).href);
const hand=(x,y,z,yaw=0,rootX=0,rootZ=0)=>({x,y,z,rootX,rootY:0,rootZ,yaw});
test('root-only turn with a planted hand cannot make an invented blade streak',async()=>{
 const {planMeasuredHandTrail}=await load('measured-weapon-trail.js');
 assert.equal(planMeasuredHandTrail(hand(.24,1,0),hand(0,1,-.24,Math.PI/2),.016),null);
 assert.equal(planMeasuredHandTrail(hand(.22,1,0),hand(-.22,1,0,Math.PI),.016),null);
});
test('real local wrist travel survives simultaneous facing rotation and is located at the live bone',async()=>{
 const {planMeasuredHandTrail}=await load('measured-weapon-trail.js');
 const v=planMeasuredHandTrail(hand(.24,1,0),hand(0,1,-.38,Math.PI/2),.016);
 assert.ok(v);assert.ok(Math.abs(v.length-.14)<1e-8);
 assert.ok(Math.abs(v.direction.x)<1e-8);assert.ok(Math.abs(v.direction.z+1)<1e-8);
 assert.ok(Math.abs(v.center.z+.31)<1e-8);
 // Translation + turning does not count as a separate sword action.
 assert.equal(planMeasuredHandTrail(hand(.24,1,0),hand(2,1,2-.24,Math.PI/2,2,2),.016),null);
});
test('stale, invalid and legacy no-yaw inputs remain conservative and finite',async()=>{
 const {planMeasuredHandTrail}=await load('measured-weapon-trail.js');
 const prev=hand(0,1,0),next=hand(.14,1,0);
 assert.equal(planMeasuredHandTrail(prev,next,.14),null);
 assert.equal(planMeasuredHandTrail(prev,{...next,yaw:NaN},.016),null);
 const legacy=planMeasuredHandTrail({...prev,yaw:undefined},{...next,yaw:undefined},.016);
 assert.ok(legacy&&Math.abs(legacy.length-.14)<1e-8);
});
test('visual coordinator forwards actual frame interval without accelerating one-shot animation',async()=>{
 const {createPhysicalCombatFeedback}=await load('physical-combat-feedback.js');
 const frames=[];
 const director=createPhysicalCombatFeedback({
  visualAdapter:{advance(...args){frames.push(args)},emit(){return true},reset(){},dispose(){}},
  audioAdapter:{emit(){return false},cleanup(){},flush(){},dispose(){}}
 });
 director.advance(.05,.38);
 assert.deepEqual(frames,[[.05,.38]]);
 director.advance(.016);
 assert.deepEqual(frames[1],[.016,.016],'one-argument adapters preserve the previous contract');
 director.dispose();
});
test('actual browser frame interval reaches the measured hand path without changing legacy opt-out',()=>{
 const app=fs.readFileSync(path.join(project,'public/ai-dungeon/app.js'),'utf8');
 const visual=fs.readFileSync(path.join(project,'public/ai-dungeon/physical-feedback-visuals.js'),'utf8');
 const director=fs.readFileSync(path.join(project,'public/ai-dungeon/physical-combat-feedback.js'),'utf8');
 assert.match(app,/const D04_PREVIEW=new URLSearchParams\(location\.search\)\.get\('feedback'\)==='d04'/);
 assert.match(app,/if\(physicalFeedback\)physicalFeedback\.advance\(dt,frameInterval\)/);
 assert.match(director,/visuals\?\.advance\?\.\(dt,actualFrameSeconds\)/);
 assert.match(visual,/planMeasuredHandTrail\(slot\.lastHand,hand,actualFrameSeconds\)/);
 assert.match(visual,/actualFrameSeconds<=MEASURED_HAND_TRAIL_MAX_FRAME_SECONDS/);
});
