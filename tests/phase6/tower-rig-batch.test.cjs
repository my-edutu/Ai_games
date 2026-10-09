'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const THREE=require('three');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/infinite-tower-climb/rig-batch-v17.js'),'utf8');
const {compactRigDraws}=new Function('THREE',source.replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'')+';return {compactRigDraws};')(THREE);

// Bounding boxes overestimate a rotated shape and change when mesh bounds are
// combined. Compare the actual rendered vertex cloud, in triangle draw order.
function worldVertices(root){
  root.updateMatrixWorld(true);
  const points=[];
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const geometry=mesh.geometry;
    const pos=geometry.getAttribute('position');
    const idx=geometry.index;
    for(let i=0;i<(idx?idx.count:pos.count);i++){
      const vertex=new THREE.Vector3().fromBufferAttribute(pos,idx?idx.getX(i):i);
      points.push(vertex.applyMatrix4(mesh.matrixWorld));
    }
  });
  return points;
}
function assertWorldVerticesEqual(actual,expected){
  assert.equal(actual.length,expected.length,'no vertex lost during optimization');
  for(let i=0;i<expected.length;i++){
    const delta=actual[i].distanceTo(expected[i]);
    assert.ok(delta<1e-4,'vertex '+i+' drift '+delta+' exceeds floating-point tolerance');
  }
}

test('same-parent opaque pieces keep every original vertex and world-space shape',()=>{
  const hero=new THREE.Group(),arm=new THREE.Group();hero.add(arm);
  const m=new THREE.MeshStandardMaterial({color:0xe8b875});
  const geometryFns=[
    ()=>new THREE.BoxGeometry(3,4,5),
    ()=>new THREE.CylinderGeometry(2,3,8,9),
    ()=>new THREE.SphereGeometry(4,16,8),
    ()=>new THREE.ConeGeometry(2,6,8)
  ];
  for(let i=0;i<4;i++){
    const mesh=new THREE.Mesh(geometryFns[i](),m);
    mesh.position.set(i*4,1-i,2+i*3);mesh.rotation.set(.1*i,.07*i,-.13*i);
    arm.add(mesh);
  }
  arm.rotation.z=.38;
  const originalWorldVertices=worldVertices(hero),before=arm.children.slice();
  const vertices=before.reduce((sum,x)=>sum+(x.geometry.index?x.geometry.index.count:x.geometry.getAttribute('position').count),0);
  const meta=compactRigDraws(hero);
  assert.equal(meta.before,4);assert.equal(meta.after,1);assert.equal(meta.reduced,3);
  assert.equal(meta.batches,1);assert.equal(arm.children.length,1);
  const merged=arm.children[0];
  assert.equal(merged.material,m);
  assert.equal(merged.geometry.getAttribute('position').count,vertices);
  assertWorldVerticesEqual(worldVertices(hero),originalWorldVertices);
  arm.rotation.z=-.31;
  assert.ok(new THREE.Box3().setFromObject(hero).isEmpty()===false,'merged rig still follows animated joint rotation');
});

test('animated cloth, transparent visors, instanced detail and parented props remain unmodified',()=>{
  const hero=new THREE.Group(),hand=new THREE.Group(),material=new THREE.MeshStandardMaterial();
  hero.add(hand);
  const cloth=new THREE.Mesh(new THREE.PlaneGeometry(10,10),material);
  const visor=new THREE.Mesh(new THREE.PlaneGeometry(10,10),new THREE.MeshBasicMaterial({transparent:true,opacity:.3}));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(3,.2,8,12),material);
  const parent=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),material);
  const child=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material);parent.add(child);
  const instance=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material,2);
  hand.add(cloth,visor,ring,parent,instance);
  hero.userData.clothSegments=[cloth];
  const original=new Set([cloth,visor,ring,parent,child,instance]);
  const metric=compactRigDraws(hero);
  for(const item of original)assert.ok(item.parent,'original animated/transparent/parented meshes remain in rig');
  assert.equal(metric.before,6);assert.equal(metric.after,6);
  assert.equal(metric.reduced,0);
});


test('batching preserves render layers, frustum policy, shadows and manual part matrices',()=>{
  const root=new THREE.Group(),joint=new THREE.Group(),material=new THREE.MeshStandardMaterial();
  root.add(joint);
  for(let i=0;i<3;i++){
    const part=new THREE.Mesh(new THREE.BoxGeometry(2,3,4),material);
    part.layers.set(3);part.frustumCulled=false;
    part.position.set(i*4,1,i);part.updateMatrix();part.matrixAutoUpdate=false;
    part.castShadow=true;part.receiveShadow=true;
    joint.add(part);
  }
  joint.rotation.y=.37;
  const before=worldVertices(root);
  const metrics=compactRigDraws(root);
  assert.equal(metrics.before,3);
  assert.equal(metrics.after,1);
  assert.equal(metrics.reduced,2);
  const merged=joint.children[0];
  assert.equal(merged.layers.mask,1<<3,'camera render layer preserved');
  assert.equal(merged.frustumCulled,false,'culling mode preserved');
  assert.equal(merged.castShadow,true);
  assert.equal(merged.receiveShadow,true);
  assertWorldVerticesEqual(worldVertices(root),before);
});

test('mirrored rig pieces stay unmerged to preserve original face winding',()=>{
  const root=new THREE.Group(),joint=new THREE.Group(),material=new THREE.MeshStandardMaterial();
  root.add(joint);
  const mirrored=new THREE.Mesh(new THREE.BoxGeometry(3,3,3),material);
  const normal=new THREE.Mesh(new THREE.BoxGeometry(3,3,3),material);
  mirrored.scale.x=-1;normal.position.x=8;
  joint.add(mirrored,normal);
  const before=worldVertices(root);
  const metrics=compactRigDraws(root);
  assert.equal(metrics.before,2);
  assert.equal(metrics.after,2);
  assert.equal(metrics.batches,0);
  assert.equal(joint.children[0],mirrored);
  assertWorldVerticesEqual(worldVertices(root),before);
});
