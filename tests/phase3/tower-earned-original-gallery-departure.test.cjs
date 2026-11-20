'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const helper=import('../../public/infinite-tower-climb/visuals/far-side-shaft-transition.mjs');
const original=()=>({
 lifecycle:'running',runToken:'authentic-guardian-passage',floor:9,theme:'void',tick:480,
 player:{health:5,x:326000,y:3252000,halfWidth:9000,halfHeight:14000,
   grounded:true,groundedPlatformId:'f9:ground',state:'standing',vy:0},
 platforms:[{id:'f9:ground',kind:'static',x:310000,y:3188000,width:60000,height:50000}],
 lastGuardianCrossing:{runToken:'authentic-guardian-passage',fromFloor:8,toFloor:9,
  sourceTick:451,exitX:304896,cap:{id:'f8:cap',x:100000,width:269600,y:3188000,height:50000},
  guardian:{kind:'guardian',active:false,health:0}}
});
function fixture() {
 const source=original();
 // The old roof is the exact top of BOTH the original F8 cap and F9 ground.
 const held={runToken:source.runToken,floor:9,oldCapId:'f8:cap',
  guardianGateRetained:true,verifiedObservedFloorAdvance:true,
  thresholdX:304896,oldCapX:100000,oldCapWidth:269600,
  oldRoofY:3238000,crossingTick:451,
  submittedFrames:1,visibleSeconds:.1,
  originalGatewayOpacity:1,originalGallerySourceOpacity:.94,
  opticalExitSubmitted:false};
 source.lastGuardianCrossing.cap.y=3188000;
 source.lastGuardianCrossing.cap.height=50000;
 source.platforms[0].y=3188000;
 source.platforms[0].height=50000;
 source.player.y=3252000;
 return {source,held};
}
test('crossed source-verified body lets only noninteractive ORIGINAL gallery recede over actual returned frames',async()=>{
 const {observedEarnedGalleryExitClearance:clear}=await helper;
 const {source,held}=fixture();
 const sourceBefore=JSON.stringify(source),heldBefore=JSON.stringify(held);
 const first=clear(source,held);
 assert.equal(first?.sourceBound,true);
 assert.ok(first.maxOpacity<.94 && first.maxOpacity>.08);
 const next=clear({...source,tick:481},{...held,submittedFrames:2,visibleSeconds:.2});
 const final=clear({...source,tick:482},{...held,submittedFrames:3,visibleSeconds:.3});
 assert.ok(next.maxOpacity<first.maxOpacity);
 assert.ok(final.maxOpacity<=.1);
 assert.equal(JSON.stringify(source),sourceBefore);
 assert.equal(JSON.stringify(held),heldBefore);
 assert.equal(first.affectedMeshes,'historical-noncolliding-gallery-only');
 assert.equal(held.originalGatewayOpacity,1);
});
test('source-authentic first F9 walk clears old noncolliding bronze braces before cold Void world replaces them',async()=>{
 const {observedEarnedGalleryExitClearance:clear}=await helper;
 const real=fixture();
 // Exact first F9 body model: grounded real f9:ground, entire 18m-wide
 // character ahead of the original source threshold, first old GPU return.
 real.source.player.x=333296;
 real.held.submittedFrames=1;
 real.held.visibleSeconds=.1;
 const early=clear(real.source,real.held);
 assert.equal(early?.sourceBound,true);
 assert.ok(early.maxOpacity<.5,
   'genuine far-side full-body clears detached bronze posts in the first returned room');
 // A JUST-cleared actor keeps more original load structure during the
 // actual opening, before the moving body has vacated the true sill.
 real.source.player.x=318996;
 const near=clear(real.source,real.held);
 assert.equal(near?.sourceBound,true);
 assert.ok(near.maxOpacity>early.maxOpacity+.15,
   'clearance must reflect real signed body passage, not a floor label');
 assert.equal(real.held.originalGatewayOpacity,1,
   'actual HP-open physical gate stays fully visible');
 assert.equal(real.held.originalGallerySourceOpacity,.94,
   'World, never this pure source witness, owns material updates');
 const unreturned=clear(real.source,{...real.held,submittedFrames:0,
   visibleSeconds:0});
 assert.equal(unreturned,null,
   'source progress alone cannot age the original GPU gallery');
});
test('never recede original gallery from a floor label, stale run, fake win, unsupported hero or unreturned renderer',async()=>{
 const {observedEarnedGalleryExitClearance:clear}=await helper;
 const cases=[
  ({source})=>{source.floor=8;},
  ({source})=>{source.theme='clockwork';},
  ({source})=>{source.runToken='other';},
  ({held})=>{held.guardianGateRetained=false;},
  ({held})=>{held.verifiedObservedFloorAdvance=false;},
  ({held})=>{held.submittedFrames=0;held.visibleSeconds=0;},
  ({source})=>{source.player.health=0;},
  ({source})=>{source.player.x=304896;},
  ({source})=>{source.player.groundedPlatformId='unknown';},
  ({source})=>{source.player.vy=600;},
  ({source})=>{source.lastGuardianCrossing.guardian.active=true;},
  ({source})=>{source.lastGuardianCrossing.guardian.health=1;},
  ({source})=>{source.lastGuardianCrossing.sourceTick=490;},
  ({source})=>{source.lastGuardianCrossing.cap.id='imaginary';},
  ({source})=>{source.platforms[0].y+=10000;},
  ({held})=>{held.oldCapId='unrelated';},
  ({held})=>{held.opticalExitSubmitted=true;},
 ];
 for(const change of cases){
  const inputs=fixture();change(inputs);
  assert.equal(clear(inputs.source,inputs.held),null);
 }
});
test('real low airborne exit and upper supported destination preserve gateway, with reduced motion non-animated',async()=>{
 const {observedEarnedGalleryExitClearance:clear}=await helper;
 const {source,held}=fixture();
 const flight={...source,player:{...source.player,y:3282000,
  grounded:false,groundedPlatformId:null,state:'airborne',vy:12500}};
 assert.ok(clear(flight,held)?.sourceBound);
 assert.equal(clear(flight,{...held,submittedFrames:0}),null);
 const raised={...source,platforms:[...source.platforms,
  {id:'f9:p2',x:315000,width:30000,y:3312000,height:50000}],
  player:{...source.player,x:330000,y:3376000,
   groundedPlatformId:'f9:p2'}};
 assert.ok(clear(raised,held)?.sourceBound);
 const reduced=clear(source,held,{reducedMotion:true});
 assert.equal(reduced.maxOpacity,.08);
});
test('real world retires only old noninteractive gallery; keeps original gate and genuine F9 deck opaque',()=>{
 const world=fs.readFileSync(path.join(__dirname,'../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
 assert.match(world,/observedEarnedGalleryExitClearance\(snapshot,held/);
 assert.match(world,/held\.galleryExitClearedAlpha/);
 assert.match(world,/Math\.min\(originalPresence,held\.galleryExitClearedAlpha\)/);
 assert.match(world,/held\.originalGatewayOpacity=originalGatePresence/);
 assert.match(world,/if\s*\(held\.originalDeckSurface\)/);
 assert.doesNotMatch(world,/snapshot\.player\.(?:x|y|state)\s*=/);
});
