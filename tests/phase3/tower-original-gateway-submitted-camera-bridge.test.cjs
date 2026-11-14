'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const load=import('../../public/infinite-tower-climb/visuals/original-gateway-submitted-camera-bridge.mjs');
const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
const thresholdX=cap.x+Math.floor(cap.width*.76);
const prior={runToken:'genuine',floor:8,tick:448,chunkBaseY:2880000,
  oldRoofY:cap.y+cap.height,thresholdX,
  camera:[4,40,64],gaze:[8,34,21]};
const held={runToken:'genuine',floor:9,guardianGateRetained:true,
  oldCapId:'f8:cap',oldRoofY:cap.y+cap.height,thresholdX,
  submittedFrames:0,visibleSeconds:0};
const snapshot={runToken:'genuine',floor:9,theme:'void',tick:452,
  lifecycle:'running',chunkBaseY:3120000,
  player:{x:330196,y:3238000,halfHeight:14000,health:4},
  lastGuardianCrossing:{runToken:'genuine',fromFloor:8,toFloor:9,
    sourceTick:451,exitX:thresholdX,cap,
    guardian:{kind:'guardian',active:false,health:0}}};
const view={camera:'follow',stale:false,overview:false,reducedMotion:false};
test('one true defeated doorway rebases last returned old-floor shot, bounded by submitted F9 frames',async()=>{
  const {sourceOriginalGatewayCameraBridge:plan}=await load;
  const result=plan(snapshot,held,prior,view);
  assert.equal(result.sourceBound,true);
  assert.deepEqual(result.camera,[4,16,64]);
  assert.deepEqual(result.gaze,[8,10,21]);
  assert.ok(result.weight>.7 && result.weight<.75);
  assert.equal(plan(snapshot,{...held,submittedFrames:5},prior,view).weight,
    result.weight/4);
  assert.equal(plan(snapshot,{...held,submittedFrames:10},prior,view),null);
});
test('no lock for live guardian, wrong run, old roof, teleport, user camera or later floor',async()=>{
  const {sourceOriginalGatewayCameraBridge:plan}=await load;
  const cases=[
    [snapshot,{...held,runToken:'other'},prior,view],
    [{...snapshot,runToken:'other'},held,prior,view],
    [{...snapshot,floor:10},held,prior,view],
    [{...snapshot,lastGuardianCrossing:{...snapshot.lastGuardianCrossing,
      guardian:{kind:'guardian',health:1,active:true}}},held,prior,view],
    [snapshot,{...held,oldRoofY:held.oldRoofY+100},prior,view],
    [snapshot,held,{...prior,thresholdX:thresholdX+1},view],
    [snapshot,held,{...prior,tick:400},view],
    [{...snapshot,player:{...snapshot.player,x:thresholdX+100000}},held,prior,view],
    [snapshot,held,prior,{...view,camera:'overview'}],
    [snapshot,held,prior,{...view,stale:true}],
    [snapshot,held,prior,{...view,reducedMotion:true}],
    [snapshot,{...held,visibleSeconds:3},prior,view],
  ];
  for(const args of cases) assert.equal(plan(...args),null);
});
test('the real camera consumes only genuine submitted old floor view and verifies hero/core on new floor',()=>{
  const scene=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(scene,/sourceOriginalGatewayCameraBridge\(snapshot,coldArchProof,/);
  assert.match(scene,/originalGatewaySubmittedCamera\s*=\s*\{/);
  assert.match(scene,/bridgeHeroSafe && bridgeGateSafe/);
  assert.match(scene,/towerCoreSightlineClear\(camera.position,thresholdHero,23\.5\)/);
  assert.match(scene,/towerCoreSightlineClear\(camera.position,thresholdGate,23\.5\)/);
  assert.match(scene,/originalGatewayCameraBridgeAccepted\+\+/);
});
