const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
const load=()=>import(pathToFileURL(path.resolve('public/infinite-tower-climb/visuals/source-earned-bearing-run.mjs')).href);
const ground={id:'f9:ground',x:0,y:3212000,width:480000,height:12000};
const step={id:'f9:gateway-step',x:263596,y:3290000,width:115000,height:10000};
const held={runToken:'verified',floor:9,oldCapId:'f8:cap',
  guardianGateRetained:true,verifiedObservedFloorAdvance:true,
  thresholdX:304896,oldRoofY:3224000,oldCapX:115200,oldCapWidth:249600};
const source={runToken:'verified',floor:9,theme:'void',lifecycle:'running',
  tick:475,worldWidth:480000,chunkBaseY:3240000,player:{health:4},
  platforms:[ground,step],lastGuardianCrossing:null};
test('real old threshold and real F9 grounded step produce bounded coherent 3D bearing locations',async()=>{
  const {plannedEarnedClockworkVoidBearings:f}=await load();
  const p=f(source,held);
  assert.equal(p.roofId,'f9:ground');
  assert.equal(p.stepId,'f9:gateway-step');
  assert.equal(p.nodes.length,3);
  assert.deepEqual(p.nodes.map(x=>x.materialPhase),['bronze','transition','void']);
  assert.ok(p.nodes.every(x=>Number.isFinite(x.angle)&&x.height>=5&&x.height<=7));
  assert.ok(p.nodes.every(x=>x.x>=0&&x.x<=480000));
  assert.equal(p.nodes[0].x,296896);
});
test('cold GPU first F9 receipt retains TRUE grounded roof after delayed last-guardian record',async()=>{
  const {plannedEarnedClockworkVoidBearings:f}=await load();
  const first={...held,verifiedObservedFloorAdvance:false,sourceTick:475,firstObservedTick:475};
  const groundBody={...source,player:{health:4,grounded:true,groundedPlatformId:'f9:ground',y:3238000,halfHeight:14000}};
  assert.ok(f(groundBody,first));
  assert.equal(f({...groundBody,player:{...groundBody.player,groundedPlatformId:'f8:cap'}},first),null);
  assert.equal(f({...groundBody,player:{...groundBody.player,y:3239000}},first),null);
  assert.equal(f({...groundBody,tick:490},first),null);
});
test('missing real support, wrong run, defeated source or claimed physics veto presentation gallery',async()=>{
  const {plannedEarnedClockworkVoidBearings:f}=await load();
  assert.equal(f(source,{...held,verifiedObservedFloorAdvance:false}),null);
  assert.equal(f({...source,platforms:[ground]},held),null);
  assert.equal(f({...source,platforms:[{...ground,y:3211000},step]},held),null);
  assert.equal(f({...source,runToken:'different'},held),null);
  assert.equal(f({...source,floor:8},held),null);
  const invalid={...source,lastGuardianCrossing:{runToken:'different',sourceTick:475,
    fromFloor:8,toFloor:9,guardian:{kind:'guardian',active:false,health:0},
    cap:{id:'f8:cap'}}};
  assert.equal(f(invalid,held),null);
});
test('the authentic gallery is integrated only in Tower world rebuild, not in simulation or HUD',()=>{
  const world=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
  assert.match(world,/import \{ plannedEarnedClockworkVoidBearings, plannedSourceEarnedSuspendedBearingSections \} from '.\/source-earned-bearing-run\.mjs'/);
  assert.match(world,/function buildEarnedClockworkVoidBearingRoute\(snapshot\)/);
  assert.match(world,/buildEarnedClockworkVoidBearingRoute\(snapshot\);/);
  assert.match(world,/SourceEarnedClockworkVoidBearingGallery/);
  assert.match(world,/plannedSourceEarnedSuspendedBearingSections\(plan\.nodes\)/);
  assert.match(world,/instanced\(supportRoot,rounded\(\),material,items\)/);
});

