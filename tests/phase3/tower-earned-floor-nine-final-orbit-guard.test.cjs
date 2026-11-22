'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const guard=import('../../public/infinite-tower-climb/visuals/source-returned-gate-camera-release.mjs');
const token='authentic-guardian-earned-f9';
const source={
 floor:9,theme:'void',lifecycle:'running',runToken:token,tick:544,
 player:{health:4,x:341000,y:3328000,halfHeight:14000,
  grounded:true,groundedPlatformId:'f9:p2',state:'standing'},
 lastGuardianCrossing:{
  runToken:token,sourceTick:475,fromFloor:8,toFloor:9,
  crossingX:333296,cap:{id:'f8:cap',y:3212000,height:12000},
  guardian:{kind:'guardian',active:false,health:0}
 },
 platforms:[
  {id:'f9:ground',x:310000,y:3212000,width:220000,height:12000},
  {id:'f9:p2',x:335000,y:3300000,width:52000,height:14000}
 ],
 intent:{targetPlatformId:'f9:p2'}
};
const prior={runToken:token,floor:9,tick:531};
const camera0=[30.519855,19.67954,49.10918],camera1=[-1.223589,18.07682,42.6636];
const opts={source,lastReturned:prior,previousCamera:camera0,
 previousFocus:[5,16,25],desiredCamera:camera1,
 desiredFocus:[-8,27,18],dt:.06};
test('real 1x portrait original gateway -> raised deck camera jump is bounded on the LAST returned F9 lens',async()=>{
 const {sourceEarnedFloorNineOrbitGuard:f}=await guard;
 const original=JSON.stringify(source);
 const proposal=f(opts);
 assert.ok(proposal&&proposal.limited);
 assert.ok(Math.abs(proposal.turnRadians)<=.60*.06+1e-9);
 assert.ok(Math.abs(proposal.requestedTurnRadians)>.3);
 assert.ok(Math.hypot(...proposal.camera.map((v,i)=>v-camera0[i]))<2.5);
 assert.ok(proposal.remainingMetres>10);
 assert.equal(proposal.sourceTick,544);
 assert.equal(proposal.runToken,token);
 assert.equal(JSON.stringify(source),original,'camera must not mutate gameplay');
});
test('first grounded real receiving roof and first airborne real raised deck use the SAME bounded corridor',async()=>{
 const {sourceEarnedFloorNineOrbitGuard:f}=await guard;
 const grounded={...source,tick:500,
  player:{...source.player,y:3238000,groundedPlatformId:'f9:ground'},
  intent:{targetPlatformId:'f9:ground'}};
 // 3238000 - 14000 = 3224000 == 3212000+12000.
 const a=f({...opts,source:grounded,lastReturned:{...prior,tick:492}});
 assert.ok(a&&a.limited);
 const air={...source,tick:518,
  player:{...source.player,grounded:false,groundedPlatformId:null,state:'airborne'}};
 const b=f({...opts,source:air,lastReturned:{...prior,tick:508}});
 assert.ok(b&&b.limited);
});
test('no borrowed camera across floors, runs, false victories, bad real roof, stale input, restart or damaged actor',async()=>{
 const {sourceEarnedFloorNineOrbitGuard:f}=await guard;
 for(const item of [
  {...opts,source:{...source,floor:8}},
  {...opts,source:{...source,lifecycle:'result'}},
  {...opts,source:{...source,runToken:'wrong-run'}},
  {...opts,source:{...source,tick:586}},
  {...opts,source:{...source,player:{...source.player,health:0}}},
  {...opts,source:{...source,lastGuardianCrossing:{
   ...source.lastGuardianCrossing,guardian:{kind:'guardian',active:true,health:1}}}},
  {...opts,source:{...source,platforms:[
   {...source.platforms[0],y:3210000},source.platforms[1]]}},
  {...opts,lastReturned:{...prior,tick:500,runToken:'different'}},
  {...opts,lastReturned:{...prior,tick:501}}, // >28 tick gap
  {...opts,stale:true},
  {...opts,reducedMotion:true},
  {...opts,cameraMode:'overview'},
  {...opts,previousCamera:[0,0,4]},
  {...opts,dt:.8},
 ])assert.equal(f(item),null);
});
test('final immutable-source guard follows ALL earlier 3D directors, physically vets actual old gate and raised deck BEFORE one original render',()=>{
 const scene=fs.readFileSync(path.resolve(__dirname,
 '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 const a=scene.indexOf('sourceFirstRaisedFlightGaze(snapshot,');
 const b=scene.indexOf('const earnedOrbit=sourceEarnedFloorNineOrbitGuard({');
 const c=scene.indexOf('renderer.render(scene, camera)');
 assert.ok(a>0 && a<b && b<c);
 assert.match(scene,/actualRays\.bodyBlockedRays===0/);
 assert.match(scene,/oldSteel\.projectedMetalArea>=\.012/);
 assert.match(scene,/fullHero && destinationPreserved && preservedOriginal/);
 assert.match(scene,/camera\.position\.copy\(releasePreviousCamera\)/);
 assert.match(scene,/earnedFloorNineOrbitContinuity:/);
});
