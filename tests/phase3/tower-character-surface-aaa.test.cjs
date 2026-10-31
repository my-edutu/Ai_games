'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const file=path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/characters.mjs');
const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
let loaded;
function load(){
 if(!loaded){const src=fs.readFileSync(file,'utf8').replace(/from ['"]\/tower\/vendor\/three\.module\.js['"]/, `from '${threeURL}'`);
 loaded=import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);}
 return loaded;
}
function skinnedMaterials(model){const list=[];model.group.traverse(o=>{if(o.isSkinnedMesh)list.push(o.material)});return list;}
test('hero armor and guardian carry original, bounded microtexture rather than flat uniform surfaces',async t=>{
 const {createClimber,createEnemy}=await load();
 for(const make of [createClimber,()=>createEnemy('guardian')]){
  const model=make();t.after(()=>model.dispose());
  const materials=skinnedMaterials(model).filter(m=>!m.emissive||m.emissiveIntensity===0);
  assert.ok(materials.length>1);
  const textured=materials.filter(m=>m.map?.isDataTexture&&m.normalMap?.isDataTexture&&m.roughnessMap?.isDataTexture);
  assert.ok(textured.length>=2, 'armour and metal surfaces have shared PBR wear maps');
  const color=textured[0].map,normal=textured[0].normalMap;
  assert.ok(color.image.width<=128&&normal.image.height<=128, 'texture CPU and GPU allocations capped');
  assert.ok(textured.every(m=>m.map===color&&m.normalMap===normal),'one atlas per character rather than per mesh');
  const pixelData=color.image.data;
  assert.ok(new Set(Array.from(pixelData.slice(0,4096).filter((v,i)=>i%4===0))).size>6,'weathering has visible material variance');
 }
});
test('surface atlas ownership releases textures with the character, not just the material',async()=>{
 const {createClimber}=await load();const model=createClimber();
 const map=skinnedMaterials(model).find(m=>m.map?.isDataTexture)?.map;
 assert.ok(map);
 let disposals=0;map.addEventListener('dispose',()=>disposals++);
 model.dispose();model.dispose();
 assert.equal(disposals,1,'exactly once on owner disposal');
});
test('distant sentinel remains light-weight without allocating hero-quality atlases',async()=>{
 const {createEnemy}=await load();const actor=createEnemy('sentinel');
 try{assert.equal(skinnedMaterials(actor).filter(m=>m.normalMap?.isDataTexture).length,0);}
 finally{actor.dispose();}
});
