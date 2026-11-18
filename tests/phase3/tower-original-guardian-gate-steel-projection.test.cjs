'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const url=pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/original-guardian-gate-steel-projection.mjs')).href;
const promise=Promise.all([import(url),import('three')]);
function originalDoor(THREE){
  const root=new THREE.Group();
  root.name='OriginalOnlyGuardianGate';
  const geo=new THREE.BoxGeometry(.45,5,.45);
  const metal=new THREE.MeshStandardMaterial({color:0x846f51});
  for(const x of [-2.9,2.9]){
    const pier=new THREE.Mesh(geo,metal);
    pier.position.set(x,2.5,0);
    root.add(pier);
  }
  const camera=new THREE.PerspectiveCamera(42,960/600,.1,150);
  camera.position.set(0,2.5,12);
  camera.lookAt(0,2.5,0);
  return {root,geo,metal,camera};
}
test('genuine original attached left/right steel is projected instead of treating empty open centre as visible metal',async()=>{
  const [{projectOriginalGuardianGateSteel:project},THREE]=await promise;
  const f=originalDoor(THREE);
  try{
    const close=project(THREE,f.root,f.camera);
    assert.equal(close.sourceBound,true);
    assert.equal(close.projectedPanes,2);
    assert.ok(close.projectedMetalArea>.002);
    assert.ok(close.score>0);
    f.camera.position.set(0,2.5,30); f.camera.lookAt(0,2.5,0);
    const far=project(THREE,f.root,f.camera);
    assert.ok(far.score<close.score,'more distant actual steel occupies less native camera space');
    f.camera.lookAt(0,2.5,80);
    assert.equal(project(THREE,f.root,f.camera).score,0,
      'an empty centre-looking-away cannot be a visible opened guardian gate');
  }finally{f.geo.dispose();f.metal.dispose();}
});
test('invisible, fully faded and detached doorway steel cannot earn coverage; no synthetic meshes created',async()=>{
  const [{projectOriginalGuardianGateSteel:project},THREE]=await promise;
  const f=originalDoor(THREE);
  try{
    assert.equal(f.root.children.length,2);
    f.root.visible=false;
    assert.equal(project(THREE,f.root,f.camera),null);
    f.root.visible=true;f.metal.opacity=0;
    assert.equal(project(THREE,f.root,f.camera).projectedMetalArea,0);
    f.metal.opacity=1;
    f.root.children[0].visible=false;
    assert.equal(project(THREE,f.root,f.camera).projectedPanes,1);
    assert.equal(f.root.children.length,2);
  }finally{f.geo.dispose();f.metal.dispose();}
});
