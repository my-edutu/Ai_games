'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const gate=pathToFileURL(path.join(root,'public/ai-maze-escape/gate-moment.mjs')).href;
const map=pathToFileURL(path.join(root,'public/ai-maze-escape/map-view.mjs')).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source
 .replace("'./vendor/three.module.js'",JSON.stringify(three))
 .replace("'./gate-moment.mjs'",JSON.stringify(gate))
 .replace("'./map-view.mjs'",JSON.stringify(map))).toString('base64'));

const publicStage=()=>({
 runToken:'authentic-exit-run',tick:1,lifecycle:'running',result:null,
 width:5,height:5,currentCell:12,visibleCells:[12],discoveredCells:[12],
 cells:[{cell:12,blocked:false,trap:false,neighbors:[]}],
 doors:[],keys:[],inventory:[],threats:[],exitCell:12,
});
test('real public escape opens the two original attached portal wings, not an invented victory',async()=>{
 const {createMazeWorld}=await load();
 const w=createMazeWorld({balanced:true}),s=publicStage(),unaltered=JSON.stringify(s);
 try{
  w.update(s);w.animate(0,{gateTime:0});
  const wings=()=>[-1,1].map(side=>w.group.getObjectByName(
   'Disclosed exit articulated tide-wing hinge '+side));
  const veil=()=>w.group.getObjectByName('Disclosed exit portal')
   ?.children.find(node=>node.material?.name==='Disclosed fictitious veil');
  const rig=wings();
  assert.ok(rig.every(Boolean),'two real side-mounted attached exit mechanisms are in the original rendered world');
  assert.ok(rig.every(node=>node.parent?.name==='Disclosed exit portal'),
   'rooted shutters are attached to the publicly revealed portal, never floating');
  assert.deepEqual(rig.map(node=>node.rotation.y),[0,0],
   'ordinary discovered exit keeps its truthful non-victory opening');
  const budget=w.stats();
  const failed={...s,tick:2,lifecycle:'complete',result:{reason:'capture'}};
  w.update(failed);w.animate(.5,{gateTime:.5});
  assert.deepEqual(wings().map(node=>node.rotation.y),[0,0],
   'being caught next to an exit must not fake victory');
  w.update({...s,tick:3});
  w.animate(1,{gateTime:1});
  w.update({...s,tick:4,lifecycle:'complete',result:{reason:'escape'}});
  w.animate(1,{gateTime:1});
  assert.deepEqual(wings().map(node=>node.rotation.y),[0,0],
   'same-run public terminal event starts from the physical closed/quiet pose');
  w.animate(1.7,{gateTime:1.7});
  assert.ok(wings().every((node,i)=>
   Math.abs(node.rotation.y)>0.35 && Math.abs(node.rotation.y)<.65
   && Math.sign(node.rotation.y)===(i===0?-1:1)),
   'both fully connected exit shutters demonstrably swing OUT in a real intermediate victory frame');
  w.animate(2.5,{gateTime:2.5});
  assert.ok(wings().every(node=>Math.abs(node.rotation.y-.98*(node===wings()[0]?-1:1))<1e-8),
   'complete authentic escape settles both public portal hinges');
  assert.equal(w.stats().geometryCount,budget.geometryCount);
  assert.equal(w.stats().materialCount,budget.materialCount);
  assert.equal(w.stats().textureCount,budget.textureCount);
  w.animate(2.7,{gateTime:2.7,reducedMotion:true});
  assert.ok(wings().every(node=>Math.abs(Math.abs(node.rotation.y)-.98)<1e-8),
   'reduced motion settles the physical opening without playback');
  w.update({...s,tick:5,lifecycle:'complete',
   result:{reason:'escape'},visibleCells:[]});
  w.animate(3,{gateTime:3});
  assert.deepEqual(wings().map(node=>node.rotation.y),[0,0],
   'an unwitnessed private/hidden exit never stages a terminal animation');
  w.update({...s,tick:6,lifecycle:'complete',result:{reason:'escape'}});
  w.animate(3.2,{gateTime:3.2});
  assert.ok(wings().every(node=>Math.abs(Math.abs(node.rotation.y)-.98)<1e-8),
   'first-seen already-terminal exit is static and truthful, not a forged new opening');
  for(let i=0;i<6;i++){
   w.update({...s,runToken:'new-run-'+i,tick:1});
   w.animate(i+4,{gateTime:i+4});
   assert.deepEqual(wings().map(node=>node.rotation.y),[0,0],
    'new run cannot inherit a previous successful exit event');
   assert.ok(w.stats().geometryCount<100,'six real scene resets retain strict unweakened geometry budget');
  }
  assert.equal(JSON.stringify(s),unaltered,'renderer must not change game authority or private information');
 }finally{
  w.dispose();
  assert.equal(w.stats().geometryCount,0);
  assert.equal(w.stats().materialCount,0);
  assert.equal(w.stats().textureCount,0);
 }
});
