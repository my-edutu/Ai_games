'use strict';
// Real Three.js triangle proof for a temporary F8->F9 camera repair.
// This is a code-level safety gate, never native-video/performance evidence.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const source=pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/successor-deck-visibility.mjs')).href;
const loaded=import(source);
const three=import('three');

function fixture(THREE){
  const geometry=new THREE.BoxGeometry(2.5,4,1.2);
  const material=new THREE.MeshStandardMaterial({color:0x69557e});
  const roof=new THREE.Group();
  const obstruction=new THREE.Mesh(geometry,material);
  obstruction.position.set(0,2,2.4);
  roof.add(obstruction);
  roof.updateWorldMatrix(true,true);
  const runToken='source-authenticated-grounded-8-to-9';
  const source={runToken,lifecycle:'running',theme:'void',floor:9,tick:479,
    player:{health:5,halfWidth:9000,halfHeight:14000}};
  const held={runToken,floor:9,sourceTick:475,guardianGateRetained:true,
    oldRoofY:3240000,thresholdX:315000};
  const reuse={raycaster:new THREE.Raycaster(),direction:new THREE.Vector3(),
    point:new THREE.Vector3(),hits:[]};
  return {geometry,material,roof,source,held,reuse,THREE};
}
function sample(f,camera,body,extra={}){
  return f.measure({
    source:f.source,held:f.held,
    camera:new f.THREE.Vector3(...camera),
    body:new f.THREE.Vector3(...body),bodyHalfHeight:1.2,
    gate:new f.THREE.Vector3(0,2,0),
    platformRoots:[f.roof],...f.reuse,...extra
  });
}
test('real platform depth triangles block a genuine full-body line of sight; exterior shift recovers sightline without moving gameplay',async()=>{
  const THREE=await three;
  const {measureAuthoritativeDeckSightline}=await loaded;
  const f=fixture(THREE);f.measure=measureAuthoritativeDeckSightline;
  const before=JSON.stringify([f.source,f.held]);
  try{
    const blocked=sample(f,[0,2,6],[0,2,0]);
    assert.equal(blocked.active,true);
    assert.ok(blocked.bodyBlockedRays>0,'foreground geometry actually crosses body');
    assert.equal(blocked.rays,9,'seven true source-width body rays and two original gateway rays');
    const partial=sample(f,[5,3,6],[0,2,0]);
    assert.equal(partial.active,true);
    assert.ok(partial.bodyBlockedRays>0,
      'a modest camera shoulder move still physically hides two body rays: never certify clear');
    assert.ok(partial.score<blocked.score,'real offset still gives an honest partial improvement');
    const clear=sample(f,[10,3,6],[0,2,0]);
    assert.equal(clear.active,true);
    assert.equal(clear.bodyBlockedRays,0,
      'measurably exterior camera fully clears the actual box triangles, never x-rays the character');
    assert.ok(clear.score<partial.score);
    assert.equal(JSON.stringify([f.source,f.held]),before);
  }finally{f.geometry.dispose();f.material.dispose();}
});
test('missing or forged old-floor proof, wrong run, result/restart and stale source cannot authorize camera rescue',async()=>{
  const THREE=await three;
  const {measureAuthoritativeDeckSightline}=await loaded;
  const f=fixture(THREE);f.measure=measureAuthoritativeDeckSightline;
  try{
    for(const patch of [
      {source:{...f.source,runToken:'forged'}},
      {source:{...f.source,theme:'clockwork'}},
      {source:{...f.source,floor:8}},
      {source:{...f.source,lifecycle:'intermission'}},
      {source:{...f.source,tick:550}},
      {source:{...f.source,player:{health:0}}},
      {held:{...f.held,guardianGateRetained:false}},
    ])assert.equal(sample(f,[0,2,6],[0,2,0],patch),null);
    assert.equal(sample(f,[0,2,6],[0,2,0],{stale:true}),null);
    assert.equal(sample(f,[0,2,6],[0,2,0],{platformRoots:[]}),null);
  }finally{f.geometry.dispose();f.material.dispose();}
});
test('only actual rendered opaque, visible platform triangles count; no invented hazard, gateway or result',async()=>{
  const THREE=await three;
  const {measureAuthoritativeDeckSightline}=await loaded;
  const f=fixture(THREE);f.measure=measureAuthoritativeDeckSightline;
  try{
    const opaque=sample(f,[0,2,6],[0,2,0]);
    assert.ok(opaque.bodyBlockedRays>0);
    f.roof.children[0].material.transparent=true;
    f.roof.children[0].material.opacity=0;
    assert.equal(sample(f,[0,2,6],[0,2,0]).score,0);
    f.roof.children[0].material.opacity=1;
    f.roof.visible=false;
    assert.equal(sample(f,[0,2,6],[0,2,0]).score,0);
  }finally{f.geometry.dispose();f.material.dispose();}
});

