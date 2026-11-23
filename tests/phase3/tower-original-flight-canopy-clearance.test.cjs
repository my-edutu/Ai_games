'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const helper=import('../../public/infinite-tower-climb/visuals/source-physical-receiving-roof.mjs');
const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
const threshold=cap.x+Math.floor(cap.width*.76);

test('the ONE original prepainted Clockwork roof opens enough THREE-dimensional headroom for the source-observed first F9 flight',async()=>{
 const {prebuildOriginalGuardianCanopyPlan:plan,sourceOpenGuardianRoofLoadPath:open}=await helper;
 const p=plan(cap,480000,threshold),room=open(p);
 assert.ok(room,'the physical F8 guardian roof must produce one connected original canopy');
 assert.deepEqual(room.flightCanopyClearance,{
  innerCrownY:16.4,outerCrownY:18.2,highBraceY:19.2,
  minAirborneBodyRoofClearance:14.0
 });
 assert.ok(room.flightCanopyClearance.innerCrownY>14,
  'roof steel at 7.3m cuts through the authentic ~10m first-raised flight plus body');
 assert.ok(room.flightCanopyClearance.outerCrownY>room.flightCanopyClearance.innerCrownY);
 assert.equal(room.supportStations.length,2);
 assert.equal(room.overheadTies.length,5);
 assert.equal(room.compressionBraces.length,4);
 assert.equal(room.omittedLegSourceXs.length,4);
 assert.equal(open({...p,sourceBound:false}),null);
 assert.equal(open({...p,nonColliding:false}),null);
});

test('the actual F8 GPU-owned canopy rebuilds ALL tied overhead steel above first F9 jump without creating a second door or collision',()=>{
 const world=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
 assert.match(world,/const canopyAir=sourceOpening\?\.flightCanopyClearance/);
 assert.match(world,/point\(a,inner,canopyAir\.innerCrownY\)/);
 assert.match(world,/point\(a,outer,canopyAir\.outerCrownY\)/);
 assert.match(world,/point\(tie\.fromAngle,inner,canopyAir\.innerCrownY\)/);
 assert.match(world,/point\(tie\.fromAngle,outer,canopyAir\.outerCrownY\)/);
 assert.match(world,/point\(brace\.toAngle,outer,canopyAir\.highBraceY\)/);
 assert.match(world,/SourcePrepaintedOriginalGuardianReceivingCanopy/);
 assert.match(world,/const inheritedCanopy=sharedPhysicalRoof/);
 assert.doesNotMatch(world,/platforms\.set\(['"]SourcePrepaintedOriginalGuardianReceivingCanopy/);
 assert.doesNotMatch(world,/snapshot\.player\.(?:x|y|grounded)\s*=/);
});
