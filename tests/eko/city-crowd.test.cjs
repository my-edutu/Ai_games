'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const THREE=require('three');
async function make(){
  const code=fs.readFileSync(path.resolve(__dirname,'../../public/eko-run/city-crowd.js'),'utf8');
  const mod=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
  const scene=new THREE.Scene();
  return {scene,crowd:mod.createCityCrowd(THREE,scene,{capacity:28})};
}
test('Lagos citizens use a fixed draw-call budget independent of population',async()=>{
  const {scene,crowd}=await make();
  const plan=crowd.layout('mainland-morning',150);
  assert.ok(plan.characters>=20);
  assert.equal(plan.instancedDrawCalls,11);
  assert.equal(scene.children.length,1);
  assert.equal(crowd.root.children.length,11);
  for(const part of crowd.root.children){
    assert.ok(part.isInstancedMesh);
    assert.equal(part.count,plan.characters);
    assert.ok(part.instanceColor,'citizens must have independent original outfits and skin');
  }
  crowd.animate(1000,'high');
  crowd.animate(1020,'low');
  assert.ok(crowd.metrics().frames>=2);
  const transform=new THREE.Matrix4();
  crowd.root.children[0].getMatrixAt(0,transform);
  assert.ok(Number.isFinite(transform.elements[12]));
  crowd.dispose();
  assert.equal(scene.children.length,0);
});
test('render-only population is capped for extremely long worlds',async()=>{
  const {crowd}=await make();
  const values=[32,150,10000].map(length=>crowd.layout('market-rush',length).characters);
  assert.ok(values[0]<values[1]);
  assert.ok(values[2]<=28);
  crowd.dispose();
});
