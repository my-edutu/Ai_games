'use strict';
// Tests genuine far-side source validation and the new returned-material lease.
// The 1x desktop/portrait film, source-to-PTS calibration and 5 independent
// reviewers remain separate mandatory acceptance evidence.
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const loader=import(pathToFileURL(path.join(__dirname,
  '../../public/infinite-tower-climb/visuals/far-side-shaft-transition.mjs')).href);
function realDeparture(){
  const oldRoofY=3236000, oldCapX=115200, oldCapWidth=249600;
  const thresholdX=oldCapX+Math.floor(oldCapWidth*.76);
  const source={runToken:'earned-guardian-episode',tick:508,
    floor:9,theme:'void',lifecycle:'running',
    player:{x:320000,y:oldRoofY+80000+14000,halfWidth:8000,
      halfHeight:14000,health:5,state:'airborne',grounded:false,
      groundedPlatformId:null,vy:9000},
    platforms:[{id:'f9:ground',x:0,width:480000,y:oldRoofY-12000,height:12000}],
    lastGuardianCrossing:{runToken:'earned-guardian-episode',
      fromFloor:8,toFloor:9,sourceTick:475,
      cap:{id:'f8:cap',x:oldCapX,y:oldRoofY-12000,width:oldCapWidth,height:12000},
      exitX:thresholdX,guardian:{kind:'guardian',active:false,health:0}}};
  const held={runToken:source.runToken,floor:9,
    guardianGateRetained:true,verifiedObservedFloorAdvance:true,
    oldCapId:'f8:cap',oldCapX,oldCapWidth,oldRoofY,thresholdX,
    sourceTick:482,firstWorldRenderTick:482,crossingTick:475,
    submittedFrames:3,visibleSeconds:.19,
    originalGatewayOpacity:.84,opticalExitSubmitted:false,
    lastReturnedOldGatewayOpacity:.84,
    lastReturnedOriginalGalleryOpacity:.77,
    lastReturnedOldGatewayTick:506};
  const job={runToken:source.runToken,floor:9,
    sourceTick:482,proof:'recorded-source-gateway',
    structureDeferred:true,state:'awaiting-structural-submission',
    submittedFrames:3,structuralVisibleReturns:0};
  return {source,held,job};
}
test('only authentic far-side Floor9 path retains LAST RETURNED bronze before void is actually painted',async()=>{
  const {observedEarnedFarSideShaftOverlap:far,
    observedReturnedOriginalArchitectureHold:hold}=await loader;
  const {source,held,job}=realDeparture();
  const original=JSON.stringify({source,held,job});
  const proof=far(source,held,job);
  assert.equal(proof?.wholeBodyFarSide,true);
  assert.equal(proof?.incomingReturnedFrames,0);
  const memory=hold(source,held,job,proof);
  assert.equal(memory?.gateOpacity,.84);
  assert.equal(memory?.galleryOpacity,.77);
  assert.equal(memory?.incomingReturnedFrames,0);
  assert.equal(JSON.stringify({source,held,job}),original,'pure presenter never mutates real source');
});
test('shader source, run, death, previous-frame and resource bounds veto invented historical scenery',async()=>{
  const {observedEarnedFarSideShaftOverlap:far,
    observedReturnedOriginalArchitectureHold:hold}=await loader;
  const {source,held,job}=realDeparture(),proof=far(source,held,job);
  assert.ok(proof);
  assert.equal(hold({...source,runToken:'restart'},held,job,proof),null);
  assert.equal(hold({...source,lifecycle:'result'},held,job,proof),null);
  assert.equal(hold({...source,player:{...source.player,health:0}},held,job,proof),null);
  assert.equal(hold({...source,tick:659},held,job,proof),null);
  assert.equal(hold(source,{...held,submittedFrames:0},job,proof),null);
  assert.equal(hold(source,{...held,lastReturnedOldGatewayOpacity:0},job,proof),null);
  const retiredGallery=hold(source,
    {...held,lastReturnedOriginalGalleryOpacity:0},job,proof);
  assert.equal(retiredGallery?.gateOpacity,.84,
    'a real returned HP-open gate must survive independently of retired decorative steel');
  assert.equal(retiredGallery?.galleryOpacity,0,
    'the previously zero-alpha noncolliding bronze gallery cannot be resurrected');
  assert.equal(hold(source,{...held,lastReturnedOriginalGalleryOpacity:-.01},job,proof),null);
  assert.equal(hold(source,{...held,lastReturnedOriginalGalleryOpacity:1.01},job,proof),null);
  assert.equal(hold(source,{...held,visibleSeconds:2.8},job,proof),null);
  assert.equal(hold(source,{...held,firstWorldRenderTick:481},job,proof),null);
  assert.equal(hold(source,held,{...job,structuralVisibleReturns:1},proof),null,
    'first genuinely visible successor-shaft return ends the bronze hold');
  assert.equal(hold(source,held,{...job,state:'complete'},proof),null);
  assert.equal(hold(source,held,job,{...proof,sourceTick:507}),null);
  assert.equal(hold(source,held,job,{...proof,incomingReturnedFrames:1}),null);
  assert.equal(hold(source,held,job,null),null);
});
test('source-supported near-roof crossing preserves returned bronze climate only until real successor paint',async()=>{
  const {observedEarnedFarSideShaftOverlap:far,
    observedReturnedOriginalArchitectureHold:hold}=await loader;
  const {source,held,job}=realDeparture();
  // The real successor ground shares the original roof. Standing 12m past
  // the HP-open threshold is NOT the raised/far-side case (>7m sole rise).
  source.player={...source.player,x:held.thresholdX+12000,
    y:held.oldRoofY+source.player.halfHeight,
    grounded:true,groundedPlatformId:'f9:ground',state:'standing',vy:0};
  assert.equal(far(source,held,job),null);
  const lock=hold(source,held,job,null);
  assert.equal(lock?.gateOpacity,.84);
  assert.equal(lock?.galleryOpacity,.77);
  assert.equal(lock?.incomingReturnedFrames,0);
  assert.equal(hold(source,held,{...job,structuralVisibleReturns:1},null),null,
    'the first real incoming core return must end the retained old climate');
  assert.equal(hold({...source,runToken:'other-run'},held,job,null),null);
  assert.equal(hold({...source,lastGuardianCrossing:{...source.lastGuardianCrossing,
    guardian:{kind:'guardian',active:true,health:1}}},held,job,null),null);
  assert.equal(hold({...source,player:{...source.player,
    grounded:false,groundedPlatformId:null}},held,job,null),null);
});
test('production World uses real render submission owner and expires lease into normal far-side fade',()=>{
  const fs=require('node:fs');
  const w=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(w,/held\.lastReturnedOldGatewayOpacity=Math\.max\(0,/);
  assert.match(w,/const returnedBronzeHold=!options\\.stale\\s*\\?observedReturnedOriginalArchitectureHold\\(/,
    'active old-departure witness must not bypass the last returned gate');
  assert.match(w,/const returnedBronzePaletteLock=!options\\.stale && !options\\.reducedMotion\\s*\\?observedReturnedOriginalArchitectureHold\\(/);
  assert.match(w,/const oldRoomWitness=farSideHorizon \\|\\| returnedBronzePaletteLock/,
    'near roof and raised ascent share a single source-returned world climate');
  assert.match(w,/if\\(oldRoomWitness\\) departure=Math\\.min\\(departure,1-certifiedOldRoomWeight\\)/);
  assert.match(w,/held\.lastReturnedOriginalGalleryOpacity=Math\.max\(0,/);
  assert.match(w,/observedReturnedOriginalArchitectureHold\(\s*snapshot,held,deferredDistantArrival,farSide\)/);
  assert.match(w,/returnedBronzeHold\?\.gateOpacity\?\?sourceDeparture\?\.opacity/);
  assert.match(w,/returnedBronzeHold\.galleryOpacity/);
  assert.match(w,/observedReturnedFarSideFade\(held,deferredDistantArrival\)/);
});
