'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const helper=import('../../public/infinite-tower-climb/visuals/source-earned-void-horizon.mjs');
function sample(){
 const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
 const source={runToken:'r1',floor:9,theme:'void',lifecycle:'running',tick:497,
  player:{x:324000,y:3254000,halfWidth:9000,halfHeight:14000,health:3,
   grounded:false,state:'airborne',groundedPlatformId:null,vy:4000},
  platforms:[{id:'f9:ground',x:115200,y:3212000,width:249600,height:12000}],
  lastGuardianCrossing:{runToken:'r1',fromFloor:8,toFloor:9,sourceTick:475,
    exitX:304896,cap,guardian:{kind:'guardian',active:false,health:0}}};
 const held={runToken:'r1',floor:9,guardianGateRetained:true,
  oldCapId:'f8:cap',oldCapX:115200,oldCapWidth:249600,oldRoofY:3224000,
  crossingTick:475,thresholdX:304896,submittedFrames:6,visibleSeconds:.5,
  originalGatewayOpacity:.55};
 const submission={sourceBound:true,runToken:'r1',floor:9,
  sourceTick:497,firstBearingReturnedFrames:5};
 return {source,held,submission};
}
test('source-earned authentic first-bearing returns cool ONLY successor environment over several real frames',async()=>{
 const {observedSourceEarnedVoidHorizon:observe}=await helper;
 const {source,held,submission}=sample();
 const value=observe(source,held,submission);
 assert.equal(value.sourceBound,true);
 assert.equal(value.runToken,source.runToken,'earned horizon is bound to the authentic guardian run');
 assert.equal(value.realFlight,true);
 // With five real submitted-bearing returns, .50s gives a smoothstep of
 // 0.9657 (old horizon ~.0343), not >.05. The former numeric bound falsely
 // vetoed a legitimate near-complete fade; check the entire real trajectory.
 const midway=observe(source,{...held,visibleSeconds:.35},submission);
 assert(midway && midway.maxOldHorizonWeight>.2 &&
   midway.maxOldHorizonWeight<.6);
 assert(value.maxOldHorizonWeight>0 && value.maxOldHorizonWeight<.1);
 assert(value.maxOldHorizonWeight<midway.maxOldHorizonWeight);
 assert.equal(observe(source,held,{...submission,firstBearingReturnedFrames:1})?.maxOldHorizonWeight,1);
 assert.equal(observe(source,{...held,submittedFrames:7,visibleSeconds:.6},
   {...submission,firstBearingReturnedFrames:7})?.maxOldHorizonWeight,0);
});
test('no forged guardian, stale run, missing F9 support, unreturned bearing or reversed clock may change atmosphere',async()=>{
 const {observedSourceEarnedVoidHorizon:observe}=await helper;
 const {source,held,submission}=sample();
 const invalid=[
  [{...source,floor:8},held,submission],
  [{...source,runToken:'forged'},held,submission],
  [{...source,lastGuardianCrossing:{...source.lastGuardianCrossing,guardian:{kind:'guardian',active:true,health:1}}},held,submission],
  [{...source,lastGuardianCrossing:{...source.lastGuardianCrossing,sourceTick:500}},held,submission],
  [{...source,player:{...source.player,x:200000}},held,submission],
  [{...source,player:{...source.player,grounded:false,state:'standing'}},held,submission],
  [{...source,platforms:[]},held,submission],
  [source,{...held,visibleSeconds:.99},submission],
  [source,{...held,guardianGateRetained:false},submission],
  [source,held,{...submission,firstBearingReturnedFrames:0}],
  [source,held,{...submission,firstBearingReturnedFrames:7}],
  [source,held,{...submission,runToken:'forged'}],
  [source,held,{...submission,sourceTick:496}]
 ];
 for(const [s,h,b] of invalid)assert.equal(observe(s,h,b),null);
});
test('real World receipts only, old HP-door material preserved, no physics authority writes',()=>{
 const w=fs.readFileSync(path.join(__dirname,
  '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
 const scene=fs.readFileSync(path.join(__dirname,
  '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 assert.match(w,/firstBearingReturnedFrames:\s*[\s\S]*?job\.firstBearingReturnedFrames:0/);
 assert.match(w,/stagedVoidArchitecture\.root\.parent===floorGroup/);
 assert.match(scene,/observedSourceEarnedVoidHorizon\(snapshot,/);
 assert.match(scene,/sourceSynchronizedHorizonWeight\(snapshot,/);
 assert.match(scene,/certifiedHorizon,earnedVoidHorizon\);/);
 assert.match(scene,/earnedVoidSkyLease\.sourceTick=snapshot\.tick/);
 assert.doesNotMatch(scene,/snapshot\.player\.(?:x|y|health|grounded)\s*=/);
});