test('the persistent original F9 load path shares the source-earned ascent departure with the old gate and real walkable platforms',()=>{
  const world=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
  assert.match(world,/sourceEarnedBearingPalette=palette\.map/);
  assert.match(world,/material\.color\.copy\(bronze\)\.lerp\(voidColor,departure\)/);
  assert.match(world,/livePaletteProof\?\.sourceBound===true && !handoff\.retiring/);
  assert.match(world,/handoff\.displayProgress=Math\.max\(handoff\.displayProgress,/);
  assert.match(world,/sourceEarnedBearingPalette=null;/);
});

test('native-source 475 F9 shoulder ray has clear sight through source-earned load-bearing gallery',async()=>{
  // This is the real candidate WebGL camera/shoulder ray at source tick 475,
  // recorded in campaign 43745587650 on immutable source e2c45779.
  // Old rigid-material-batch SourceEarnedForgedBearing authoringInstance 2
  // struck the left shoulder at depth 14.163 before actor depth 16.839.
  // Verify physical load geometry itself no longer blocks that view.
  const {plannedEarnedClockworkVoidBearings:f,plannedSourceEarnedSuspendedBearingSections}=await load();
  const THREE=require('three');
  const route=f(source,held);
  assert.ok(route);
  const sections=plannedSourceEarnedSuspendedBearingSections(route.nodes);
  assert.equal(sections.length,3);
  const geometry=new THREE.BoxGeometry(1,1,1);
  const material=new THREE.MeshBasicMaterial({color:0x716151});
  const meshes=[];
  try {
    for(const section of sections)for(const item of section){
      const mesh=new THREE.Mesh(geometry,material);
      mesh.position.set(...item.p);
      mesh.rotation.set(...item.r);
      mesh.scale.set(...item.s);
      mesh.updateMatrixWorld(true);
      meshes.push(mesh);
    }
    const camera=new THREE.Vector3(12.24,3.62,40.14);
    const shoulder=new THREE.Vector3(9.273,-.872,23.312);
    const ray=new THREE.Raycaster(camera,new THREE.Vector3().subVectors(shoulder,camera).normalize(),0,camera.distanceTo(shoulder)-.25);
    const hits=ray.intersectObjects(meshes,false);
    assert.deepEqual(hits.map(hit=>hit.distance),[],
      'only rear-wall and high supported crowns may border the real body/door corridor; no opaque outboard uprights');
    // The original false positive was at radius 28.25 and eye-level.
    // This source-geometry invariant protects portrait as well as desktop:
    // structural legs must be INSIDE the 22.4-m core, not in the 25-m actor
    // rim or any camera-facing 28-m post plane.
    for(const section of sections)for(const part of section){
      const radius=Math.hypot(part.p[0],part.p[2]);
      if(part.s[1]>=2.5)assert.ok(radius<22.4,
        'load-bearing full-height posts must be behind inner core');
      if(radius>24)assert.ok(part.p[1]-part.s[1]/2>1.8,
        'exterior/overhead ties must leave at least 3.4m headroom above the old roof');
    }
  } finally {
    geometry.dispose();material.dispose();
  }
});
test('source-earned overhead load frame is bounded and cannot be fabricated from a missing scene station',async()=>{
  const {plannedEarnedClockworkVoidBearings:f,plannedSourceEarnedSuspendedBearingSections}=await load();
  assert.equal(plannedSourceEarnedSuspendedBearingSections(null),null);
  assert.equal(plannedSourceEarnedSuspendedBearingSections([{angle:NaN,sceneY:0,height:6}]),null);
  assert.equal(plannedSourceEarnedSuspendedBearingSections([{angle:0,sceneY:0,height:-1}]),null);
  const route=f(source,held);
  const sections=plannedSourceEarnedSuspendedBearingSections(route.nodes);
  assert.ok(sections.every(part=>part.length>=5 && part.length<=10));
  assert.ok(sections.flat().every(part=>part.p.length===3&&part.s.length===3&&
    part.p.every(Number.isFinite)&&part.s.every(n=>Number.isFinite(n)&&n>0)));
  assert.ok(sections.flat().length<=30,'three-station original 3D route remains bounded to three instanced draws');
});

test('true Floor9 gateway now has an open, connected multi-storey original-to-Void structural spine',async()=>{
  // Latest genuine immutable 1x WebMs: 43753683237, SHA bb2790ee.
  // The old lattice is over the body at native 25-26.5s, then the
  // remaining almost empty violet room replaces bronze in one frame.
  const {plannedEarnedClockworkVoidBearings,plannedSourceEarnedSuspendedBearingSections}=await load();
  const route=plannedEarnedClockworkVoidBearings(source,held);
  const parts=plannedSourceEarnedSuspendedBearingSections(route.nodes);
  assert.equal(parts.length,3);
  assert.deepEqual(parts.map(p=>p.length),[7,10,10]);
  for(const section of parts) {
    const upperRear=section.filter(part=>part.s[1]>=10);
    assert.equal(upperRear.length,1,'each original physical station has one full-height upper rear bearing');
    assert.ok(Math.hypot(upperRear[0].p[0],upperRear[0].p[2])<22.4);
    const top=upperRear[0].p[1]+upperRear[0].s[1]/2;
    assert.ok(section.some(part=>part.p[1]===top && part.s[2]>=7),
      'upper inboard bearing has an outward-supported crown, not a floating shaft');
    for(const part of section)if(Math.hypot(part.p[0],part.p[2])>24)
      assert.ok(part.p[1]-part.s[1]/2>1.8,
        'no newly minted exterior eye-height posts may re-mask the real hero');
  }
  assert.ok(parts.flat().length<=30,'same three instanced drawing batches, bounded structural geometry');
});
test('source-qualified gallery paint survives old cap retirement by returned frame, not source tick or timer',()=>{
  const world=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
  assert.match(world,/sourceEarnedBearingHandoff=\{runToken:snapshot\.runToken/);
  assert.match(world,/handoff\.retiring=true;[\s\S]*?handoff\.retirementStartProgress=handoff\.displayProgress/);
  assert.match(world,/handoff\.retirementFrames\/8/);
  assert.match(world,/bearingHandoff\.retirementFrames=Math\.min\(8,[\s\S]*?bearingHandoff\.retirementFrames\+1\)/);
  assert.match(world,/snapshot\.runToken===handoff\.runToken/);
  assert.match(world,/sourceEarnedBearingHandoff = null/);
  assert.doesNotMatch(world,/snapshot\.player\.x\s*=|snapshot\.floor\s*=\s*9/);
});
