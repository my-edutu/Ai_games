'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
function extract(first,last){
 const start=html.indexOf(first);
 const end=html.indexOf(last,start+first.length);
 assert.ok(start>=0&&end>start,`W408 missing real source between ${first} and ${last}`);
 return html.slice(start,end);
}
test('W408 the original market has outward front posts and legible outboard signs, not missing physical structures',()=>{
 const source=extract('function marketStallPostPlacement(', 'function marketStall(s,index)');
 const ctx={Math};
 vm.createContext(ctx);
 vm.runInContext(source,ctx,{timeout:300});
 const left={x:-5.4,z:2.25,face:1},right={x:4.45,z:2.95,face:1};
 for(const stall of [left,right,{x:4.3,z:8.5,face:-1}]){
  for(const side of [-1,1]){
   const front=ctx.marketStallPostPlacement(stall,side,stall.face);
   const back=ctx.marketStallPostPlacement(stall,side,-stall.face);
   assert.ok(Math.abs(front.x-stall.x)>Math.abs(back.x-stall.x)+.12);
   assert.equal(front.z,stall.z+stall.face*.84);
   assert.equal(back.z,stall.z-stall.face*.84);
   assert.ok(Math.abs(front.x-stall.x)<1.90,'canopy supports remain beneath the actual enlarged eaves');
  }
  const sign=ctx.marketStallSignPlacement(stall);
  assert.ok(Math.abs(sign.x-stall.x)>=.9,'sign is outboard of real buyer');
  assert.equal(sign.z,stall.z+stall.face*1.03);
 }
 const geometry=extract('function marketStall(s,index)', '// W389:');
 assert.match(geometry,/marketStallPostPlacement\(s,sx,sz\)/);
 assert.match(geometry,/marketStallSignPlacement\(s\)/);
 const camera=extract('function physicalMarketUprights()', '// W342:');
 assert.match(camera,/marketStallPostPlacement\(stall,sx,sz\)/);
 const solids=extract('function physicalStreetLevelStallVolumes()', 'function followCameraRoofs()');
 assert.match(solids,/marketStallSignPlacement\(stall\)/);
 assert.doesNotMatch(source,/state\.|people\[|Math\.random|\.activity\s*=/);
});
test('W408 partial witness never masquerades as unobstructed or changes authority',()=>{
 const source=extract('function genuineMarketBarterWitness(', 'let marketBarterLensBuilds=');
 const ctx={Math};vm.createContext(ctx);vm.runInContext(source,ctx,{timeout:300});
 const shot={eyeCollision:{clear:true},blockers:0,marketPostSightline:{centerCover:0},
  foregroundSceneCover:.51,foregroundActorCoreCover:.02,foregroundCargoCover:0,
  vegetationFaceBlockers:0,projectedWorkerHeightFraction:.2};
 const framing={blockedBodyRays:0,handBlockers:0,
  foregroundCitizenBlockers:0,cameraProximityWarnings:0};
 assert.equal(ctx.readableMarketBarterShot(shot,framing,true),false);
 assert.equal(ctx.partiallyReadableMarketBarterShot(shot,framing,true),true);
 for(const change of [{blockers:1},{eyeCollision:{clear:false}},
  {marketPostSightline:{centerCover:.31}},{foregroundActorCoreCover:.52},
  {projectedWorkerHeightFraction:.03}]){
  assert.equal(ctx.partiallyReadableMarketBarterShot({...shot,...change},framing,true),false);
 }
 assert.doesNotMatch(source,/state\s*\.|\.activity\s*=(?!=)|\.delivery\s*=(?!=)/);
});
test('W408 real trade viewpoint uses actual facing and names partial evidence honestly',()=>{
 const director=extract('function planCitizenCamera(', '/* W58');
 assert.match(director,/marketBarter\?realWorkerFacing\(citizen\)/);
 assert.match(director,/marketBarterPartialBest/);
 assert.match(director,/market-barter-partial-visible/);
 assert.match(director,/marketBarterPartialCandidates/);
 assert.doesNotMatch(director,/citizen\.x\s*=(?!=)|citizen\.z\s*=(?!=)|state\.food\s*=(?!=)/);
});
