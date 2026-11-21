'use strict';
// World-space AABB is an optimization, NOT gameplay truth or visual proof.
const {test}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),{pathToFileURL}=require('node:url');
const THREE=require('three'),fs=require('node:fs');
const rootDir=path.resolve(__dirname,'../..');
async function load(){
  const [b,v]=await Promise.all(['source-sightline-broadphase.mjs',
    'successor-deck-visibility.mjs'].map(name=>import(pathToFileURL(
    path.join(rootDir,'public/infinite-tower-climb/visuals',name)).href)));
  return {...b,...v};
}
function fixture(){
  const roof=new THREE.Group(),geometry=new THREE.BoxGeometry(2.5,4,1.2);
  const material=new THREE.MeshStandardMaterial(),mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(0,2,2.4);roof.add(mesh);
  const runToken='source-authenticated-grounded-8-to-9';
  const source={runToken,lifecycle:'running',theme:'void',floor:9,tick:479,
    player:{health:5,halfWidth:9000,halfHeight:14000}};
  const held={runToken,floor:9,sourceTick:475,guardianGateRetained:true,
    oldRoofY:3240000,thresholdX:315000};
  const raycaster=new THREE.Raycaster(),direction=new THREE.Vector3(),
    point=new THREE.Vector3(),hits=[];
  const sample=(measure,camera,extra={})=>measure({source,held,
    camera:new THREE.Vector3(...camera),body:new THREE.Vector3(0,2,0),
    bodyHalfHeight:1.2,gate:new THREE.Vector3(0,2,0),
    platformRoots:[roof],raycaster,direction,point,hits,...extra});
  const dispose=()=>{geometry.dispose();material.dispose();};
  return {roof,mesh,material,raycaster,sample,dispose};
}
test('source-based live triangle occlusion equals conservative broadphase over multiple real camera choices',async()=>{
  const {createSourceSightlineRayBroadphase,measureAuthoritativeDeckSightline}=await load();
  const f=fixture(),cache=createSourceSightlineRayBroadphase(THREE);
  try{
    cache.beginFrame();
    for(const camera of [[0,2,6],[5,3,6],[10,3,6]]){
      const exact=f.sample(measureAuthoritativeDeckSightline,camera);
      const fast=f.sample(measureAuthoritativeDeckSightline,camera,
        {mayIntersectRoot:cache.mayIntersect});
      for(const prop of ['score','rays','bodyBlockedRays','gatewayBlockedRays'])
        assert.equal(fast[prop],exact[prop],prop+' must keep authentic source evidence');
    }
    assert.ok(cache.diagnostics().rootRayRejects>0);
    assert.equal(cache.diagnostics().boundsRebuilds,1,
      'once per source frame, not per ray/camera candidate');
  }finally{f.dispose();}
});
test('new render epoch invalidates moving platform bounds even when the 20Hz source tick repeats',async()=>{
  const {createSourceSightlineRayBroadphase,measureAuthoritativeDeckSightline}=await load();
  const f=fixture(),cache=createSourceSightlineRayBroadphase(THREE);
  try{
    f.mesh.position.x=100;cache.beginFrame();
    const missed=f.sample(measureAuthoritativeDeckSightline,[0,2,6],
      {mayIntersectRoot:cache.mayIntersect});
    assert.equal(missed.score,0);
    assert.ok(missed.broadphaseRejected>0);
    f.mesh.position.x=0;cache.beginFrame();
    const blocked=f.sample(measureAuthoritativeDeckSightline,[0,2,6],
      {mayIntersectRoot:cache.mayIntersect});
    assert.ok(blocked.bodyBlockedRays>0);
    assert.equal(blocked.score,
      f.sample(measureAuthoritativeDeckSightline,[0,2,6]).score);
  }finally{f.dispose();}
});
test('unsupported/empty roots fail open, transparent steel and invalid source stay unaccepted',async()=>{
  const {createSourceSightlineRayBroadphase,measureAuthoritativeDeckSightline}=await load();
  const f=fixture(),cache=createSourceSightlineRayBroadphase(THREE);
  try{
    cache.beginFrame();
    assert.equal(cache.mayIntersect({},f.raycaster),true);
    assert.equal(cache.mayIntersect(new THREE.Group(),f.raycaster),true);
    assert.equal(cache.mayIntersect(f.roof,{}),true);
    f.material.transparent=true;f.material.opacity=0;
    assert.equal(f.sample(measureAuthoritativeDeckSightline,[0,2,6],
      {mayIntersectRoot:cache.mayIntersect}).score,0);
    assert.equal(f.sample(measureAuthoritativeDeckSightline,[0,2,6],{
      mayIntersectRoot:cache.mayIntersect,
      source:{runToken:'forged',theme:'void',floor:9,tick:479,
        lifecycle:'running',player:{health:5,halfWidth:9000,halfHeight:14000}}
    }),null);
  }finally{f.dispose();}
});
test('real World owns and renews AABB only for authentic source ray camera decision',()=>{
  const s=fs.readFileSync(path.join(rootDir,
    'public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(s,/sourceSightlineRayBroadphase\.beginFrame\(\)/);
  assert.match(s,/mayIntersectRoot:sourceSightlineRayBroadphase\.mayIntersect/);
  assert.match(s,/syncWorldMatrix:sightlineMatrixEpoch\.sync/);
});

test('one camera frame caches only real visible mesh triangles across repeated physical shots',async()=>{
  const {createSourceSightlineRayBroadphase,measureAuthoritativeDeckSightline}=await load();
  const f=fixture(),cache=createSourceSightlineRayBroadphase(THREE);
  const hiddenParent=new THREE.Group();
  const hidden=new THREE.Mesh(new THREE.BoxGeometry(2.5,4,1.2),
    new THREE.MeshStandardMaterial());
  hidden.position.set(0,2,2.4);
  hiddenParent.visible=false;hiddenParent.add(hidden);f.roof.add(hiddenParent);
  const ghost=new THREE.Mesh(new THREE.BoxGeometry(2.5,4,1.2),
    new THREE.MeshStandardMaterial({transparent:true,opacity:0}));
  ghost.position.set(0,2,2.4);f.roof.add(ghost);
  try{
    cache.beginFrame();
    const oldSource=JSON.stringify(f.roof.children.map(m=>m.name));
    for(const camera of [[0,2,6],[5,3,6],[10,3,6]]){
      const exact=f.sample(measureAuthoritativeDeckSightline,camera);
      const cached=f.sample(measureAuthoritativeDeckSightline,camera,{
        mayIntersectRoot:cache.mayIntersect,
        traceVisibleRoot:cache.intersectVisible
      });
      for(const key of ['score','rays','bodyBlockedRays','gatewayBlockedRays',
        'originalCapBlockedRays','architectureBlockedRays'])
        assert.equal(cached[key],exact[key],key+' must still use real triangles');
    }
    assert.equal(cache.diagnostics().visibleRootBuilds,1,
      'one frame-scoped visibility traversal despite three camera proposals');
    assert.ok(cache.diagnostics().invisibleMeshCandidates>=2);
    assert.equal(JSON.stringify(f.roof.children.map(m=>m.name)),oldSource);
    // Rendering can update the material while the authoritative source tick
    // remains the same. A NEW displayed frame must rebuild targets.
    f.material.transparent=true;f.material.opacity=0;
    cache.beginFrame();
    const now=f.sample(measureAuthoritativeDeckSightline,[0,2,6],{
      mayIntersectRoot:cache.mayIntersect,
      traceVisibleRoot:cache.intersectVisible
    });
    assert.equal(now.score,0,'never borrow an opaque result from previous render');
    f.material.transparent=false;f.material.opacity=1;
    cache.beginFrame();
    assert.equal(f.sample(measureAuthoritativeDeckSightline,[0,2,6],{
      mayIntersectRoot:cache.mayIntersect,
      traceVisibleRoot:cache.intersectVisible
    }).score,f.sample(measureAuthoritativeDeckSightline,[0,2,6]).score);
  }finally{
    hidden.geometry.dispose();hidden.material.dispose();
    ghost.geometry.dispose();ghost.material.dispose();f.dispose();
  }
});
test('production original F9 camera runs frame-scoped visible-mesh raycasting, never bypasses safety',()=>{
  const src=fs.readFileSync(path.join(rootDir,
    'public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  const proof=fs.readFileSync(path.join(rootDir,
    'public/infinite-tower-climb/visuals/successor-deck-visibility.mjs'),'utf8');
  assert.match(src,/traceVisibleRoot:sourceSightlineRayBroadphase\.intersectVisible/);
  assert.match(proof,/castSourceRoot\(originalGateRoot\)/);
  assert.match(proof,/castSourceRoot\(originalCapRoot\)/);
});
