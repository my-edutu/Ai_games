'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const architectureFile=path.join(root,'public/ai-dungeon/architecture.js');

async function loadArchitecture(){
 const code=fs.readFileSync(architectureFile,'utf8');
 const threeUrl=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
 const rewritten=code.replace("'/dungeon/vendor/three.module.js'",JSON.stringify(threeUrl));
 assert.notEqual(rewritten,code,'test must use real installed Three.js');
 return import('data:text/javascript;base64,'+Buffer.from(rewritten).toString('base64'));
}
function face(x,z){return [x,0,z,0,1.2,0,0,1,0,0]}
function mockCanvas(){
 const ctx={fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},fill(){}};
 return {width:0,height:0,getContext(){return ctx}};
}
function triangles(geometry){return geometry.index?geometry.index.count/3:geometry.getAttribute('position').count/3}

test('authored lancet windows preserve original physical geometry and glass while submitting at most 3 retained draws per window',async()=>{
 const THREE=await import(pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href);
 const {addDungeonWindows}=await loadArchitecture();
 const previous=global.document;global.document={createElement(tag){assert.equal(tag,'canvas');return mockCanvas()}};
 try{
  const world=new THREE.Group(),materials=[],geometries=[],textures=[],occluders=[];
  const count=addDungeonWindows(world,[face(-9,-9),face(-3,-9),face(3,-9),face(9,-9)],3,
   {stone:'#786958',edge:'#a99884',glow:'#8ecaff'},materials,geometries,textures,occluders);
  assert.equal(count,4);
  assert.equal(world.children.length,4);
  assert.equal(occluders.length,4,'existing real-world camera cutaway must own every window as a unit');
  assert.equal(textures.length,1);
  assert.equal(materials.length,3,'share original glass, forged frame, and stone material roles');
  assert.equal(materials[0].side,THREE.DoubleSide);
  assert.equal(materials[0].map,textures[0]);
  const oldParts=[
   new THREE.PlaneGeometry(.58,.78),new THREE.TorusGeometry(.34,.055,7,20,Math.PI),
   ...Array.from({length:3},()=>new THREE.BoxGeometry(.045,.69,.045)),
   ...Array.from({length:2},()=>new THREE.CylinderGeometry(.045,.045,.46,7)),
   ...Array.from({length:2},()=>new THREE.BoxGeometry(.20,.16,.26)),
   ...Array.from({length:2},()=>new THREE.CylinderGeometry(.065,.09,1.1,8)),
   ...Array.from({length:2},()=>new THREE.BoxGeometry(.15,1.35,.24)),
   ...Array.from({length:2},()=>new THREE.BoxGeometry(.22,.64,.30)),
   new THREE.BoxGeometry(.83,.12,.25),new THREE.OctahedronGeometry(.105,0),
   ...Array.from({length:2},()=>new THREE.ConeGeometry(.13,.28,5))
  ];
  const originalTriangleCount=oldParts.reduce((sum,g)=>sum+triangles(g),0);
  for(const geometry of oldParts)geometry.dispose();
  const mergedTypes=new Set();
  for(const group of world.children){
   assert.equal(group.children.length,3,'one real physical mesh per authored material role (not 19 independent window draws)');
   assert.ok(group.children.every(mesh=>mesh.isMesh&&mesh.geometry.getAttribute('normal')&&mesh.geometry.getAttribute('uv')));
   assert.equal(new Set(group.children.map(mesh=>mesh.material)).size,3);
   assert.deepEqual(new Set(group.children.map(mesh=>mesh.material)),new Set(materials));
   assert.equal(group.children.reduce((sum,m)=>sum+triangles(m.geometry),0),originalTriangleCount,'all original physical geometry must survive');
   for(const mesh of group.children)mergedTypes.add(mesh.geometry);
   group.scale.setScalar(.02);
   assert.equal(group.children.length,3,'entire original window remains physically cutaway-ready');
  }
  assert.equal(world.children.reduce((n,group)=>n+group.children.length,0),12,'from 76 original independent window draw submissions to 12');
  assert.equal(mergedTypes.size,3,'merged role geometries retained and shared across all actual windows');
  for(const m of materials)m.dispose();
  for(const g of geometries)g.dispose();
  for(const t of textures)t.dispose();
 }finally{global.document=previous}
});

test('architectural render batching never imports DungeonRuntime or creates fallback actors or unbounded work',()=>{
 const code=fs.readFileSync(architectureFile,'utf8');
 assert.doesNotMatch(code,/DungeonRuntime|Math\.random|requestAnimationFrame/);
 assert.match(code,/count<4/,'original deterministic cap and spaced placement remain');
});
