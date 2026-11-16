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
test('authentic raised F9 step is the actual terminal bearing anchor, not an unrelated flat bronze roof',async()=>{
  const {plannedEarnedClockworkVoidBearings:f}=await load();
  const plan=f(source,held);
  assert.ok(plan);
  const floorY=(held.oldRoofY-source.chunkBaseY)/10000;
  const supportedRaisedY=(step.y+step.height-source.chunkBaseY)/10000;
  assert.equal(plan.nodes[0].sceneY,floorY,'old floor starts on the authenticated original sill');
  assert.equal(plan.nodes[2].x,step.x+Math.floor(step.width/2),
    'outgoing steelwork actually terminates at the existing source-authored first raised platform');
  assert.equal(plan.nodes[2].sceneY,supportedRaisedY,
    'the upper load bay follows the actual supported rising route instead of a fake level corridor');
  assert.ok(plan.nodes[1].sceneY>floorY && plan.nodes[1].sceneY<supportedRaisedY);
  assert.ok(plan.nodes.every(n=>n.anchorY===floorY),
    'each rising load column remains grounded in the real old roof plane');
  const alternate={...source,platforms:[ground,{...step,x:step.x+20000,y:step.y+20000}]};
  const repl=f(alternate,held);
  assert.ok(repl);
  assert.notEqual(repl.nodes[2].x,plan.nodes[2].x);
  assert.notEqual(repl.nodes[2].sceneY,plan.nodes[2].sceneY,
    'the architecture responds to real platform geometry, never hard-coded hero choreography');
});
test('source-grounded elevated transfer trusses carry weight without putting a curtain through the actor',async()=>{
  const {plannedEarnedClockworkVoidBearings:f,plannedSourceEarnedSuspendedBearingSections:g}=await load();
  const nodes=f(source,held).nodes, sections=g(nodes);
  assert.deepEqual(sections.map(x=>x.length),[7,12,12],
    'two supported pitched inner/outboard load ties connect each actual rising station');
  assert.ok(sections.every((section,i)=>section.some(part=>
    Math.abs(Math.hypot(part.p[0],part.p[2])-21.6)<.2 &&
    part.s[1]>=nodes[i].height+(nodes[i].sceneY-nodes[i].anchorY)-.01 &&
    Math.abs(part.p[1]-((nodes[i].anchorY+nodes[i].sceneY+nodes[i].height)/2))<.1
  )),'every main vertical rests on the original source roof and meets its rising source support crown');
  for(let i=1;i<3;i++){
    const diagonals=sections[i].filter(part=>Math.abs(part.r[2])>.06 && part.s[1]>1.5);
    assert.equal(diagonals.length,4,'supported four-height pitched load lattice must physically connect the real source ascent');
    assert.ok(diagonals.some(part=>Math.hypot(part.p[0],part.p[2])<22.4));
    assert.ok(diagonals.some(part=>Math.hypot(part.p[0],part.p[2])>24 &&
      part.p[1]-part.s[1]/2>1.8));
  }
  assert.ok(sections.flat().length<=42,'three original instanced batches retain a bounded draw and upload budget');
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
      if(part.s[1]>=2.5 && radius>24)assert.ok(
        part.p[1]-part.s[1]/2>1.8 && Math.abs(part.r[2])>.06,
        'only a high supported sloped tie, never an eye-level outer column, may cross the camera rim');
      if(radius>24)assert.ok(part.p[1]-part.s[1]/2>1.8,
        'outer tensile span must stay above original actor/door/camera corridor');
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
  assert.ok(sections.every(part=>part.length>=5 && part.length<=12),
    'three authentic source stations use 7,12,12 existing instanced load parts');
  assert.ok(sections.flat().every(part=>part.p.length===3&&part.s.length===3&&
    part.p.every(Number.isFinite)&&part.s.every(n=>Number.isFinite(n)&&n>0)));
  assert.ok(sections.flat().length<=42,'three-station original 3D route remains bounded to three instanced draws');
});

