'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

// Critic directly inspects the REAL instantiated Three gate, not source
// text, hand-drawn images, actor masking, or test-only replacement geometry.
async function loadWorld(){
 const root=path.resolve(__dirname,'../..');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-real-gate-cutaway-'));
 try{
  fs.mkdirSync(path.join(tmp,'vendor'));
  fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"module"}');
  for(const f of ['world.js','gate-moment.mjs','map-view.mjs'])
   fs.copyFileSync(path.join(root,'public/ai-maze-escape',f),path.join(tmp,f));
  for(const f of ['three.module.js','three.core.js'])
   fs.copyFileSync(path.join(root,'node_modules/three/build',f),path.join(tmp,'vendor',f));
  const {createMazeWorld}=await import(pathToFileURL(path.join(tmp,'world.js')).href);
  return {world:createMazeWorld({balanced:true}),
   done:()=>fs.rmSync(tmp,{recursive:true,force:true})};
 }catch(e){fs.rmSync(tmp,{recursive:true,force:true});throw e;}
}
const cell=id=>({cell:id,neighbors:[],blocked:false,trap:false,checkpoint:false,clue:false});
const pair=[cell(77),cell(94)];
const shot=(doors=[{a:77,b:94,open:false}],cells=pair,runToken='public-cutaway',tick=1)=>({
 runToken,tick,width:17,height:17,currentCell:77,
 cells,visibleCells:cells.map(c=>c.cell),doors,keys:[],inventory:[],
 threats:[],exitCell:null,result:null
});
function physicalGate(world){
 const gate=world.group.getObjectByName('Disclosed sealed gate')
  ||world.group.getObjectByName('Disclosed open gate');
 return gate;
}
test('real disclosed opening has two slim structural piers still physically bearing a connected cap and lintel',async()=>{
 const {world,done}=await loadWorld();
 try{
  const before=shot(),json=JSON.stringify(before);
  world.update(before);
  const gate=physicalGate(world), lintel=gate?.getObjectByName('Slim disclosed gate tide-lintel');
  assert.ok(gate&&lintel?.isMesh,'actual 3D masonry must exist for a disclosed door');
  const footing=[],piers=[],caps=[];
  for(const side of [-1,1]){
   const foot=gate.getObjectByName('Disclosed gate cutaway foot '+side);
   const pier=gate.getObjectByName('Disclosed gate slim structural pier '+side);
   const cap=gate.getObjectByName('Disclosed gate compact joined cap '+side);
   assert.ok(foot?.isMesh&&pier?.isMesh&&cap?.isMesh,'both gates keep visible real solid parts');
   assert.ok(foot.visible&&pier.visible&&cap.visible,'no fake see-through or hidden doorway mask');
   assert.ok(pier.scale.x<=.22&&pier.scale.z<=.25&&pier.scale.y>=1.45,
    'remove excess foreground masonry width/depth without amputating the tall gate support');
   assert.ok(cap.scale.x<=.32&&cap.scale.z<=.35&&cap.scale.y>=.15,
    'upper stone supports are compact but remain physical');
   assert.ok(foot.scale.x<=.35&&foot.scale.z<=.39,'footprint does not reclaim actor air');
   assert.ok(Math.abs(pier.position.x)>=.9,'supports remain clear of the walkable center');
   assert.ok(Math.abs(cap.position.x-lintel.position.x)<1.1,'cap supports shared gate lintel');
   const capTop=cap.position.y+cap.scale.y/2;
   const pierTop=pier.position.y+pier.scale.y/2;
   const headerBottom=lintel.position.y-lintel.scale.y/2;
   assert.ok(pierTop>=cap.position.y-cap.scale.y/2-.001,
    'compact cap still sits on its structural pier');
   assert.ok(capTop>=headerBottom,
    'the upper lintel physically overlaps its cap, not a floating plank');
   footing.push(foot.scale.toArray());
   piers.push(pier.scale.toArray());
   caps.push(cap.scale.toArray());
  }
  const resource=world.stats();
  world.update(shot([{a:77,b:94,open:true}],pair,'public-cutaway',2));
  const now=physicalGate(world);
  assert.ok(now?.name==='Disclosed open gate');
  for(const side of [-1,1]){
   assert.deepEqual(now.getObjectByName('Disclosed gate slim structural pier '+side).scale.toArray(),piers[(side+1)/2]);
   assert.deepEqual(now.getObjectByName('Disclosed gate cutaway foot '+side).scale.toArray(),footing[(side+1)/2]);
   assert.deepEqual(now.getObjectByName('Disclosed gate compact joined cap '+side).scale.toArray(),caps[(side+1)/2]);
  }
  const after=world.stats();
  assert.equal(after.geometryCount,resource.geometryCount);
  assert.equal(after.materialCount,resource.materialCount);
  assert.equal(after.textureCount,resource.textureCount);
  assert.ok(after.geometryCount<=16&&after.materialCount<=26&&after.textureCount<=3);
  assert.equal(JSON.stringify(before),json,'world cannot mutate authoritative public snapshot');
 }finally{world.dispose();done();}
});
test('unseen or unconfirmed gate cannot acquire decorative cutaway structure across a new run',async()=>{
 const {world,done}=await loadWorld();
 try{
  world.update(shot([],pair));
  assert.equal(physicalGate(world),undefined);
  world.update(shot([{a:77,b:94,open:false}],[cell(1)],'public-cutaway',2));
  assert.equal(physicalGate(world),undefined);
  const privateFields={...shot(),hiddenPaths:[8,9,10],futureExit:12,
   privateThreat:{cell:16},privateKeys:['unknown']};
  world.update(privateFields);
  assert.ok(physicalGate(world),'only current published door authorizes real masonry');
  world.update(shot([],[], 'new-unseen-run',3));
  assert.equal(physicalGate(world),undefined,'no previous gate survives a new private run');
  assert.deepEqual(world.stats().renderedCells,[]);
 }finally{world.dispose();done();}
});