test('source-owned undercroft selectively opens actual torso and original-gateway rays in both viewports without touching playable landing top',async()=>{
  const THREE=await three;
  const {protectSourceSuccessorUndercroft}=await loaded;
  for(const aspect of [960/600,390/844]){
    const f=fixture(THREE);
    const top=new THREE.Mesh(new THREE.BoxGeometry(2.5,.15,1.2),
      new THREE.MeshStandardMaterial({color:0xb8b0e0}));
    top.position.set(0,5,2.4);f.roof.add(top);
    const entry={mesh:f.roof.children[0],material:f.material,
      tint:f.material,opacity:1};
    const initialTopOpacity=top.material.opacity;
    try{
      const camera=new THREE.PerspectiveCamera(55,aspect,.1,100);
      camera.position.set(0,2,6);
      camera.updateMatrixWorld(true);
      const proof=protectSourceSuccessorUndercroft({
        source:f.source,held:f.held,camera,
        body:new THREE.Vector3(0,2,0),bodyHalfHeight:1.2,
        gate:new THREE.Vector3(0,2,0),entries:[entry],
        ...f.reuse,dt:1/25
      });
      assert.equal(proof.active,true);
      assert.ok(proof.softened>0,'real old-gateway and climber ray blocked by original underside');
      assert.ok(proof.rays<=6,'bounded full-body plus true gate ray budget');
      assert.ok(f.material.opacity<=.08,'only the source-owned foreground skirt clears');
      assert.equal(f.material.depthWrite,false,'solid underside must not mask hero depth');
      assert.equal(top.material.opacity,initialTopOpacity,'actual walkable roof stays opaque');
      assert.equal(top.material.transparent,false);
      assert.equal(f.source.floor,9);
      assert.equal(f.held.guardianGateRetained,true);
    }finally{top.geometry.dispose();top.material.dispose();f.geometry.dispose();f.material.dispose();}
  }
});
test('source-owned undercroft restores opaque depth at source expiry and clears immediately when camera no longer intersects real triangles',async()=>{
  const THREE=await three;
  const {protectSourceSuccessorUndercroft}=await loaded;
  const f=fixture(THREE);
  const entry={mesh:f.roof.children[0],material:f.material,tint:f.material};
  const camera=new THREE.PerspectiveCamera(55,960/600,.1,100);
  camera.position.set(0,2,6);camera.updateMatrixWorld(true);
  const args={source:f.source,held:f.held,camera,body:new THREE.Vector3(0,2,0),
    bodyHalfHeight:1.2,gate:new THREE.Vector3(0,2,0),entries:[entry],
    ...f.reuse,dt:1/25};
  try{
    assert.ok(protectSourceSuccessorUndercroft(args).softened>0);
    const first=f.material.opacity;
    // A source-owned moving platform can physically depart the final camera
    // ray. Move the fixture's REAL mesh far enough to guarantee no hit,
    // rather than assuming one arbitrary exterior orbit is unobstructed.
    f.roof.children[0].position.x=30;
    f.roof.updateWorldMatrix(true,true);
    for(let i=0;i<18;i++)protectSourceSuccessorUndercroft(args);
    assert.ok(f.material.opacity>first);
    assert.equal(f.material.opacity,1,'unobstructed geometry returns fully opaque');
    args.source={...f.source,tick:546};
    assert.equal(protectSourceSuccessorUndercroft(args).active,false);
    assert.equal(f.material.opacity,1,'expired prior-run visibility cannot ghost future floors');
    assert.equal(f.material.depthWrite,true);
    args.source={...f.source,runToken:'forged'};
    assert.equal(protectSourceSuccessorUndercroft(args).active,false);
    assert.equal(f.material.opacity,1);
    args.source=f.source;args.stale=true;
    assert.equal(protectSourceSuccessorUndercroft(args).active,false);
  }finally{f.geometry.dispose();f.material.dispose();}
});
test('production undercroft protects source-built successor side skirts at the final actual camera but never its landing top',()=>{
  const fs=require('node:fs');
  const src=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(src,/protectSourceSuccessorUndercroft\(\{/);
  assert.match(src,/successorUndercroftSightline/);
  assert.match(src,/sourceOwnedUndercroft/);
  assert.match(src,/arrivalSurface\|\|materials\.landing/);
});

test('original source-locked bronze gate physically occludes the actor and triggers the existing 3D camera-clearance search',async()=>{
  const THREE=await three;
  const {measureAuthoritativeDeckSightline}=await loaded;
  const f=fixture(THREE);f.measure=measureAuthoritativeDeckSightline;
  const gateRoot=new THREE.Group();
  gateRoot.name='AuthoritativeGuardianGate';
  const metal=new THREE.MeshStandardMaterial({color:0x8b6c4b});
  const shape=new THREE.BoxGeometry(2.5,4,1.2);
  const realLeaf=new THREE.Mesh(shape,metal);
  realLeaf.position.set(0,2,2.4);
  gateRoot.add(realLeaf);
  // Leave the ACTUAL successor deck in the 3D world but away from both
  // rays. Only the original physical gate itself blocks this shot.
  f.roof.children[0].position.x=100;
  f.roof.updateWorldMatrix(true,true);
  gateRoot.updateWorldMatrix(true,true);
  const original=JSON.stringify([f.source,f.held]);
  try {
    const withoutGate=sample(f,[0,2,6],[0,2,0]);
    assert.equal(withoutGate.score,0);
    const obstructed=sample(f,[0,2,6],[0,2,0],{originalGateRoot:gateRoot});
    assert.equal(obstructed.active,true);
    assert.ok(obstructed.bodyBlockedRays>0,
      'authentic opaque bronze geometry, not the next-floor deck, masks the living climber');
    assert.ok(obstructed.originalGateBlockedRays>0,
      'retained old gate must contribute to the SAME camera search score');
    assert.equal(obstructed.gatewayBlockedRays,0,
      'the original gate is the target, never its own occluder');
    const exterior=sample(f,[10,3,6],[0,2,0],{originalGateRoot:gateRoot});
    assert.ok(exterior.score<obstructed.score,
      'a source-free camera shoulder move must improve genuine geometric visibility');
    metal.transparent=true;metal.opacity=0;
    assert.equal(sample(f,[0,2,6],[0,2,0],{originalGateRoot:gateRoot}).originalGateBlockedRays,0,
      'an invisible earned gate cannot be counted as an opaque obstruction');
    metal.opacity=1;gateRoot.visible=false;
    assert.equal(sample(f,[0,2,6],[0,2,0],{originalGateRoot:gateRoot}).score,0);
    assert.equal(JSON.stringify([f.source,f.held]),original,
      'presentation probes cannot edit deterministic authority');
  } finally {shape.dispose();metal.dispose();f.geometry.dispose();f.material.dispose();}
});

test('physical guardian hardware is wired into the real retained gateway and submitted follow-camera score',()=>{
  const fs=require('node:fs');
  const world=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  const scene=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(world,/originalGateRoot:realGate/);
  assert.match(world,/originalGateRoot:held\.originalGateRoot/);
  assert.match(scene,/world\.measureSuccessorDeckVisibility\(/);
  assert.match(scene,/candidate\.bodyBlockedRays<=existingDeckView\.bodyBlockedRays/);
});

test('authentic first-F9 buttress and late shaft are additional physical camera occluders, not invented decks',async()=>{
  const THREE=await three;
  const {measureAuthoritativeDeckSightline}=await loaded;
  for(const aspect of [960/600,390/844]){
    const f=fixture(THREE);f.measure=measureAuthoritativeDeckSightline;
    f.roof.children[0].position.x=100;
    const structure=new THREE.Group();
    structure.name='SourceEarnedFirstFrameFarSideVoidButtress';
    const metal=new THREE.MeshStandardMaterial({color:0x544a63});
    const geometry=new THREE.BoxGeometry(2.5,4,1.2);
    const beam=new THREE.Mesh(geometry,metal);
    beam.position.set(0,2,2.4);structure.add(beam);
    const other=new THREE.Group();other.name='SourceEarnedClockworkVoidBearingGallery';
    try{
      const original=JSON.stringify([f.source,f.held]);
      const clearDecks=sample(f,[0,2,6],[0,2,0]);
      assert.equal(clearDecks.score,0,'real deck was moved out of the ray');
      const blocked=sample(f,[0,2,6],[0,2,0],{architectureRoots:[structure,other]});
      assert.equal(blocked.active,true);
      assert.ok(blocked.architectureBlockedRays>0,'existing Void structural mesh is real camera occlusion');
      assert.ok(blocked.bodyBlockedRays>0,'the real skinned source actor cannot be ignored');
      assert.ok(blocked.rays<=9,'do not create unbounded new render-frame rays');
      const recovered=sample(f,[10,3,6],[0,2,0],{architectureRoots:[structure,other]});
      assert.ok(recovered.score<blocked.score,
        'existing exterior shoulder search sees an authentically clearer current shot');
      metal.transparent=true;metal.opacity=0;
      assert.equal(sample(f,[0,2,6],[0,2,0],{architectureRoots:[structure]}).score,0,
        'fully transparent authentic structural mesh must not trigger a fake camera rescue');
      metal.opacity=1;structure.visible=false;
      assert.equal(sample(f,[0,2,6],[0,2,0],{architectureRoots:[structure]}).score,0,
        'GPU-hidden shaft is not a visually occluding architecture');
      assert.equal(sample(f,[0,2,6],[0,2,0],{architectureRoots:[f.roof]}),null,
        'do not score a real platform twice as a structural proxy');
      assert.equal(sample(f,[0,2,6],[0,2,0],
        {architectureRoots:[structure,other,new THREE.Group()]}),null,
        'strictly bounded maximum two authentic architecture subtrees');
      assert.equal(JSON.stringify([f.source,f.held]),original,
        '3D visibility never mutates the real 20Hz player, floor or last crossing');
    }finally{geometry.dispose();metal.dispose();f.geometry.dispose();f.material.dispose();}
  }
});
test('runtime samples only first-F9 source structural owners with dual-subject full-body clearance',()=>{
  const fs=require('node:fs');
  const world=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  const scene=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(world,/stagedVoidArchitecture\.root\.visible/);
  assert.match(world,/deferredDistantArrival\?\.structuralRoot/);
  assert.match(world,/sourceEarnedBearingSightlineRoot=supportRoot/);
  assert.match(world,/batchRigid\(sourceEarnedBearingSightlineRoot\)/);
  assert.match(world,/boundaries\.add\(sourceEarnedBearingSightlineRoot\)/);
  assert.match(world,/architectureRoots,originalGateRoot:held\.originalGateRoot/);
  assert.match(scene,/sourceStructuralBlockedRays:successorArchitectureBlockedRays/);
  assert.match(scene,/candidate\.score<bestScore/);
});
