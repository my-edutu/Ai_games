'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=name=>fs.readFileSync(path.join(root,'public/ai-dungeon',name),'utf8');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(read('environment-look-plan.js')).toString('base64'));

test('stable physical role descriptors cover Session-5 architecture without touching character materials',async()=>{
 const {ENVIRONMENT_MATERIAL_ROLES:roles,getEnvironmentMaterialRole:role}=await load();
 assert.deepEqual(Object.keys(roles).sort(),['agedMetal','brass','carvedStone','dampStone',
  'floorStone','hangingCloth','magicInset','masonry','soot','timber'].sort());
 for(const [id,entry] of Object.entries(roles)){
  assert.equal(role(id),entry);assert.ok(Object.isFrozen(entry));
  assert.ok(entry.roughness>=.5&&entry.roughness<=1,id);
  assert.ok(entry.metalness>=0&&entry.metalness<=.85,id);
  assert.ok(entry.normalScale>=0&&entry.normalScale<=.5,id);
  assert.equal(entry.texelsPerMeter,128,id);
 }
 assert.ok(role('agedMetal').roughness>role('magicInset').roughness*.8);
 assert.equal(role('timber').metalness,0);
 assert.equal(role('hangingCloth').metalness,0);
 assert.equal(role('soot').emissiveIntensity,0);
 assert.throws(()=>role('__proto__'),RangeError);
});

test('floor presets preserve legibility, stop blanket glow and allocate no new shadow maps',async()=>{
 const {planEnvironmentLightPreset:plan,ENVIRONMENT_SURFACE_DETAIL_BUDGET:budget}=await load();
 const names=new Set();
 for(let floor=1;floor<=16;floor++){
  const p=plan(floor);names.add(p.biome);
  assert.ok(p.fogDensity>=.012&&p.fogDensity<=.020);
  assert.ok(p.exposure>=1.1&&p.exposure<=1.3);
  assert.ok(p.ambientScale>=.9&&p.ambientScale<=1.05);
  assert.ok(p.torchIntensity>=1.5&&p.torchIntensity<=2.0);
  assert.equal(p,plan(floor+4));
  assert.ok(Object.isFrozen(p));
 }
 assert.equal(names.size,4);
 assert.equal(budget.textureCount,5);
 assert.equal(budget.rawBytes,327680);
 assert.ok(budget.maxMipmappedBytes<=440000);
 assert.equal(budget.lightSourcesAdded,0);
 assert.equal(budget.shadowMapsAdded,0);
 assert.throws(()=>plan(0),RangeError);
 assert.throws(()=>plan(Infinity),RangeError);
});

test('original procedural albedo, normals and roughness are deterministic, non-flat, bounded and replay independent',async()=>{
 const {makeEnvironmentDetailPixels:make,ENVIRONMENT_SURFACE_DETAIL_BUDGET:budget}=await load();
 const one=make('masonry',1),same=make('masonry',1),other=make('floorStone',1),aged=make('agedMetal',2);
 for(const atlas of [one,other,aged]){
  assert.equal(atlas.width,budget.size);
  assert.equal(atlas.height,budget.size);
  assert.equal(atlas.rawBytes,3*128*128*4);
  for(const array of [atlas.albedoPixels,atlas.normalPixels,atlas.roughnessPixels]){
   assert.equal(array.length,128*128*4);
   assert.equal(array.every(x=>Number.isInteger(x)&&x>=0&&x<=255),true);
  }
  assert.ok(new Set(atlas.normalPixels.filter((_,i)=>i%4===0)).size>5,'physical bump variation');
  assert.ok(new Set(atlas.roughnessPixels.filter((_,i)=>i%4===1)).size>5,'roughness variation');
  for(let i=3;i<arrayLength(atlas.normalPixels);i+=4)assert.equal(atlas.normalPixels[i],255);
 }
 assert.deepEqual(one.albedoPixels,same.albedoPixels);
 assert.deepEqual(one.normalPixels,same.normalPixels);
 assert.deepEqual(one.roughnessPixels,same.roughnessPixels);
 assert.notDeepEqual(one.albedoPixels,other.albedoPixels);
 assert.notDeepEqual(make('masonry',1).albedoPixels,make('masonry',2).albedoPixels);
 assert.throws(()=>make('masonry',1,2048),RangeError);
 assert.throws(()=>make('masonry',-1),RangeError);
 function arrayLength(array){return array.length}
});

test('production-path wiring reuses existing material instances and environmental lights only',()=>{
 const app=read('app.js'),environment=read('environment.js'),biome=read('biome-atmosphere.js');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(app,/makeEnvironmentDetailPixels\('masonry',s\.floor/);
 assert.match(app,/clearEnvironmentDetailTextures\(\)/);
 assert.match(app,/if\(!softwareWebGL\)\{/);
 assert.match(app,/environmentLook:\{preset:environmentLightPreset\.biome/);
 assert.match(app,/moon\.intensity=environmentLightPreset\.moonIntensity/);
 assert.match(environment,/const surface=\(role,params\)=>/);
 assert.match(environment,/const torchIntensity=planEnvironmentLightPreset\(floor\)\.torchIntensity/);
 assert.match(biome,/roleMat\('dampStone'/);
 assert.ok(server.includes("['/dungeon/environment-look-plan.js','environment-look-plan.js']"));
});
