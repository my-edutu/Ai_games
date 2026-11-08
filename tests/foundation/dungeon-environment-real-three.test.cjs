'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const THREE=require('three');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const root=path.resolve(__dirname,'../..');
const pathTo=name=>path.join(root,'public/ai-dungeon',name);
const read=name=>fs.readFileSync(pathTo(name),'utf8');
const toData=src=>'data:text/javascript;base64,'+Buffer.from(src).toString('base64');

async function loadRenderer(){
 const threeUrl=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
 const moduleText=read('dungeon-setpieces.js')
  .replaceAll("'/dungeon/vendor/three.module.js'",JSON.stringify(threeUrl))
  .replaceAll("'/dungeon/setpiece-plan.js'",JSON.stringify(toData(read('setpiece-plan.js'))))
  .replaceAll("'/dungeon/environment-look-plan.js'",JSON.stringify(toData(read('environment-look-plan.js'))));
 return import(toData(moduleText));
}
function usedSurfaceTextures(group){
 const textures=new Set(),roles=new Set();
 group.traverse(object=>{
  const material=object.material;
  if(!material)return;
  for(const mat of Array.isArray(material)?material:[material]){
   if(mat.userData.environmentMaterialRole)roles.add(mat.userData.environmentMaterialRole);
   for(const key of ['map','normalMap','roughnessMap'])if(mat[key])textures.add(mat[key]);
  }
 });
 return {textures,roles};
}

test('real Three.js setpieces allocate only used texture roles and release every image',async()=>{
 const {createDungeonSetpieces}=await loadRenderer();
 const {map,exit}=DungeonRuntime.create('setpiece-qa-0').publicState();
 for(const [floor,expected] of [[1,2],[2,2],[3,2],[4,7]]){
  const world=new THREE.Group();
  const art=createDungeonSetpieces(world,map,floor,exit,{surfaceDetailEnabled:true});
  assert.ok(art.metrics.landmarks>=4);
  assert.equal(art.metrics.materialDetailMaps,expected,'only actual motif materials allocate PBR atlases');
  assert.equal(art.metrics.materialDetailRawBytes,expected*128*128*4);
  const {textures,roles}=usedSurfaceTextures(world);
  assert.equal(textures.size,expected,'maps are shared among real meshes, not leaked per instance');
  assert.ok(roles.has('masonry')&&roles.has('carvedStone')&&roles.has('agedMetal'));
  if(floor===4){
   assert.ok(roles.has('timber')&&roles.has('hangingCloth'));
  }else{
   assert.ok(!roles.has('timber')&&!roles.has('hangingCloth'));
  }
  let disposals=0;
  for(const tex of textures)tex.addEventListener('dispose',()=>disposals++);
  art.dispose();
  assert.equal(disposals,expected,'floor retirement disposes all added GPU texture objects');
  assert.equal(world.children.length,0,'no orphan setpiece group on floor change');
 }
});

test('software WebGL fallback never allocates optional PBR maps or loses real wall motifs',async()=>{
 const {createDungeonSetpieces}=await loadRenderer();
 const {map,exit}=DungeonRuntime.create('setpiece-qa-0').publicState();
 const world=new THREE.Group(),art=createDungeonSetpieces(world,map,4,exit,{surfaceDetailEnabled:false});
 assert.ok(art.metrics.landmarks>=4);
 assert.equal(art.metrics.materialDetailMaps,0);
 assert.equal(art.metrics.materialDetailFallback,true);
 assert.equal(usedSurfaceTextures(world).textures.size,0);
 art.dispose();assert.equal(world.children.length,0);
});
