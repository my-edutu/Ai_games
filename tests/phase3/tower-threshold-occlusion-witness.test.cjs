'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),path=require('node:path');
const file=pathToFileURL(path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/threshold-occlusion-witness.mjs')).href;
const load=()=>import(file);
const sample=()=>({runToken:'real-run',lifecycle:'running',floor:8,theme:'clockwork',
  tick:458,worldWidth:1000000,guardianExitX:760000,
  player:{health:4,x:758000,y:102000,halfWidth:4500,halfHeight:9800},
  platforms:[{id:'f8:cap',x:0,y:100000,width:1000000,height:2000}],
  enemies:[{kind:'guardian',active:false,health:0}]});
test('only genuine defeated source guardian near exact exit qualifies on Floor 8',async()=>{
  const {observedOriginalDoorwayOcclusionWindow:check}=await load();
  const a=sample();a.guardianExitX=760000;
  const ok=check(a);assert.equal(ok?.kind,'actual-defeated-guardian-open-clockwork');
  assert.equal(ok.roofY,102000);
  const alive=sample();alive.enemies[0].active=true;alive.enemies[0].health=2;
  assert.equal(check(alive),null);
  const wrong=sample();wrong.guardianExitX++;assert.equal(check(wrong),null);
  const far=sample();far.player.x=10000;assert.equal(check(far),null);
});
test('Floor 9 requires retained same-run original gate plus immutable crossing or strictly bounded receipt',async()=>{
 const {observedOriginalDoorwayOcclusionWindow:check}=await load();
 const a=sample();a.floor=9;a.theme='void';a.tick=477;a.player.x=777000;
 const held={guardianGateRetained:true,runToken:'real-run',floor:9,thresholdX:760000,
  oldRoofY:102000,sourceTick:475,tick:475,verifiedObservedFloorAdvance:true,observedCrossingX:777000};
 const receipt=check(a,held);
 assert.equal(receipt?.kind,'verified-original-roof-receipt-not-immutable');
 a.tick=500;assert.equal(check(a,held),null);
 a.lastGuardianCrossing={runToken:'real-run',fromFloor:8,toFloor:9,
  guardian:{kind:'guardian',active:false,health:0},cap:{id:'f8:cap',y:100000,height:2000},
  sourceTick:475,exitX:760000};
 assert.equal(check(a,held)?.kind,'immutable-defeated-guardian-original-gateway');
 assert.equal(check(a,{...held,runToken:'old-run'}),null);
 a.tick=548;assert.equal(check(a,held),null);
});
test('seven physical ray endpoints retain true body width and original gate without invented future point',async()=>{
 const {actualOriginalDoorwaySightlineEndpoints:ends}=await load();
 const pts=ends({x:0,y:1,z:0},{x:4,y:4,z:8},2,1,{x:8,y:5,z:12});
 assert.equal(pts.length,7);
 assert.deepEqual(pts.map(x=>x.kind),['real-body-centre','real-body-helmet',
 'real-left-shoulder','real-right-shoulder','real-body-sole','original-gate-centre','original-gate-lip']);
 assert.notDeepEqual(pts[2].point,pts[3].point);
 assert.deepEqual(pts[5].point,[8,5,12]);
 assert.deepEqual(ends({x:0,y:0,z:0},{x:0,y:0,z:0},2,1,{x:1,y:1,z:1}),[]);
});
