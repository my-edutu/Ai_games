'use strict';
// P0 native Floor8->9: a partial camera/horizon witness must not re-certify
// the already validated old GPU mesh colors with missing World-owned fields.
const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs');
const helper=import('../../public/infinite-tower-climb/visuals/biome-threshold.mjs');
const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
const thresholdX=cap.x+Math.floor(cap.width*.76),roofY=cap.y+cap.height;
const source={runToken:'verified-source-run',lifecycle:'running',floor:9,theme:'void',
  tick:511,player:{health:4},
  lastGuardianCrossing:{runToken:'verified-source-run',sourceTick:475,
    fromFloor:8,toFloor:9,exitX:thresholdX,cap,
    guardian:{kind:'guardian',active:false,health:0}}};
const receipt={runToken:source.runToken,floor:9,sourceTick:476,
  crossingTick:475,firstWorldRenderTick:476,guardianGateRetained:true,
  oldCapId:'f8:cap',oldRoofY:roofY,thresholdX,oldCapX:cap.x,oldCapWidth:cap.width,
  submittedFrames:12,visibleSeconds:1.2,originalGatewayOpacity:.1205,
  originalArchitectureCoverage:.04,originalArchitectureWorldCertified:true,
  originalArchitectureCoverageSourceTick:511};
test('World current source-owned GPU old-room coverage is used without re-certifying an incomplete public camera witness',async()=>{
 const {observedSourceOwnedOriginalWorldLightReceipt:read}=await helper;
 const frozen=JSON.stringify([source,receipt]),got=read(source,receipt);
 assert.deepEqual(got,{originalGatewayOldWeight:.1205,
   originalArchitectureOldWeight:.04,sourceBound:true,sourceTick:511});
 assert.equal(JSON.stringify([source,receipt]),frozen,'never mutate source, World material, or GPU receipt');
});
test('current immutable source and original WebGL owner must match exactly, without stale/forged previous-run sky',async()=>{
 const {observedSourceOwnedOriginalWorldLightReceipt:read}=await helper;
 const mutants=[
  [{...source,runToken:'another-run'},receipt],
  [{...source,tick:512},receipt],
  [{...source,floor:8},receipt],
  [{...source,theme:'clockwork'},receipt],
  [{...source,lifecycle:'outcome'},receipt],
  [{...source,player:{health:0}},receipt],
  [{...source,lastGuardianCrossing:null},receipt],
  [{...source,lastGuardianCrossing:{...source.lastGuardianCrossing,
    guardian:{kind:'guardian',active:true,health:1}}},receipt],
  [{...source,lastGuardianCrossing:{...source.lastGuardianCrossing,
    sourceTick:476}},receipt],
  [source,{...receipt,runToken:'another-run'}],
  [source,{...receipt,originalArchitectureWorldCertified:false}],
  [source,{...receipt,originalArchitectureCoverageSourceTick:510}],
  [source,{...receipt,oldRoofY:roofY+1}],
  [source,{...receipt,originalArchitectureCoverage:-.01}],
  [source,{...receipt,originalGatewayOpacity:1.1}],
  [source,{...receipt,submittedFrames:31}],
  [source,{...receipt,visibleSeconds:3.5}],
 ];
 for(const [s,h] of mutants)
   assert.equal(read(s,h),null,'unmatched run, old gateway, stale scene or invalid palette vetoes');
});
test('actual Three World exports same-source original GPU color and biome sky consumes it before deciding horizon',()=>{
 const world=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
 const biome=fs.readFileSync('public/infinite-tower-climb/visuals/biome-threshold.mjs','utf8');
 assert.match(world,/originalArchitectureWorldCertified:true/);
 assert.match(world,/originalArchitectureCoverageSourceTick:snapshot\.tick/);
 assert.match(world,/snapshot !== lastSnapshot/);
 assert.match(biome,/observedSourceOwnedOriginalWorldLightReceipt\(frame,retainedCap\)/);
 assert.match(biome,/worldMaterialReceipt\?\.originalArchitectureOldWeight/);
 assert.match(biome,/worldMaterialReceipt\?\.originalGatewayOldWeight/);
});
