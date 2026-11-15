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
test('observed tick-535 first real f9:p2 standing height BELOW the old 160000 ceiling keeps the authentic original gate',async()=>{
  const {observedSourcePhysicalArrivalPalette,observedSourceGatewayDeparturePresence}=await palette;
  const {observedSourceBoundColdDoorwayLens}=await lens;
  const {pointFor}=await coords;
  const {source,held}=crossing();
  // Based on the original 1x source trace: old f8 cap top 3,224,000,
  // first raised F9 route stalls/stands at body y 3,364,000 (halfHeight 14,000)
  // on the real target f9:p2. Its soles are only 126,000 above the old roof.
  // The old ground-only condition rejected this contact even though it was
  // BELOW the 160,000 upper flight bound.
  const oldRoof=3224000;
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const exitX=cap.x+Math.floor(cap.width*.76);
  Object.assign(source,{tick:535,chunkBaseY:3212000,worldWidth:480000,
    platforms:[{id:'f9:ground',x:105000,y:3212000,width:270000,height:12000},
      {id:'f9:p2',x:320000,y:3330000,width:40000,height:20000}],
    lastGuardianCrossing:{runToken:source.runToken,fromFloor:8,toFloor:9,
      sourceTick:475,cap,exitX,crossingX:321096,halfWidth:9000,
      halfHeight:14000,guardian:{kind:'guardian',active:false,health:0}}});
  Object.assign(source.player,{x:336796,y:3364000,halfWidth:9000,
    halfHeight:14000,groundedPlatformId:'f9:p2'});
  Object.assign(held,{oldRoofY:oldRoof,thresholdX:exitX,oldCapX:cap.x,
    oldCapWidth:cap.width,sourceTick:475,crossingTick:475,
    firstWorldRenderTick:475});
  const result=observedSourcePhysicalArrivalPalette(source,held);
  assert.equal(result?.sourceBound,true,'source-authentic real 126000-unit first raised contact');
  assert.equal(observedSourceGatewayDeparturePresence(source,held)?.sourceBound,true);
  const hero=pointFor(source.player.x,source.player.y,source.chunkBaseY,source.worldWidth,25);
  assert.equal(observedSourceBoundColdDoorwayLens(source,held,hero,960/600)?.sourceBound,true);
  assert.equal(observedSourceBoundColdDoorwayLens(source,held,hero,390/844)?.sourceBound,true);
  const {sourceOriginalGatewayCameraBridge}=await import(
    '../../public/infinite-tower-climb/visuals/original-gateway-submitted-camera-bridge.mjs');
  const prior={runToken:source.runToken,floor:8,oldCapId:'f8:cap',
    originalGuardianObserved:true,originalGuardianHealth:1,
    tick:438,chunkBaseY:source.chunkBaseY,
    oldRoofY:oldRoof,thresholdX:exitX,
    camera:[22,8,36],gaze:[0,4,0]};
  assert.equal(sourceOriginalGatewayCameraBridge(source,held,prior,{camera:'follow'})?.sourceBound,true,
    'the same REAL previously submitted F8 camera must still be eligible at tick535 after authentic crossing tick475');
});

test('the real cleared first raised deck completes the old-to-new material handoff before the 70-tick source expiry, never without GPU returns',async()=>{
  const {observedSourcePhysicalArrivalPalette:paletteFn,
    observedSourceGatewayDeparturePresence:departure}=await palette;
  const {source,held}=crossing();
  // Exact source-supported f9:p2: feet 17.8m over the original roof,
  // horizontal progress is small. The former 90m Euclidean rule could not
  // finish before the original GPU gateway's bounded retirement.
  held.submittedFrames=4;held.visibleSeconds=.8;
  const earned=paletteFn(source,held);
  assert.equal(earned.sourceBound,true);
  assert.ok(earned.horizontalProgress<1);
  assert.equal(earned.verticalProgress,1);
  assert.equal(earned.physicalProgress,1);
  assert.ok(earned.progress>.2 && earned.progress<1,
    'four actual WebGL returns retain partial shared old/new material after true raised ascent');
  assert.ok(earned.oldWeight>.5 && earned.oldWeight<1);
  assert.ok(departure(source,held).opacity>.5,
    'a fourth fast renderer submission cannot hard-delete the original source gateway');
  held.submittedFrames=8;held.visibleSeconds=1.22;
  assert.equal(paletteFn(source,held).progress,1);
  assert.equal(paletteFn(source,held).oldWeight,0);
  assert.equal(departure(source,held).opacity,0);
  // No successful WebGL return: the actual old arch remains fully intact.
  held.submittedFrames=0;held.visibleSeconds=0;
  assert.equal(paletteFn(source,held).progress,0);
  assert.equal(departure(source,held).opacity,1);
  // A forged or absent elevated collision contact cannot trigger the handoff.
  source.player.groundedPlatformId='f9:phantom';
  assert.equal(paletteFn(source,held),null);
});

test('real raised platform beyond old F9 ground stays camera/material eligible but no unsupported leap or false ground contact can bridge',async()=>{
  const {observedSourcePhysicalArrivalPalette:paletteFn,
    observedSourceFloorNineRouteSupport:contact}=await palette;
  const {observedSourceBoundColdDoorwayLens:cameraFn}=await lens;
  const {pointFor}=await coords;
  const {source,held}=crossing();
  // The first old floor threshold was physically supported on F9 ground.
  // Later route geometry can extend beyond that ground into a real raised
  // source platform. A blanket ground-width check hid the earned doorway
  // even though the current skinned climber stood on the next real deck.
  source.platforms[0].width=165000; // ends at x405000
  source.platforms[1].x=406000;
  source.platforms[1].width=34000; // true p2 contact x410000..428000
  source.player.x=419000;
  const roof=source.platforms[0].y+source.platforms[0].height;
  assert.equal(source.player.x-source.player.halfWidth>
    source.platforms[0].x+source.platforms[0].width,true);
  assert.equal(contact(source,source.platforms[0],roof),true,
    'exact raised source sole+width contact is still real beyond old ground');
  const original=paletteFn(source,held);
  assert.equal(original?.sourceBound,true);
  assert.equal(original?.kind,'recorded-source-zero-hp');
  assert.equal(original?.opticalBridgeSourceBound,true);
  const hero=pointFor(source.player.x,source.player.y,
    source.chunkBaseY,source.worldWidth,25);
  for(const viewport of [960/600,390/844]){
    assert.equal(cameraFn(source,held,hero,viewport)?.sourceBound,true,
      'real original gateway remains in same source-authentic camera at both native aspects');
  }
  const originalCopy=JSON.stringify(source);
  const absent=structuredClone(source);
  absent.platforms[1].id='f9:fake-other';
  assert.equal(paletteFn(absent,held),null);
  assert.equal(cameraFn(absent,held,hero,960/600),null);
  const noContact=structuredClone(source);
  noContact.player.x=441000;
  assert.equal(paletteFn(noContact,held),null);
  assert.equal(contact(noContact,noContact.platforms[0],roof),false);
  const inventedFlight=structuredClone(source);
  inventedFlight.player.grounded=false;
  inventedFlight.player.groundedPlatformId=null;
  inventedFlight.player.state='airborne';
  inventedFlight.player.vy=500;
  assert.equal(paletteFn(inventedFlight,held),null,
    'outside old ground, an imagined airborne future landing does not extend old GPU passage');
  assert.equal(JSON.stringify(source),originalCopy,
    'camera/material witnesses are read-only and do not move authority');
});
