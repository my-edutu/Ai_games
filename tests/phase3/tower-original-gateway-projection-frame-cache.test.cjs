'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const projectorPath=path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/original-guardian-gate-steel-projection.mjs');
const memoPath=path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/frame-sightline-memo.mjs');

test('actual Floor9 original steel lens reuses ONLY an exact unchanged returned-camera projection',async()=>{
 const [projector,THREE,{createFrameSightlineMemo}]=await Promise.all([
   import(pathToFileURL(projectorPath).href),import('three'),
   import(pathToFileURL(memoPath).href)]);
 const {sourceOriginalGateProjectionKey:key,
   projectOriginalGuardianGateSteel:project}=projector;
 const root=new THREE.Group();
 const geo=new THREE.BoxGeometry(.5,5,.5);
 const material=new THREE.MeshBasicMaterial({color:0xb38a55});
 for(const x of [-2.9,2.9]){
   const pier=new THREE.Mesh(geo,material);pier.position.set(x,2.5,0);
   root.add(pier);
 }
 const camera=new THREE.PerspectiveCamera(42,960/600,.1,150);
 camera.position.set(0,2.5,12);camera.lookAt(0,2.5,0);
 const source={runToken:'true-guardian-run',tick:476};
 const held={originalGatewayOpacity:1};
 const memo=createFrameSightlineMemo(16);
 let projections=0;
 function observed(){
   const cameraKey=key(source,held,camera);
   assert.equal(typeof cameraKey,'string');
   return memo.read(cameraKey,()=>{
     projections++;
     return project(THREE,root,camera);
   });
 }
 try {
   memo.beginFrame();
   const first=observed(),same=observed();
   assert.deepEqual(first,same);
   assert.equal(projections,1,'identical real camera and source owner cannot repeat all mesh projections');
   camera.lookAt(0,2.5,80);
   assert.equal(observed().projectedMetalArea,0,
     'changed gaze must never borrow previously visible gateway steel');
   assert.equal(projections,2);
   camera.lookAt(0,2.5,0);
   assert.ok(observed().projectedMetalArea>0);
   assert.equal(projections,2,'identical restored lens may reuse its exact current-frame projection');
   camera.aspect=390/844;camera.updateProjectionMatrix();
   // At this actual lens/distance both physically separated original piers
   // are OUTSIDE the portrait frustum. Do not invent a visible gateway to
   // make a cache test pass: the real portrait shot must earn its framing.
   assert.equal(observed().projectedPanes,0,
     'the original gateway cannot count steel cropped outside narrow portrait');
   assert.equal(projections,3,'portrait lens change must reproject actual original steel');
   camera.aspect=960/600;camera.updateProjectionMatrix();
   assert.equal(observed().projectedPanes,2,
     'restore a genuinely visible original arch before testing mesh mutation');
   assert.equal(projections,3,'restoring an EXACT already-returned same-frame desktop lens must reuse its previously checked steel');
   held.originalGatewayOpacity=.60;
   observed();
   assert.equal(projections,4,'actual old-gate fade invalidates a same-position lens');
   root.children[0].visible=false;
   memo.invalidate();
   assert.equal(observed().projectedPanes,1,
     'post-camera material/mesh visibility changes cannot borrow prior metal');
   memo.beginFrame();
   assert.equal(observed().projectedPanes,1,'next completed World frame always performs a fresh query');
   assert.equal(projections,6);
   assert.ok(memo.diagnostics().retainedEntries<=16);
 } finally {geo.dispose();material.dispose();}
});

test('original GPU projection cache refuses invalid source-camera identities',async()=>{
 const [{sourceOriginalGateProjectionKey:key},THREE]=await Promise.all([
   import(pathToFileURL(projectorPath).href),import('three')]);
 const camera=new THREE.PerspectiveCamera(42,1,.1,100);
 camera.position.set(0,1,10);camera.lookAt(0,1,0);
 const good={runToken:'run-one',tick:475},held={originalGatewayOpacity:1};
 assert.equal(key(null,held,camera),null);
 assert.equal(key({...good,runToken:''},held,camera),null);
 assert.equal(key({...good,tick:-1},held,camera),null);
 assert.equal(key(good,{originalGatewayOpacity:NaN},camera),null);
 assert.equal(key(good,held,{}),null);
 assert.notEqual(key(good,held,camera),key({...good,runToken:'run-two'},held,camera));
 assert.notEqual(key(good,held,camera),key({...good,tick:476},held,camera));
});

test('the production World must own the cache epoch and invalidate at every mutating sightline pass',()=>{
 const world=fs.readFileSync(path.resolve(__dirname,
   '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
 assert.match(world,/originalGateProjectionMemo=createFrameSightlineMemo\(/);
 assert.match(world,/originalGateProjectionMemo\.beginFrame\(\)/);
 assert.match(world,/originalGateProjectionMemo\.invalidate\(\)/);
 assert.match(world,/originalGateProjectionMemo\.read\(key,exactOriginalProjection\)/);
 assert.match(world,/frameScopedOriginalGateProjectionMemo:originalGateProjectionMemo\.diagnostics\(\)/);
});
