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
    const clear=sample(f,[5,3,6],[0,2,0]);
    assert.equal(clear.active,true);
    assert.equal(clear.bodyBlockedRays,0,'real shifted shoulder clears old deck, no x-ray');
    assert.ok(clear.score<blocked.score);
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
