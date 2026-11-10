'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
async function load(){
 const url=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
 const ambient='data:text/javascript;base64,'+Buffer.from(read('public/ai-dungeon/ambient-focus-plan.js')).toString('base64');
 const original=read('public/ai-dungeon/living-world.js');
 const code=original.replace("'/dungeon/vendor/three.module.js'",JSON.stringify(url))
  .replace("'/dungeon/ambient-focus-plan.js'",JSON.stringify(ambient));
 assert.notEqual(original,code);
 return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
}
const map=Array.from({length:21},()=>'.'.repeat(21));
const find=(root,name)=>root.children[0].children.find(m=>m.name===name);
const matrixAt=(mesh,i,THREE)=>{let m=new THREE.Matrix4();mesh.getMatrixAt(i,m);return m};
test('original 13 physical flying creatures retain independent wing movement in only four GPU draws',async()=>{
 const THREE=await import(pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href);
 const {createLivingWorld}=await load(),world=new THREE.Group(),life=createLivingWorld(world,map,1);
 assert.equal(life.metrics.animatedCreatures,13);
 assert.equal(life.metrics.sourceDrawUnits,40);
 assert.equal(life.metrics.retainedDrawUnits,4);
 assert.equal(world.children[0].children.length,4);
 const core=find(world,'Original living-world bodies');
 const left=find(world,'Original living-world left wing');
 const right=find(world,'Original living-world right wing');
 assert.ok([core,left,right].every(m=>m?.isInstancedMesh&&m.count===13));
 const previous=matrixAt(left,0,THREE).elements.slice(),base=matrixAt(core,0,THREE).elements.slice();
 life.update(1.25);
 assert.notDeepEqual(matrixAt(left,0,THREE).elements,previous);
 assert.notDeepEqual(matrixAt(core,0,THREE).elements,base);
 assert.notDeepEqual(matrixAt(left,0,THREE).elements,matrixAt(right,0,THREE).elements);
 for(const n of matrixAt(right,0,THREE).elements)assert.ok(Number.isFinite(n));
 assert.equal(right.geometry.getAttribute('position').getX(1),-left.geometry.getAttribute('position').getX(1));
 assert.ok(life.metrics.original3DGeometry&&life.metrics.retainedWingAnimation);
 life.dispose();assert.equal(world.children.length,0);
});
test('authored halo biome uses one retained physical ring batch and retires owned resources',async()=>{
 const THREE=await import(pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href);
 const {createLivingWorld}=await load(),world=new THREE.Group(),life=createLivingWorld(world,map,4);
 const halo=find(world,'Original living-world spectral halos');
 assert.ok(halo?.isInstancedMesh&&halo.count===13);
 assert.equal(life.metrics.sourceDrawUnits,53);
 assert.equal(life.metrics.retainedDrawUnits,5);
 const before=matrixAt(halo,0,THREE).elements.slice();life.update(3.5);
 assert.notDeepEqual(matrixAt(halo,0,THREE).elements,before);
 let disposed=0;
 for(const mesh of world.children[0].children)mesh.geometry.addEventListener('dispose',()=>disposed++);
 life.dispose();assert.equal(world.children.length,0);assert.ok(disposed>=5);
});
test('original combat quiet-zone source remains immutable and all GPU transforms finite',async()=>{
 const THREE=await import(pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href);
 const {createLivingWorld}=await load(),world=new THREE.Group(),life=createLivingWorld(world,map,2);
 const s={phase:'exploring',tick:20,map,units:[{id:'hero',faction:'party',hp:100,x:10,z:10,kind:'vanguard',action:'attack',targetId:'boss',actionTick:19},{id:'boss',faction:'enemy',hp:200,x:11,z:10,kind:'warden'}],bossWarning:{attackTick:21,cells:[{x:10,z:10}]}};
 const before=JSON.stringify(s);
 life.accept(s);life.update(2.6);assert.equal(JSON.stringify(s),before);
 const m=new THREE.Matrix4();
 for(const mesh of world.children[0].children)if(mesh.count){
  for(let i=0;i<Math.min(3,mesh.count);i++){
   mesh.getMatrixAt(i,m);assert.ok(m.elements.every(Number.isFinite));
  }
 }
 life.dispose();
});
