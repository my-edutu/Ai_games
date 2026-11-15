'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const palette=import('../../public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs');
const lens=import('../../public/infinite-tower-climb/visuals/cold-doorway-camera.mjs');
const coords=import('../../public/infinite-tower-climb/visuals/coordinates.mjs');
function crossing(){
  const cap={id:'f8:cap',x:250000,y:80000,width:160000,height:2000};
  const exitX=cap.x+Math.floor(cap.width*.76),crossingX=exitX+19000;
  const runToken='original-raised-route';
  const source={runToken,lifecycle:'running',floor:9,theme:'void',tick:498,
    worldWidth:480000,chunkBaseY:80000,
    player:{x:crossingX+5000,y:278000,halfWidth:9000,halfHeight:18000,
      health:5,grounded:true,groundedPlatformId:'f9:p2',state:'standing',vy:0},
    platforms:[
      {id:'f9:ground',x:240000,y:80000,width:175000,height:2000},
      {id:'f9:p2',x:380000,y:250000,width:30000,height:10000}],
    lastGuardianCrossing:{runToken,sourceTick:451,fromFloor:8,toFloor:9,
      cap,exitX,crossingX,halfWidth:9000,halfHeight:18000,
      guardian:{kind:'guardian',active:false,health:0}}};
  const held={runToken,floor:9,guardianGateRetained:true,
    oldCapId:'f8:cap',oldCapX:cap.x,oldCapWidth:cap.width,
    oldRoofY:82000,thresholdX:exitX,sourceTick:454,crossingTick:451,
    firstWorldRenderTick:475,submittedFrames:1,visibleSeconds:.12,
    originalGatewayOpacity:1,opticalExitSubmitted:false};
  return {source,held};
}
test('authentic first raised F9 landing keeps the SAME already-drawn F8 door/material/camera source during cold GPU handoff',async()=>{
  const {observedSourcePhysicalArrivalPalette,observedSourceGatewayDeparturePresence}=await palette;
  const {observedSourceBoundColdDoorwayLens}=await lens;
  const {pointFor}=await coords;
  const {source,held}=crossing();
  const arrival=observedSourcePhysicalArrivalPalette(source,held);
  assert.equal(arrival?.sourceBound,true,'real f9:p2 landing is still part of earned same-run physical route');
  assert.equal(arrival?.opticalBridgeSourceBound,true);
  assert.ok(arrival.progress>0 && arrival.progress<.1,'first genuine GPU return retains bronze material while physical hero advances');
  assert.equal(observedSourceGatewayDeparturePresence(source,held)?.sourceBound,true);
  const hero=pointFor(source.player.x,source.player.y,source.chunkBaseY,source.worldWidth,25);
  for(const aspect of [960/600,390/844]){
    const framing=observedSourceBoundColdDoorwayLens(source,held,hero,aspect);
    assert.equal(framing?.coldOriginalArch,true,'real raised route and original door remain a single follow-shot eligibility');
    assert.equal(framing?.sourceTick,source.tick);
  }
});
test('no synthetic elevated landing, out-of-range ascent, forged platform or expired source can extend original gate',async()=>{
  const {observedSourcePhysicalArrivalPalette:sample}=await palette;
  const {source,held}=crossing();
  for(const mutate of [
    s=>s.platforms.pop(),
    s=>s.platforms[1].id='f8:old',
    s=>s.platforms[1].x=100000,
    s=>s.platforms[1].y=251000,
    s=>s.player.groundedPlatformId='f9:fake',
    s=>s.player.y=340000,
    s=>s.tick=523,
    s=>s.lastGuardianCrossing.guardian.active=true,
    s=>s.runToken='another-run',
  ]){
    const s=structuredClone(source);
    mutate(s);
    assert.equal(sample(s,held),null,'must reject non-source contact or stale/mismatched guardian: '+JSON.stringify(s.player));
  }
});