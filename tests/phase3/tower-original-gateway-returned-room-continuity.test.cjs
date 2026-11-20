'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const source=import('../../public/infinite-tower-climb/visuals/far-side-shaft-transition.mjs');
const camera=import('../../public/infinite-tower-climb/visuals/original-gateway-submitted-camera-bridge.mjs');

// These are renderer-return durations, not guessed source ticks or video PTS.
// Original native 960x600 / 390x844 danger footage on immutable f1176f4
// advances HUD/scene roughly 0.6s after accepted WebGL return and loses the
// still-original gateway before the walkable successor has a shared shot.
test('one real returned Floor9 shaft fades original guardian steel gradually across the delayed native handoff',async()=>{
  const {observedReturnedFarSideFade:fade}=await source;
  const start={submittedFrames:8,farSideFadeStartSubmitted:8,
    visibleSeconds:.58,farSideFadeStartSeconds:.58};
  const job={structuralVisibleReturns:0};
  assert.equal(fade(start,job),0,
    'not one invented successor frame can retire an original GPU door');
  const mid={...start,submittedFrames:15,visibleSeconds:1.53};
  const alpha=fade(mid,{structuralVisibleReturns:7});
  assert.ok(alpha>0 && alpha<.70,
    'seven returned shaft frames and .95 rendered seconds must not wipe the old guardian door before the native handoff');
  const finish={...start,submittedFrames:25,visibleSeconds:2.34};
  assert.equal(fade(finish,{structuralVisibleReturns:17}),1,
    'genuine returned successor with enough frame AND elapsed time does finish the old-material exit');
  assert.equal(fade({...start,visibleSeconds:.2},{structuralVisibleReturns:1}),null,
    'impossible or reversed display durations cannot age any physical room');
});
test('old Floor8 camera escorts the live Floor9 hero and true door until the same returned-material window ends',async()=>{
  const {sourceOriginalGatewayCameraBridge:bridge}=await camera;
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const thresholdX=cap.x+Math.floor(cap.width*.76);
  const prior={runToken:'same',floor:8,tick:448,chunkBaseY:2880000,
    oldRoofY:cap.y+cap.height,thresholdX,oldCapId:'f8:cap',
    originalGuardianObserved:true,originalGuardianHealth:1,
    camera:[4,40,64],gaze:[8,34,21]};
  const snapshot={runToken:'same',floor:9,theme:'void',tick:452,
    lifecycle:'running',chunkBaseY:3120000,
    player:{x:330196,y:3238000,halfHeight:14000,health:4},
    lastGuardianCrossing:{runToken:'same',fromFloor:8,toFloor:9,
      sourceTick:451,exitX:thresholdX,cap,
      guardian:{kind:'guardian',active:false,health:0}}};
  const held={runToken:'same',floor:9,guardianGateRetained:true,
    oldCapId:'f8:cap',oldRoofY:cap.y+cap.height,thresholdX,
    submittedFrames:12,visibleSeconds:.52,originalGatewayOpacity:.95};
  const options={camera:'follow',stale:false,overview:false,reducedMotion:false};
  const rescued=bridge(snapshot,held,prior,options);
  assert.ok(rescued?.sourceBound && rescued.weight>.35,
    'retain meaningful original-camera weight while the original physical door is visibly held, not only NDC metadata');
  assert.equal(bridge(snapshot,{...held,originalGatewayOpacity:0},prior,options),null,
    'the old camera must leave when its authentic GPU gateway is retired');
  assert.equal(bridge(snapshot,{...held,submittedFrames:20},prior,options),null,
    'the fixed 20-return safety ceiling remains and no ghost camera follows the F9 adventure');
  assert.equal(bridge({...snapshot,runToken:'foreign'},held,prior,options),null);
  assert.equal(bridge({...snapshot,lastGuardianCrossing:{
    ...snapshot.lastGuardianCrossing,
    guardian:{kind:'guardian',active:true,health:1}}},held,prior,options),null,
    'a live guardian never creates a false opened-gateway camera bridge');
  assert.equal(bridge(snapshot,held,prior,{...options,camera:'manual'}),null,
    'manual camera remains authoritative to the user');
});
