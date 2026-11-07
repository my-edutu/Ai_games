'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');
// Real world object test: no mock lintel, no fake screenshots or hidden state.
async function physicalWorld(){
 const root=path.resolve(__dirname,'../..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-gate-tide-lintel-'));
 try{
  fs.mkdirSync(path.join(tmp,'vendor'));fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"module"}');
  for(const f of ['world.js','gate-moment.mjs','map-view.mjs'])
   fs.copyFileSync(path.join(root,'public/ai-maze-escape',f),path.join(tmp,f));
  for(const f of ['three.module.js','three.core.js'])
   fs.copyFileSync(path.join(root,'node_modules/three/build',f),path.join(tmp,'vendor',f));
  const {createMazeWorld}=await import(pathToFileURL(path.join(tmp,'world.js')).href);
  return {world:createMazeWorld({balanced:true}),done:()=>fs.rmSync(tmp,{force:true,recursive:true})};
 }catch(e){fs.rmSync(tmp,{force:true,recursive:true});throw e;}
}
const cell=id=>({cell:id,neighbors:[],blocked:false,trap:false,checkpoint:false,clue:false});
const door={a:77,b:94,open:false,requiredKeyId:'key-1'};
const frame=(doors=[],cells=[cell(77),cell(94)],runToken='physical-lintel',tick=1)=>({
 runToken,tick,width:17,height:17,currentCell:77,cells,visibleCells:cells.map(c=>c.cell),
 doors,keys:[],inventory:[],threats:[],exitCell:null,result:null});
test('published gate keeps a true solid connected but slender physical arch, not a fake UI mask',async()=>{
 const {world,done}=await physicalWorld();
 try{
  const before=frame([door]),original=JSON.stringify(before);
  world.update(before);
  const lintel=world.group.getObjectByName('Slim disclosed gate tide-lintel');
  assert.ok(lintel?.isMesh,'real production Three mesh has to exist in the disclosed world');
  assert.equal(lintel.parent.name,'Disclosed sealed gate');
  assert.ok(lintel.scale.x>2.1&&lintel.scale.y<=.16&&lintel.scale.z<=.27,
   'thinner non-cropped gate header still spans both original solid jambs');
  assert.ok(lintel.position.y>1.75&&lintel.position.y<1.9);
  const caps=lintel.parent.children.filter(m=>m.isMesh
    &&Math.abs(m.position.y-1.66)<1e-9
    &&Math.abs(Math.abs(m.position.x)-.91)<1e-9);
  assert.equal(caps.length,2,'both physical stone jamb caps must exist');
  const headerBottom=lintel.position.y-lintel.scale.y/2;
  for(const cap of caps)assert.ok(headerBottom<=cap.position.y+cap.scale.y/2,
    'the carved lintel joins each real cap instead of hovering in the air');
  const resources=world.stats();
  world.update(frame([{...door,open:true}],undefined,'physical-lintel',2));
  const opened=world.group.getObjectByName('Slim disclosed gate tide-lintel');
  assert.ok(opened?.isMesh,'the genuine opened passage retains its solid architectural header');
  assert.deepEqual(opened.scale.toArray(),lintel.scale.toArray());
  assert.equal(world.stats().geometryCount,resources.geometryCount);
  assert.equal(world.stats().materialCount,resources.materialCount);
  assert.equal(world.stats().textureCount,resources.textureCount);
  assert.equal(JSON.stringify(before),original,'rendering cannot mutate public authority');
  world.update(frame([],undefined,'new-unseen-run',3));
  assert.equal(world.group.getObjectByName('Slim disclosed gate tide-lintel'),undefined,
    'new run cannot preserve a gate that was never publicly disclosed');
 }finally{world.dispose();done();}
});
test('a fake hidden door cannot conjure a visible modeled arch or invent route',async()=>{
 const {world,done}=await physicalWorld();
 try{
  world.update(frame([{...door,a:77,b:94}],[cell(30)]));
  assert.equal(world.group.getObjectByName('Slim disclosed gate tide-lintel'),undefined);
  assert.deepEqual(world.stats().renderedCells,[30]);
  world.update(frame([door],[cell(77)]));
  // Existing rule permits one-end-visible gate silhouette: the other side
  // remains undisclosed, and only that public door can be modeled.
  assert.ok(world.group.getObjectByName('Slim disclosed gate tide-lintel'));
  assert.deepEqual(world.stats().renderedCells,[77]);
 }finally{world.dispose();done();}
});
