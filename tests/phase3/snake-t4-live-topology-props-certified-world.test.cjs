'use strict';
// T4 exact-source RED/GREEN: geometry-preserving 3D layers must not invalidate
// the whole HDR forest cache when public portal/obstacle topology changes.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const THREE=require('three');
const source=fs.readFileSync(process.env.RENDERER_SOURCE||path.resolve(__dirname,'../../public/snake-stream/renderer.mjs'),'utf8');
async function api() {
  const isolated=source.replace(/^import\s+.*?;\s*$/gm,'');
  return import('data:text/javascript;base64,'+Buffer.from(isolated).toString('base64'));
}
test('RED: keep obstacle and portal in depth-tested live layers but never bake them into static forest',async()=>{
  const {partitionWorldRenderLayers}=await api();
  assert.equal(typeof partitionWorldRenderLayers,'function');
  const group=new THREE.Group();
  const base=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());
  base.userData.staticWorld=true;
  const prop=new THREE.InstancedMesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial(),8);
  prop.userData.cachedProp=true;
  const hazard=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());
  group.add(base,prop,hazard);
  const original=[base,prop,hazard].map(o=>[o.geometry.uuid,o.material.uuid,o.layers.mask]);
  assert.deepEqual(partitionWorldRenderLayers(group),{staticMeshes:1,liveProps:1,otherDynamicMeshes:1});
  assert.equal(base.layers.isEnabled(1),true);
  assert.equal(base.layers.isEnabled(2),false);
  assert.equal(prop.layers.isEnabled(1),false);
  assert.equal(prop.layers.isEnabled(2),true);
  assert.equal(hazard.layers.isEnabled(2),true);
  for(const obj of [base,prop,hazard])assert.equal(obj.layers.isEnabled(0),true);
  assert.deepEqual([base,prop,hazard].map(o=>[o.geometry.uuid,o.material.uuid]),original.map(x=>x.slice(0,2)));
});
test('RED: genuine three-size 3D worlds preserve all original terrain and six visible topology batches',async()=>{
  const {createWorld}=await import('../../public/snake-stream/world.mjs');
  const {partitionWorldRenderLayers,staticWorldViewSignature}=await api();
  for(const [width,height] of [[8,8],[28,16],[40,24]]) {
    const world=createWorld(THREE,{width,height});
    try{
      const layers=partitionWorldRenderLayers(world.group);
      assert.equal(layers.staticMeshes,13);
      assert.equal(layers.liveProps,6);
      const props=[];
      world.group.traverse(o=>{if(o.userData.cachedProp)props.push(o)});
      assert.equal(props.length,6);
      const masks=props.map(o=>o.layers.mask);
      const camera=new THREE.PerspectiveCamera();
      camera.updateMatrixWorld();camera.updateProjectionMatrix();
      const view={dimensions:String(width)+'x'+height,fog:{near:48,far:110},exposure:1.03,camera};
      const key=staticWorldViewSignature(view);
      const snapshot={obstacles:[5,6],portals:[{entry:8,exit:width*height-3}],hazards:[],food:null};
      world.update(snapshot);
      const revision=world.propRevision();
      assert.ok(revision>0);
      assert.ok(props.some(o=>o.count>0));
      world.update({...snapshot,obstacles:[9],portals:[]});
      assert.ok(world.propRevision()>revision);
      assert.equal(staticWorldViewSignature(view),key,'moving props cannot stale or rebuild the forest photograph');
      assert.deepEqual(props.map(o=>o.layers.mask),masks);
      assert.equal(props.filter(o=>o.layers.isEnabled(1)).length,0);
      assert.equal(props.filter(o=>o.layers.isEnabled(2)).length,6);
      camera.position.x+=2;camera.updateMatrixWorld();
      assert.notEqual(staticWorldViewSignature(view),key,'camera changes still invalidate');
      assert.equal(world.stats().staticMeshes,13);
    }finally{world.dispose()}
  }
});
test('RED: actual complete renderer and unchanged GPU fence gate still include live public entities',()=>{
  assert.match(source,/const key = staticWorldViewSignature\(/);
  assert.doesNotMatch(source,/world\.propRevision\?\.\(\)/);
  assert.match(source,/camera\.layers\.set\(DYNAMIC_LAYER\);[\s\S]*?renderer\.render\(scene, camera\)/);
  assert.match(source,/if \(!frameGate\.canDraw\(\)\) return false/);
  assert.match(source,/frameGate\.submitted\(\)/);
  assert.match(source,/renderer\.render\(scene, camera\)/);
});
