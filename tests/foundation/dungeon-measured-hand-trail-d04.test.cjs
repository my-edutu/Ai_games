'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const load=()=>import(pathToFileURL(path.join(__dirname,'../../public/ai-dungeon/measured-weapon-trail.js')).href);
const hand=(x,y,z,rootX=0,rootY=0,rootZ=0)=>({x,y,z,rootX,rootY,rootZ});
test('D04 only changing local rig-hand position yields measured feedback, not synthetic swing rotation',async()=>{
 const {planMeasuredHandTrail}=await load();
 assert.equal(planMeasuredHandTrail(hand(0,1,0),hand(0,1,0),.016),null);
 assert.equal(planMeasuredHandTrail(hand(0,1,0),hand(.12,1,0,.12,0,0),.016),null,'root travel is not a sword stroke');
 const p=planMeasuredHandTrail(hand(0,1,0),hand(.12,1.08,0),.016);
 assert.ok(p);assert.ok(p.length>.14&&p.length<.15);
 assert.ok(Math.abs(p.center.x-.06)<1e-8);assert.ok(Math.abs(p.center.y-1.04)<1e-8);
 assert.ok(Math.abs(Math.hypot(p.direction.x,p.direction.y,p.direction.z)-1)<1e-8);
});
test('D04 malformed, stalled or teleported rig-hand samples are suppressed, never stretched across bodies',async()=>{
 const {planMeasuredHandTrail}=await load();
 const p=hand(.1,1,0),q=hand(.20,1.08,0);
 for(const dt of [0,NaN,-1,.10,Infinity])assert.equal(planMeasuredHandTrail(p,q,dt),null);
 assert.equal(planMeasuredHandTrail(p,hand(2,1,0),.016),null);
 assert.equal(planMeasuredHandTrail(p,hand(.11,1,0),.016),null);
 assert.equal(planMeasuredHandTrail(p,hand(NaN,1,0),.016),null);
 assert.equal(planMeasuredHandTrail(p,{...q,rootZ:Infinity},.016),null);
});

test('D04 never creates an apparent wrist sweep when the GLB hand identity changes mid-attack',async()=>{
 const {planMeasuredHandTrail}=await load();
 const oldBone={isBone:true,name:'old skinned wrist'},newBone={isBone:true,name:'replacement skinned wrist'};
 const before={...hand(0,1.1,0),sourceBone:oldBone};
 const replacement={...hand(.13,1.15,0),sourceBone:newBone};
 assert.equal(planMeasuredHandTrail(before,replacement,.016),null,
  'an asset hot-swap is not an observed sword stroke');
 assert.equal(planMeasuredHandTrail(before,{...replacement,sourceBone:null},.016),null,
  'missing wrist provenance cannot complete a trail');
 const same={...replacement,sourceBone:oldBone};
 assert.ok(planMeasuredHandTrail(before,same,.016),
  'genuine displacement on one stable skinned wrist remains visible');
});

test('D04 keeps slow wrist drift from generating a cosmetic blade stroke at low frame rates',async()=>{
 const {planMeasuredHandTrail,MEASURED_HAND_TRAIL_MIN_METERS_PER_SECOND}=await load();
 assert.equal(MEASURED_HAND_TRAIL_MIN_METERS_PER_SECOND,.9);
 const start=hand(0,1,0);
 assert.equal(planMeasuredHandTrail(start,hand(.05,1,0),.06),null,
  'five centimetres over 60ms is slow drift, not a physical sword streak');
 assert.equal(planMeasuredHandTrail(start,hand(.025,1,0),.05),null,
  'the old absolute-distance-only filter allowed a slow hand twitch');
 assert.ok(planMeasuredHandTrail(start,hand(.05,1,0),.016),
  'the same actual displacement at normal frame rate is a quick gesture');
 assert.ok(planMeasuredHandTrail(start,hand(.12,1,0),.06),
  'a deliberate longer real hand stroke at 60ms remains readable');
 assert.equal(planMeasuredHandTrail(start,hand(.12,1,0,.12,0,0),.016),null,
  'rigid body travel must never invent a wrist stroke');
});
