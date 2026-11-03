'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

// Original Three world geometry critic. Do not substitute model primitives,
// synthetic screenshot, private solver cells or mock GPU resource counts.
async function loadProduction(){
 const root=path.resolve(__dirname,'../..');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-public-fossil-alcove-'));
 try{
  fs.mkdirSync(path.join(tmp,'vendor'));
  fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"module"}');
  for(const file of ['world.js','gate-moment.mjs','map-view.mjs'])
   fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(tmp,file));
  for(const file of ['three.module.js','three.core.js'])
   fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(tmp,'vendor',file));
  const module=await import(pathToFileURL(path.join(tmp,'world.js')).href);
  const THREE=await import(pathToFileURL(path.join(tmp,'vendor/three.module.js')).href);
  return {module,THREE,done:()=>fs.rmSync(tmp,{recursive:true,force:true})};
 }catch(e){fs.rmSync(tmp,{recursive:true,force:true});throw e;}
}
const cell=(cell,neighbors=[],overrides={})=>({
 cell,neighbors,blocked:false,trap:false,checkpoint:false,clue:false,...overrides
});
const shot=(cells,overrides={})=>({
 runToken:'real-public-alcove',tick:1,width:7,height:7,currentCell:4,
 cells,visibleCells:cells.map(c=>c.cell),doors:[],keys:[],
 inventory:[],threats:[],exitCell:null,result:null,...overrides
});
function actualRibs(world,THREE,x,z){
 const out=[],matrix=new THREE.Matrix4(),vec=new THREE.Vector3();
 world.group.children[1].traverse(obj=>{
  if(!obj.isInstancedMesh||obj.geometry.type!=='ConeGeometry')return;
  if(!['cead72','b07953'].includes(obj.material.color.getHexString()))return;
  for(let i=0;i<obj.count;i++){
   obj.getMatrixAt(i,matrix);vec.setFromMatrixPosition(matrix);
   if(Math.abs(vec.x-x)<.32&&Math.abs(vec.z-z)<.32){
    out.push({x:vec.x,y:vec.y,z:vec.z,height:new THREE.Vector3().setFromMatrixScale(matrix).y});
   }
  }
 });
 return out;
}
test('safe truly disclosed tile physically grows side-facing fossil alcove without blocking its public passage',async()=>{
 const {module,THREE,done}=await loadProduction();
 const world=module.createMazeWorld({balanced:true}), again=module.createMazeWorld({balanced:true});
 try{
  const input=shot([cell(10,[11])]),frozen=JSON.stringify(input);
  world.update(input);
  again.update(shot([cell(10,[11])],{runToken:'other-public-run',tick:400}));
  const stats=world.stats();
  assert.equal(stats.tideFossilAlcoves,1);
  assert.deepEqual(stats.renderedCells,[10]);
  assert.ok(stats.geometryCount<=16&&stats.materialCount<=26&&stats.textureCount<=3);
  assert.equal(stats.instances,again.stats().instances,'variation is based solely on public coordinates');
  const center=module.cellPosition(10,7,7);
  // Public cell 10's only disclosed passage faces east (11); the carved
  // relic belongs against the opposite north edge, NOT in the lane.
  const ribs=actualRibs(world,THREE,center.x,center.z-.79);
  assert.equal(ribs.length,2,'two actual rooted ceramic ribs must exist in installed InstancedMesh matrices');
  assert.ok(ribs.every(r=>r.height>=.35&&r.height<=.49),'physically sculpted, low obstruction');
  assert.ok(ribs.every(r=>r.z<center.z-.5),'the tile center and eastward passage remain clear');
  assert.equal(JSON.stringify(input),frozen,'renderer must not mutate public source authority');
  world.update(shot([],{runToken:'new-private-run',tick:1}));
  assert.equal(world.stats().tideFossilAlcoves,0,'must disappear when no longer publicly disclosed');
 }finally{world.dispose();again.dispose();done();}
});
test('new rooted ivory fossil fans are physically taller but remain wall-side and disclosure-bound',async()=>{
 const {module,THREE,done}=await loadProduction();
 const world=module.createMazeWorld({balanced:true});
 try{
  world.update(shot([cell(10,[11])]));
  const center=module.cellPosition(10,7,7), matrix=new THREE.Matrix4();
  const vec=new THREE.Vector3(), scale=new THREE.Vector3();
  const fans=[];
  world.group.children[1].traverse(mesh=>{
   if(!mesh.isInstancedMesh||mesh.geometry.type!=='ConeGeometry'
    ||mesh.material.color.getHexString()!=='eed5a0')return;
   for(let i=0;i<mesh.count;i++){
    mesh.getMatrixAt(i,matrix);vec.setFromMatrixPosition(matrix);
    if(Math.abs(vec.x-center.x)<1.2&&Math.abs(vec.z-(center.z-.79))<.70){
     scale.setFromMatrixScale(matrix);
     if(Math.abs(scale.y-.82)<.002) fans.push({x:vec.x,z:vec.z,y:vec.y,h:scale.y});
    }
   }
  });
  assert.equal(fans.length,2,'actual installed Three world has two taller wall-rooted pale ribs');
  assert.ok(fans.every(f=>f.z<center.z-.75&&f.z>center.z-1.15
   &&f.y-module.cellHeight(10,7,7)>.60
   &&f.y-module.cellHeight(10,7,7)<.64),
   'both real fossil fans stay rooted above their public terrace and outside its east passage');
  assert.ok(world.stats().geometryCount<=16&&world.stats().materialCount<=26);
  world.update(shot([],{runToken:'reset',tick:1}));
  assert.equal(world.stats().tideFossilAlcoves,0);
 }finally{world.dispose();done();}
});

test('a trap, a matching key, a real public gate or undisclosed tile cannot grow a fake fossil objective',async()=>{
 const {module,done}=await loadProduction(),world=module.createMazeWorld({balanced:true});
 try{
  world.update(shot([cell(10,[11],{trap:true})]));
  assert.equal(world.stats().tideFossilAlcoves,0);
  world.update(shot([cell(10,[11])],{keys:[{id:'key-A',cell:10,collected:false}]}));
  assert.equal(world.stats().tideFossilAlcoves,0);
  world.update(shot([cell(10,[11]),cell(11,[10])],{
   doors:[{a:10,b:11,open:false,requiredKeyId:'key-A'}]}));
  assert.equal(world.stats().tideFossilAlcoves,0);
  world.update(shot([cell(10,[11])],{runToken:'inconsistent-source',hiddenRoute:[10,20],
   privateExitCell:10,sourceWallSecrets:{north:8}}));
  assert.equal(world.stats().tideFossilAlcoves,1,'private unknown fields cannot alter disclosed visual geometry');
 }finally{world.dispose();done();}
});
