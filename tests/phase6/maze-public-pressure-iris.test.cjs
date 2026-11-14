'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');
async function load() {
 const root=path.resolve(__dirname,'../..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-iris-'));
 try {
  fs.mkdirSync(path.join(temp,'vendor'));
  fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
  for(const f of ['world.js','map-view.mjs','gate-moment.mjs'])
   fs.copyFileSync(path.join(root,'public/ai-maze-escape',f),path.join(temp,f));
  for(const f of ['three.module.js','three.core.js'])
   fs.copyFileSync(path.join(root,'node_modules/three/build',f),path.join(temp,'vendor',f));
  const THREE=await import(pathToFileURL(path.join(temp,'vendor/three.module.js')).href);
  const game=await import(pathToFileURL(path.join(temp,'world.js')).href);
  return {THREE,game,world:game.createMazeWorld({balanced:true}),cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
 } catch(e) {fs.rmSync(temp,{recursive:true,force:true});throw e;}
}
const state=(o={})=>({runToken:'pressure-iris',tick:1,width:3,height:3,currentCell:4,
 cells:[{cell:4,neighbors:[],blocked:false,trap:true,checkpoint:false,clue:false}],
 visibleCells:[4],keys:[],doors:[],inventory:[],threats:[],exitCell:null,result:null,...o});
const pieces=w=>[-1,1].flatMap(sx=>[-1,1].map(sz=>({sx,sz,
 obj:w.group.getObjectByName('Published tide-shear quarter iris '+sx+' '+sz)})));
const close=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-8,msg+' '+a+' != '+b);
test('published actual trap has four connected mineral valve quarters with staged open/retreat/reduced poses',async()=>{
 const {THREE,game,world,cleanup}=await load();
 try {
  const snapshot=state(),serialized=JSON.stringify(snapshot);
  world.update(snapshot);
  const root=world.group.getObjectByName('Disclosed tide-shear pressure hazard 4'),iris=pieces(world);
  assert.ok(root?.isGroup&&iris.every(q=>q.obj?.parent===root));
  assert.ok(iris.every(q=>q.obj.children.filter(c=>c.isMesh).length===3));
  assert.ok(iris.every(q=>q.obj.children.some(c=>c.name==='Published tide-shear moving sea-glass quadrant')));
  const budget=world.stats(),pos=game.cellPosition(4,3,3),
    near=new THREE.Vector3(pos.x,0,pos.z),far=new THREE.Vector3(99,0,99);
  world.animate(0,{explorerPosition:far});
  for(const {sx,sz,obj} of iris){close(obj.position.x,sx*.47,'rest x');close(obj.position.z,sz*.42,'rest z');close(obj.rotation.x,0,'rest rotation');}
  world.animate(0,{explorerPosition:near});
  iris.forEach(({sx,obj})=>close(obj.position.x,sx*.47,'warning before shutter'));
  world.animate(.30,{explorerPosition:near});
  assert.ok(iris.every(({obj})=>Math.abs(obj.rotation.x)>0&&Math.abs(obj.rotation.x)<.28));
  world.animate(.70,{explorerPosition:near});
  for(const {sx,sz,obj} of iris){close(obj.position.x,sx*.61,'open x');close(obj.position.z,sz*.52,'open z');close(obj.rotation.x,sz*.28,'open x angle');close(obj.rotation.z,-sx*.28,'open z angle');}
  world.animate(.75,{explorerPosition:far});
  iris.forEach(({sx,obj})=>close(obj.position.x,sx*.47,'withdraw closes'));
  world.animate(.8,{explorerPosition:near,reducedMotion:true});
  for(const {sx,sz,obj} of iris){close(obj.position.x,sx*(.47+.14*.55),'static reduced x');close(obj.rotation.x,sz*.12,'static reduced angle');}
  for(const k of ['geometryCount','materialCount','textureCount','instances'])
    assert.equal(world.stats()[k],budget[k],'reuse same resources');
  assert.equal(JSON.stringify(snapshot),serialized,'never modify authoritative public input');
 } finally{world.dispose();cleanup();}
});
test('private-only, remembered-only, terminal and new-run states cannot reveal or animate iris',async()=>{
 const {THREE,game,world,cleanup}=await load();
 try{
  const center=game.cellPosition(4,3,3),near=new THREE.Vector3(center.x,0,center.z);
  world.update(state({cells:[],visibleCells:[],privateTrapCells:[4],privateMap:{4:'secret'}}));
  assert.ok(pieces(world).every(q=>!q.obj),'private danger cannot create public iris');
  world.update(state({visibleCells:[]}));
  const iris=pieces(world);assert.ok(iris.every(q=>q.obj));
  world.animate(0,{explorerPosition:near,reducedMotion:false});
  iris.forEach(({sx,obj})=>close(obj.position.x,sx*.47,'remembered must rest'));
  world.animate(.1,{explorerPosition:near,reducedMotion:true});
  iris.forEach(({obj})=>close(obj.rotation.x,0,'hidden reduced must rest'));
  world.update(state());world.animate(.2,{explorerPosition:near});world.animate(.9,{explorerPosition:near});
  assert.ok(iris.some(({obj})=>Math.abs(obj.rotation.x)>.2),'true public contact opens');
  world.update(state({result:{reason:'trap-death'}}));world.animate(1,{explorerPosition:near});
  iris.forEach(({sx,obj})=>close(obj.position.x,sx*.47,'result must close'));
  world.update(state({runToken:'next',cells:[],visibleCells:[]}));
  assert.ok(pieces(world).every(q=>!q.obj),'new run removes old props');
  assert.equal(world.stats().responsiveTrapSignals,0);
 } finally{world.dispose();cleanup();}
});
