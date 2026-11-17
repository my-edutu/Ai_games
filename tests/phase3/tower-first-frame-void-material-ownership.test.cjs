'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const loader = import('../../public/infinite-tower-climb/visuals/source-earned-first-frame-void-materials.mjs');
function material(name) {
  const mat = {isMaterial:true,name,color:{code:name}};
  mat.clone = () => ({isMaterial:true,name:'copied',color:{code:mat.color.code}});
  return mat;
}
function fixture() {
  const materials=Object.fromEntries(
    ['stone','dark','metal','copper','hazard'].map(k=>[k,material(k)]));
  const objects=[
    {isMesh:true,material:materials.stone,geometry:{id:'stone'}},
    {isMesh:true,material:materials.stone,geometry:{id:'stone-2'}},
    {isMesh:true,material:materials.metal,geometry:{id:'metal'}},
    {isMesh:true,material:materials.dark,geometry:{id:'dark'}},
    {isMesh:true,material:materials.copper,geometry:{id:'copper'}}
  ];
  const root={isGroup:true,name:'SourceEarnedVoidLandingBearingFrame',
    traverse:fn=>{fn(root);for(const obj of objects)fn(obj);}};
  const oldGate={isMesh:true,material:materials.metal,geometry:{id:'old-gate'}};
  const hazard={isMesh:true,material:materials.hazard,geometry:{id:'hazard'}};
  return {materials,objects,root,oldGate,hazard};
}
test('real first returned successor frame retains its own Void identity while actual bronze gate and danger stay untouched',async()=>{
  const {isolateEarnedFirstFrameVoidMaterials:isolate}=await loader;
  const {materials,objects,root,oldGate,hazard}=fixture();
  const owned=[];
  const result=isolate(root,materials,m=>owned.push(m));
  assert.equal(result.actualMeshes,5);
  assert.equal(result.sourceOwnedMaterials,4);
  assert.equal(result.geometryAdded,0);
  assert.equal(owned.length,4,'bounded material owner; no extra geometry or render pass');
  assert.equal(objects[0].material,objects[1].material,'share original structural channel inside actual frame');
  assert.notEqual(objects[0].material,materials.stone,'do not allow clockwork global palette to overwrite the earned successor');
  assert.equal(objects[0].geometry.id,'stone');
  assert.equal(oldGate.material,materials.metal,'the original bronze gate is not in the successor owner');
  assert.equal(hazard.material,materials.hazard,'no changed danger tell');
  materials.stone.color.code='bronze-receding';
  assert.equal(objects[0].material.color.code,'stone','cool far-side structure persists during old doorway fade');
});
test('invalid/unowned geometry cannot gain a successor shader owner',async()=>{
  const {isolateEarnedFirstFrameVoidMaterials:isolate}=await loader;
  const {materials,root}=fixture();
  let calls=0;
  assert.equal(isolate(null,materials,()=>calls++),null);
  assert.equal(isolate({isGroup:true,traverse:0},materials,()=>calls++),null);
  assert.equal(isolate(root,{...materials,dark:null},()=>calls++),null);
  assert.equal(calls,0);
});
test('production source uses original earned Floor9 architecture, registers disposable materials and preserves guardian/source scope',()=>{
  const src=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
  assert.match(src,/import \{ isolateEarnedFirstFrameVoidMaterials \} from '.\/source-earned-first-frame-void-materials\.mjs'/);
  assert.match(src,/held\.guardianGateRetained!==true \|\| snapshot\?\.floor!==9/);
  assert.match(src,/buildVoidOpenCoreLoadPath\(height,frame,'first-frame'\)/);
  assert.match(src,/buildVoidOpenBearingPylon\(body,p,p\.top-8,'first-frame'\)/);
  assert.match(src,/isolateEarnedFirstFrameVoidMaterials\(frame,materials,/);
  assert.match(src,/floorMaterials\.add\(replacement\)/);
  assert.doesNotMatch(src,/snapshot\.floor\s*=\s*9/);
});
