'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const helper=import('../../public/infinite-tower-climb/visuals/source-physical-receiving-roof.mjs');
const p={id:'f9:ground',x:0,width:480000};
const old={id:'f8:cap',x:115200,width:249600};
const threshold=304896;

test('the one authenticated original gateway creates a connected, roof-aligned open canopy beyond its actual sill',async()=>{
 const {actualGatewayReceivingGalleryCanopy:plan}=await helper;
 const result=plan(p,480000,threshold,old);
 assert.ok(result);
 assert.equal(result.sourceBound,true);
 assert.equal(result.nonColliding,true);
 assert.equal(result.oldCapId,'f8:cap');
 assert.equal(result.receivingPlatformId,'f9:ground');
 assert.equal(result.stations.length,6);
 assert.equal(result.ties.length,5);
 assert.ok(result.stations[0].sourceX<threshold);
 assert.ok(result.stations.at(-1).sourceX>threshold+48000);
 assert.ok(result.innerPierRadius<22.4 && result.outerCrownRadius>27.18,
  'the original walkable collision ring has no new upright obstruction');
 assert.ok(result.minHeroRoofClearance>6);
 const kinds=new Set(result.stations.map(s=>s.kind));
 assert.ok(kinds.has('approach') && kinds.has('threshold') && kinds.has('successor'));
 for(let i=0;i<result.stations.length;i++){
  const s=result.stations[i];
  assert.ok(s.sourceX>p.x && s.sourceX<p.x+p.width);
  assert.ok(Math.abs(s.angle-((s.sourceX-p.width/2)/480000)*2.2)<1e-10);
  if(i){
   assert.ok(s.sourceX>result.stations[i-1].sourceX);
   assert.ok(s.angle-result.stations[i-1].angle<.25);
   assert.equal(result.ties[i-1].fromAngle,result.stations[i-1].angle);
   assert.equal(result.ties[i-1].toAngle,s.angle);
  }
 }
});
test('the architectural continuation never appears without the actual grounded receiving roof and source cap',async()=>{
 const {actualGatewayReceivingGalleryCanopy:plan}=await helper;
 for(const [deck,cap,gateway] of [
  [{...p,id:'f9:p2'},old,threshold],
  [p,{...old,id:'f7:cap'},threshold],
  [p,{...old,x:0,width:100000},threshold],
  [p,old,NaN],[p,old,470000],
  [{...p,width:120000},old,threshold],
 ])assert.equal(plan(deck,480000,gateway,cap),null);
 assert.equal(plan(p,480000,threshold,old,Math.PI*1.5),null);
});
test('real source-owned 3D members form an original open room, not a second doorway, new physics or foreground posts',()=>{
 const world=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
 assert.match(world,/const gatewayCanopy=gatewayLoadPath && arrivalRoutePalette\?\.roofJoin/);
 assert.match(world,/actualGatewayReceivingGalleryCanopy\(p,width/);
 assert.match(world,/SourceEarnedPhysicalGatewayReceivingCanopy/);
 assert.match(world,/root\.add\(canopy\)/);
 assert.match(world,/point\(t,inboard,-1\.2\).*?point\(t,inboard,7\.3\)/);
 assert.match(world,/point\(t,inboard,7\.3\).*?point\(t,outboard,8\.35\)/);
 assert.match(world,/point\(tie.fromAngle,inboard,7\.3\)/);
 assert.match(world,/point\(tie.fromAngle,outboard,8\.35\)/);
 assert.match(world,/ambientDetail:true,receivingRoofCanopy:true/);
 assert.doesNotMatch(world,/platforms\.set\(['"]SourceEarnedPhysicalGatewayReceivingCanopy/);
 assert.doesNotMatch(world,/guardianGate\s*=\s*canopy|snapshot\.floor\s*=\s*9/);
});
