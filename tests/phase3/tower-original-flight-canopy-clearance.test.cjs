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


test('the real batched F8 canopy keeps its authored overhead height and clears recorded combat rays, then survives the original F9 handoff',async()=>{
 const path=require('node:path'),os=require('node:os');
 const {pathToFileURL}=require('node:url');
 const {resolveTowerWorldFixtureImports}=require('../helpers/tower-world-fixture-imports.cjs');
 const root=path.resolve(__dirname,'../..');
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'tower-real-overhead-owner-'));
 const threeURL=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
 const source=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/world.mjs'),'utf8')
   .replace("'/tower/vendor/three.module.js'",JSON.stringify(threeURL));
 const file=path.join(scratch,'world.mjs');
 fs.writeFileSync(file,resolveTowerWorldFixtureImports(source,{root,fixtureDir:scratch}));
 let world;
 try{
   const [THREE,{createTowerWorld}]=await Promise.all([import(threeURL),import(pathToFileURL(file).href)]);
   world=createTowerWorld();
   const deck={...cap,kind:'oneway'};
   const body={health:5,grounded:true,state:'standing',vy:0,halfWidth:9000,halfHeight:14000,
     y:3238000,x:threshold+13000};
   const common={runToken:'real-overhead-owner-fixture',lifecycle:'running',
     worldWidth:480000,chunkBaseY:2880000,chunkHeight:360000,
     hazards:[],pickups:[],projectiles:[]};
   const old={...common,floor:8,theme:'clockwork',tick:450,guardianExitX:threshold,
     platforms:[deck],enemies:[{id:'f8:guardian',kind:'guardian',active:false,
       health:0,maxHealth:8,x:235000,y:3250000,halfHeight:18000}],
     player:{...body,groundedPlatformId:'f8:cap'}};
   const next={...common,floor:9,theme:'void',tick:451,
     platforms:[{id:'f9:ground',kind:'solid',x:0,y:cap.y,width:480000,height:cap.height}],
     enemies:[],player:{...body,groundedPlatformId:'f9:ground'}};
   const unchanged=JSON.stringify([old,next]);
   world.update(old,.05,0,{quality:'low'});
   const canopy=world.group.getObjectByName('SourcePrepaintedOriginalGuardianReceivingCanopy');
   const actualCap=world.group.getObjectByName('platform:f8:cap');
   assert.ok(canopy?.isGroup&&canopy.parent===actualCap,'the original physical cap owns the canopy');
   assert.equal(canopy.scale.y,1,'deck thickness must never compress the overhead load path');
   assert.equal(canopy.position.y,0,'the source-built canopy retains its authored cap-local transform');
   world.group.updateWorldMatrix(true,true);
   const roof=(cap.y+cap.height-old.chunkBaseY)/10000;
   const bounds=new THREE.Box3().setFromObject(canopy);
   assert.ok(bounds.max.y>roof+18,'actual post-batch steel, not just the plan, has its intended headroom');
   const materials=new Set();
   canopy.traverse(o=>{if(o.isMesh)materials.add(o.material);});
   assert.ok(materials.size>0);
   for(const material of materials)assert.equal(material.name,'guardian-source-overhead-bearing');
   let deckMeshes=0;
   actualCap.traverse(o=>{
     if(o.isMesh&&o.material?.name==='guardian-sightline-cap'){
       deckMeshes++;
       assert.ok(!materials.has(o.material),'actual walking slab must not share its reactive alpha with the canopy');
     }
   });
   assert.ok(deckMeshes>0,'the real deck retains its original thin material owner');
   // Native source 8a31847e owner audit: source ticks 294 desktop and 292 portrait
   // each hit a real batched canopy triangle ~4.75m in front of a shoulder.
   // These are recorded physical camera/target coordinates, NOT native film proof.
   for(const [from,to] of [
     [[8.38,37.21,43.27],[7.051,36.472,24.109]],
     [[12.54,37.24,43.29],[5.551,36.472,24.437]]
   ]){
     const origin=new THREE.Vector3(...from),target=new THREE.Vector3(...to);
     const delta=target.clone().sub(origin),distance=delta.length();
     const ray=new THREE.Raycaster(origin,delta.normalize(),0,distance-.05);
     assert.equal(ray.intersectObject(canopy,true).length,0,
       'correctly authored overhead steel no longer cuts the recorded shoulder ray');
   }
   assert.equal(world.stageGroundedCapContinuation(old,next),true);
   world.update(next,.05,.05,{quality:'low'});
   const carried=world.group.getObjectByName('SourcePrepaintedOriginalGuardianReceivingCanopy');
   assert.equal(carried,canopy,'reuse the exact original F8 canopy, not a new F9 portal');
   assert.equal(carried.scale.y,1,'source-authorized reparenting preserves real headroom');
   assert.ok(world.group.getObjectByName('platform:f9:ground')?.isGroup);
   assert.equal(JSON.stringify([old,next]),unchanged,'presentation changes no authoritative source');
 }finally{world?.dispose();fs.rmSync(scratch,{recursive:true,force:true});}
});
