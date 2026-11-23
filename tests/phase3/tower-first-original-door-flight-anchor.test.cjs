'use strict';
// P0 real source-frame regression: 51675311 first Floor9 desktop/portrait
// returns, tick 505 grounded -> tick 511 first real raised movement.
// Pure 3D presentational tests; NOT evidence of native pixel acceptance.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const contract=import('../../public/infinite-tower-climb/visuals/source-returned-original-gateway-exit.mjs');
const token='source-authenticated-guardian-episode';
const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
const oldRoofY=cap.y+cap.height, exitX=cap.x+Math.floor(cap.width*.76);
function sourceEpisode(){
 const observedCrossingX=333296;
 const source={runToken:token,floor:9,theme:'void',lifecycle:'running',
   tick:505,player:{health:4,x:observedCrossingX,
     y:oldRoofY+14000,halfWidth:9000,halfHeight:14000,
     grounded:true,groundedPlatformId:'f9:ground',state:'standing'},
   platforms:[{id:'f9:ground',x:cap.x,y:cap.y,width:cap.width,height:cap.height}],
   lastGuardianCrossing:{runToken:token,fromFloor:8,toFloor:9,
     sourceTick:473,cap,exitX,crossingX:exitX,
     guardian:{kind:'guardian',active:false,health:0}}};
 const held={runToken:token,floor:9,guardianGateRetained:true,
   verifiedObservedFloorAdvance:true,oldCapId:'f8:cap',
   oldCapX:cap.x,oldCapWidth:cap.width,oldRoofY,thresholdX:exitX,
   crossingTick:473,firstWorldRenderTick:480,sourceTick:480,
   observedCrossingX:321096,observedCrossingY:oldRoofY+14000,
   observedHalfWidth:9000,observedHalfHeight:14000,
   firstSubmittedBodyTick:480,firstSubmittedBodyX:observedCrossingX,
   firstSubmittedBodyY:oldRoofY+14000,
   firstSubmittedBodyHalfWidth:9000,firstSubmittedBodyHalfHeight:14000,
   firstSubmittedBodyGroundedRoof:true,
   submittedFrames:16,visibleSeconds:1.05,originalGatewayOpacity:.8758};
 const job={runToken:token,floor:9,proof:'recorded-source-gateway',
   structureDeferred:true,sourceTick:480,
   structuralVisibleReturns:16,structuralVisibleSeconds:1.05};
 return {source,held,job};
}
test('same-run first returned roof stance is stable across earlier published HP-zero crossing',async()=>{
 const {sourceReturnedOriginalDepartureProgress:progress,
   sourceReturnedOriginalGatewayOpacity:opacity}=await contract;
 const {source,held,job}=sourceEpisode();
 assert.equal(progress(source,held),0);
 assert.equal(opacity(source,held,job,0,true),held.originalGatewayOpacity,
   'a visibly stationary source climber must not lose gateway on WebGL return cadence');
 const flying={...source,tick:511,player:{...source.player,
   x:337796,y:oldRoofY+14000+57000,grounded:false,
   groundedPlatformId:null,state:'airborne'}};
 const departure=progress(flying,held);
 assert.ok(departure>.62&&departure<.68,
   'only 4.5m horizontal and 57m vertical genuine travel can earn fade');
 const alpha=opacity(flying,held,job,0,true);
 assert.ok(alpha>.3&&alpha<.7,
   'original passage should remain readable during first source-earned jump');
 assert.ok(alpha<held.originalGatewayOpacity,
   'real climbing must still retire returned old steel monotonically');
 const reversed={...flying,player:{...flying.player,
   x:330296,y:oldRoofY+14000,grounded:true,
   groundedPlatformId:'f9:ground',state:'standing'}};
 assert.equal(progress(reversed,held),0);
 assert.equal(opacity(reversed,held,job,0,true),held.originalGatewayOpacity);
});
test('first returned grounded receipt is required; inferred and unsubmitted body positions cannot shift the optical origin',async()=>{
 const {sourceReturnedOriginalDepartureProgress:progress}=await contract;
 const {source,held}=sourceEpisode();
 const unsubmitted={...held,firstSubmittedBodyGroundedRoof:false};
 assert.ok(progress(source,unsubmitted)>.19&&progress(source,unsubmitted)<.22,
   'authentic source crossing precedes first GPU-painted stance');
 const wrongBody={...held,firstSubmittedBodyTick:999};
 assert.equal(progress(source,wrongBody),progress(source,unsubmitted));
 const wrongRoof={...held,firstSubmittedBodyY:oldRoofY+15000};
 assert.equal(progress(source,wrongRoof),progress(source,unsubmitted));
 const noSubmission={...held,submittedFrames:0};
 assert.equal(progress(source,noSubmission),progress(source,unsubmitted));
});
test('World stamps the first F9 grounded body only after a real renderer success',()=>{
 const fs=require('node:fs');
 const path=require('node:path');
 const world=fs.readFileSync(path.resolve(__dirname,
   '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
 assert.match(world,/function noteFrameSubmitted\(snapshot,/);
 assert.match(world,/held\.firstSubmittedBodyTick=snapshot\.tick/);
 assert.match(world,/held\.submittedFrames===0/);
 assert.match(world,/returnedBody\.groundedPlatformId==='f9:ground'/);
});
test('missing genuine departure proof is not complete departure; wrong runs cannot revive metal',async()=>{
 const {sourceReturnedOriginalDepartureProgress:progress,
   sourceReturnedOriginalGatewayOpacity:opacity}=await contract;
 const {source,held,job}=sourceEpisode();
 const broken={...source,lastGuardianCrossing:{
   ...source.lastGuardianCrossing,crossingX:NaN}};
 assert.equal(progress(broken,held),null);
 assert.equal(opacity(broken,held,job,0,true),held.originalGatewayOpacity,
   'unproven physical departure cannot erase an already returned valid old gateway');
 assert.equal(opacity({...source,runToken:'another-run'},held,job,0,true),0);
 assert.equal(opacity({...source,player:{...source.player,health:0}},held,job,.3,true),.3);
 assert.equal(opacity(source,{...held,originalGatewayOpacity:0},job,1,true),0,
   'retired source-bound old metal can never brighten after a later poll');
});
test('pure doorway presentation cannot alter authoritative source, guardian or renderer owners',async()=>{
 const {sourceReturnedOriginalGatewayOpacity:opacity}=await contract;
 const {source,held,job}=sourceEpisode(), before=JSON.stringify({source,held,job});
 opacity(source,held,job,0,true);
 assert.equal(JSON.stringify({source,held,job}),before);
});