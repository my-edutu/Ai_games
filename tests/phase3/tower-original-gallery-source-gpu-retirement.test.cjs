'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const evidence = import('../../public/infinite-tower-climb/visuals/far-side-shaft-transition.mjs');
const make = () => {
  const cap={id:'f8:cap',x:100000,y:3188000,width:269600,height:50000};
  const thresholdX=cap.x+Math.floor(cap.width*.76);
  const source={
    runToken:'source-earned-visible-f9',lifecycle:'running',floor:9,theme:'void',tick:487,
    player:{health:5,x:thresholdX+23000,y:3252000,halfWidth:9000,halfHeight:14000,
      grounded:true,groundedPlatformId:'f9:ground',state:'standing',vy:0},
    platforms:[{id:'f9:ground',x:310000,y:3188000,width:60000,height:50000}],
    lastGuardianCrossing:{runToken:'source-earned-visible-f9',fromFloor:8,toFloor:9,
      sourceTick:475,exitX:thresholdX,cap,
      guardian:{kind:'guardian',active:false,health:0}}
  };
  const held={runToken:source.runToken,floor:9,guardianGateRetained:true,
    verifiedObservedFloorAdvance:true,oldCapId:'f8:cap',
    thresholdX,oldCapX:cap.x,oldCapWidth:cap.width,oldRoofY:3238000,
    crossingTick:475,submittedFrames:4,visibleSeconds:.38,
    originalGatewayOpacity:.85,originalGallerySourceOpacity:.08,opticalExitSubmitted:false};
  const job={runToken:source.runToken,floor:9,sourceTick:477,
    proof:'recorded-source-gateway',structureDeferred:true,
    state:'awaiting-structural-release',submittedFrames:4,structureBuiltAtSubmitted:1,
    structuralVisibleReturns:2,structuralFade:.23,structuralRoot:{visible:true}};
  return {source,held,job};
};

test('the genuine successor shaft must return twice and hero have REAL support before obsolete noncolliding gallery can be culled',async()=>{
  const {observedReturnedGalleryHandoffClearance:clear}=await evidence;
  const {source,held,job}=make();
  const before=JSON.stringify({source,held,job});
  assert.equal(clear(source,held,job)?.sourceBound,true);
  assert.equal(clear(source,held,job)?.galleryOnly,true);
  assert.equal(JSON.stringify({source,held,job}),before,'pure witness must never mutate authoritative state');
  assert.equal(clear(source,held,{...job,structuralVisibleReturns:1}),null);
  assert.equal(clear(source,held,{...job,structuralVisibleReturns:0}),null);
  assert.equal(clear(source,held,{...job,structuralRoot:{visible:false}}),null);
  assert.equal(clear(source,held,{...job,structuralFade:0}),null);
  assert.equal(clear(source,held,{...job,structureDeferred:false}),null);
  assert.equal(clear(source,held,{...job,proof:'adjacent-browser-guardian'}),null);
  assert.equal(clear(source,held,{...job,runToken:'different'}),null);
  assert.equal(clear(source,held,{...job,sourceTick:source.tick+1}),null);
  assert.equal(clear(source,held,{...job,submittedFrames:1}),null);
});

test('no inferred floor, fake guardian win, wrong cap, airborne unsupported body or new run may retire source gallery',async()=>{
  const {observedReturnedGalleryHandoffClearance:clear}=await evidence;
  const muts=[
    a=>{a.source.runToken='other';},a=>{a.source.floor=8;},
    a=>{a.source.player.health=0;},a=>{a.held.guardianGateRetained=false;},
    a=>{a.held.verifiedObservedFloorAdvance=false;},
    a=>{a.source.lastGuardianCrossing.guardian.active=true;},
    a=>{a.source.lastGuardianCrossing.guardian.health=2;},
    a=>{a.source.lastGuardianCrossing.sourceTick=474;},
    a=>{a.source.player.groundedPlatformId='invented';},
    a=>{a.source.player.y+=14000;},
    a=>{a.source.player.x=a.held.thresholdX;},
    a=>{a.source.player.vy=900;},
    a=>{a.source.platforms[0].y+=40000;},
    a=>{a.held.visibleSeconds=0;},
    a=>{a.held.submittedFrames=0;},
    a=>{a.held.oldCapWidth+=10000;}
  ];
  for(const mutate of muts){const a=make();mutate(a);
    assert.equal(clear(a.source,a.held,a.job),null);}
});

test('shipped world culls only detached historical noncolliding gallery after exact source and returned-Void proof, not HP gate or walkable decks',()=>{
  const world=fs.readFileSync(path.join(__dirname,'../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/observedReturnedGalleryHandoffClearance\(snapshot,held,deferredDistantArrival\)/);
  assert.match(world,/held\.galleryExitClearedAlpha=0/);
  assert.match(world,/held\.originalGalleryRoot\.visible=originalPresence>\.015/);
  assert.match(world,/held\.originalGatewayOpacity=originalGatePresence/);
  assert.match(world,/const arrival=platforms\.get\('f9:ground'\)\?\.arrivalSurface/);
  assert.doesNotMatch(world,/snapshot\.player\.(?:x|y|grounded)\s*=/);
});