test('true Floor9 gateway now has an open, connected multi-storey original-to-Void structural spine',async()=>{
  // Latest genuine immutable 1x WebMs: 43753683237, SHA bb2790ee.
  // The old lattice is over the body at native 25-26.5s, then the
  // remaining almost empty violet room replaces bronze in one frame.
  const {plannedEarnedClockworkVoidBearings,plannedSourceEarnedSuspendedBearingSections}=await load();
  const route=plannedEarnedClockworkVoidBearings(source,held);
  const parts=plannedSourceEarnedSuspendedBearingSections(route.nodes);
  assert.equal(parts.length,3);
  assert.deepEqual(parts.map(p=>p.length),[7,12,12]);
  for(const [i,section] of parts.entries()) {
    const upperRear=section.filter(part=>Math.abs(part.s[1]-11.6)<.001 &&
      Math.hypot(part.p[0],part.p[2])<22.4 &&
      part.p[1]>route.nodes[i].sceneY+route.nodes[i].height);
    assert.equal(upperRear.length,1,'each original physical station has one full-height upper rear bearing');
    assert.ok(Math.hypot(upperRear[0].p[0],upperRear[0].p[2])<22.4);
    const top=upperRear[0].p[1]+upperRear[0].s[1]/2;
    assert.ok(section.some(part=>Math.abs(part.p[1]-top)<1e-6 && part.s[2]>=7),
      'upper inboard bearing has an outward-supported crown, not a floating shaft');
    for(const part of section)if(Math.hypot(part.p[0],part.p[2])>24)
      assert.ok(part.p[1]-part.s[1]/2>1.8,
        'no newly minted exterior eye-height posts may re-mask the real hero');
  }
  assert.ok(parts.flat().length<=42,'same three instanced drawing batches, bounded structural geometry');
});
test('source-qualified gallery paint survives old cap retirement by returned frame, not source tick or timer',()=>{
  const world=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
  assert.match(world,/sourceEarnedBearingHandoff=\{runToken:snapshot\.runToken/);
  assert.match(world,/handoff\.retiring=true;[\s\S]*?handoff\.retirementStartProgress=handoff\.displayProgress/);
  assert.match(world,/handoff\.retirementSeconds \/ \.95/);
  assert.match(world,/advanceSourceEarnedPaletteReturn/);
  assert.match(world,/bearingHandoff\.retirementSeconds=next\.returnedSeconds/);
  assert.match(world,/snapshot\.runToken===handoff\.runToken/);
  assert.match(world,/sourceEarnedBearingHandoff = null/);
  assert.doesNotMatch(world,/snapshot\.player\.x\s*=|snapshot\.floor\s*=\s*9/);
});

// A real rising Floor9 deck means a lower station-height radial crossmember
// can now pass THROUGH the airborne climber's shoulder in a 1x portrait shot.
// Keep old load-bearing bay and genuine raised step, but suspend the outward
// visual steel above the adjacent inhabited source route, not at crown height.
// The test covers all three original source-supported stations, not a still.
test('authentic rising F9 load path keeps radial cantilevers ABOVE occupied player sightlines',async()=>{
  const {plannedEarnedClockworkVoidBearings,plannedSourceEarnedSuspendedBearingSections}=await load();
  const plan=plannedEarnedClockworkVoidBearings(source,held);
  assert.ok(plan && plan.nodes.length===3);
  const sections=plannedSourceEarnedSuspendedBearingSections(plan.nodes);
  assert.deepEqual(sections.map(section=>section.length),[7,12,12]);
  assert.equal(sections.flat().length,31,'retain three source-owned instanced sections');
  for(const [i,section] of sections.entries()){
    const crown=plan.nodes[i].sceneY+plan.nodes[i].height;
    const radial=section.filter(part=>
      Math.hypot(part.p[0],part.p[2])>24 &&
      part.s[2]>6.9 && part.s[2]<7.5 &&
      Math.abs(part.r[2])<.001);
    assert.equal(radial.length,2,'source station preserves two actual radial bearing arms');
    assert.ok(radial.every(part=>part.p[1]-part.s[1]/2>=crown+5.4),
      'the radial arms cannot cut across the source ascent corridor at eye/head level');
    const outerCollar=section.find(part=>
      Math.abs(Math.hypot(part.p[0],part.p[2])-27.6)<.05 &&
      Math.abs(part.s[1]-.26)<.001 && Math.abs(part.s[2]-.48)<.001);
    assert.ok(outerCollar,'mechanically connected exterior head collar remains');
    assert.ok(outerCollar.p[1]-outerCollar.s[1]/2>=crown+5.4,
      'exterior collar shares overhead load rather than masked torso level');
  }
});
