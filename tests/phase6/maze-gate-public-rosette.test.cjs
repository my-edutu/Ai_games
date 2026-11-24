'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');
// Separate real-source critic: loads the shipped Three world, not a copied rule.
async function loadWorld(){
 const root=path.resolve(__dirname,'../..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-rosette-'));
 try{
  fs.mkdirSync(path.join(tmp,'vendor'));
  fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"module"}');
  for(const f of ['world.js','gate-moment.mjs','map-view.mjs'])fs.copyFileSync(path.join(root,'public/ai-maze-escape',f),path.join(tmp,f));
  for(const f of ['three.module.js','three.core.js'])fs.copyFileSync(path.join(root,'node_modules/three/build',f),path.join(tmp,'vendor',f));
  const {createMazeWorld}=await import(pathToFileURL(path.join(tmp,'world.js')).href);
  return {world:createMazeWorld({balanced:true}),close:()=>fs.rmSync(tmp,{recursive:true,force:true})};
 }catch(e){fs.rmSync(tmp,{recursive:true,force:true});throw e;}
}
const cell=(id,neighbors=[])=>({cell:id,neighbors,blocked:false,trap:false,checkpoint:false,clue:false});
const known=[cell(77,[76]),cell(76,[77]),cell(94,[95]),cell(95,[94])];
const door={a:77,b:94,open:false,requiredKeyId:'key-1'};
const frame=(doors=[],cells=known,run='test',tick=1)=>({runToken:run,tick,width:17,height:17,currentCell:77,
 cells,visibleCells:cells.map(c=>c.cell),doors,keys:[],inventory:[],threats:[],exitCell:null,result:null});
function disks(world){
 const found=[];
 world.group.children[1].traverse(m=>{
  if(!m.isInstancedMesh||m.geometry.type!=='CylinderGeometry'||m.material.color.getHexString()!=='5d968e')return;
  for(let i=0;i<m.count;i++){
   const a=m.instanceMatrix.array,o=16*i;
   if(Math.abs(a[o]-.36)<1e-5&&Math.abs(a[o+5]-.009)<1e-5&&Math.abs(a[o+10]-.36)<1e-5)
    found.push([a[o+12],a[o+13],a[o+14]]);
  }
 });
 return found.sort((a,b)=>a[2]-b[2]);
}
test('true publicly disclosed gate creates two grounded physical tide rosettes, not HUD',async()=>{
 const {world,close}=await loadWorld();
 try{
  const base=frame(),original=JSON.stringify(base);world.update(base);
  assert.equal(world.stats().gateCourtRosettes,0);
  const source=frame([door]),unchanged=JSON.stringify(source);
  world.update(source);
  assert.equal(world.stats().gateCourtRosettes,2);
  assert.equal(world.stats().renderedCells.length,4);
  const p=disks(world);
  assert.equal(p.length,2,'both real sea-glass disks must be instanced production Three geometry');
  assert.ok(Math.abs(p[1][2]-p[0][2]-2.4)<1e-4);
  assert.ok(Math.abs(p[0][0]-p[1][0])<1e-4);
  world.update(frame([{...door,open:true}],known,'test',2));
  assert.equal(world.stats().gateCourtRosettes,2,'no tile popping during genuine gate opening');
  assert.deepEqual(disks(world),p);
  assert.equal(JSON.stringify(source),unchanged,'physical scene does not mutate authority');
  assert.equal(JSON.stringify(base),original);
  world.update(frame([],known,'reset',3));
  assert.equal(world.stats().gateCourtRosettes,0,'new run cannot inherit old gate knowledge');
 }finally{world.dispose();close();}
});
test('undisclosed, diagonal, isolated, blocked or hazard tiles never receive fictional gate artwork',async()=>{
 const {world,close}=await loadWorld();
 try{
  for(const [doors,cells,expected] of [
   [[door],[cell(77,[76]),cell(76,[77]),cell(95)],0],
   [[{...door,a:77,b:95}],known,0],
   [[door],[cell(77),cell(94)],0],
   // The real disclosed pressure trap takes visual priority over a decorative
   // gate rosette on its public apron; it must not look like a safe marker.
   [[door],[{...cell(77,[76]),trap:true},cell(76,[77]),cell(94,[95]),cell(95,[94])],0],
   [[door],[{...cell(77,[76]),blocked:true},cell(76,[77]),cell(94,[95]),cell(95,[94])],0],
   [[door],[cell(77,[76]),{...cell(76,[77]),blocked:true},cell(94,[95]),{...cell(95,[94]),blocked:true}],0],
   [[door],[cell(77,[62]),cell(62),cell(94,[79]),cell(79)],0]
  ]){
   world.update(frame(doors,cells));
   assert.equal(world.stats().gateCourtRosettes,expected);
   assert.deepEqual(world.stats().renderedCells,cells.map(c=>c.cell));
  }
 }finally{world.dispose();close();}
});
