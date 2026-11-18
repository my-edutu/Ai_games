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

test('original HP-open grilles are genuine instanced steel and must enter the gate framing lens',async()=>{
  const [{projectOriginalGuardianGateSteel:project},THREE]=await promise;
  const root=new THREE.Group();
  const geometry=new THREE.BoxGeometry(.14,4,.28);
  const material=new THREE.MeshStandardMaterial({color:0x83664e});
  const lattice=new THREE.InstancedMesh(geometry,material,4);
  lattice.name='GuardianSealBronzeLatticeLeft';
  const matrix=new THREE.Matrix4();
  for(let i=0;i<4;i++){
    matrix.makeTranslation(i<2?-2.5:-1.6,2.2,i%2?-.22:0);
    lattice.setMatrixAt(i,matrix);
  }
  root.add(lattice);
  const camera=new THREE.PerspectiveCamera(42,960/600,.1,150);
  camera.position.set(0,2.5,12);
  camera.lookAt(0,2.5,0);
  try{
    const visible=project(THREE,root,camera);
    assert.equal(visible.sourceBound,true);
    assert.equal(visible.inspectedMeshes,1);
    assert.ok(visible.projectedInstancedPanes>=2,
      'the actual original lattice is not a disposable decorative proxy');
    assert.ok(visible.projectedInstancedMetalArea>.001);
    assert.ok(visible.projectedMetalArea>.001);
    camera.lookAt(0,2.5,80);
    const away=project(THREE,root,camera);
    assert.equal(away.projectedInstancedPanes,0);
    assert.equal(away.projectedMetalArea,0);
    camera.lookAt(0,2.5,0);
    material.opacity=0;
    assert.equal(project(THREE,root,camera).projectedMetalArea,0);
  }finally{geometry.dispose();material.dispose();}
});
test('bounded real instanced projection excludes inherited hidden gate parents and stale instance count',async()=>{
  const [{projectOriginalGuardianGateSteel:project},THREE]=await promise;
  const root=new THREE.Group(), hidden=new THREE.Group();
  const geometry=new THREE.BoxGeometry(.3,4,.3);
  const material=new THREE.MeshBasicMaterial({color:0xb07b50});
  const grille=new THREE.InstancedMesh(geometry,material,32);
  const mat=new THREE.Matrix4();
  for(let i=0;i<32;i++)grille.setMatrixAt(i,mat.makeTranslation((i%8-4)*.5,2.5,-(i/8|0)*.4));
  hidden.add(grille);root.add(hidden);
  const camera=new THREE.PerspectiveCamera(42,1,.1,150);
  camera.position.set(0,3,14);camera.lookAt(0,3,0);
  try{
    hidden.visible=false;
    assert.equal(project(THREE,root,camera).projectedMetalArea,0);
    hidden.visible=true;
    const measured=project(THREE,root,camera);
    assert.ok(measured.projectedInstancedPanes<=12,
      'one original instanced grille cannot exhaust an unbounded camera trial');
    assert.ok(measured.inspectedMeshes<=80);
    grille.count=0;
    assert.equal(project(THREE,root,camera).projectedInstancedPanes,0);
  }finally{geometry.dispose();material.dispose();}
});
