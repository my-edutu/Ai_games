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


test('spatial wear follows actual walkability, preserves exit clarity and never consumes game RNG',async()=>{
 const {planEnvironmentSurfaceWear:plan}=await load();
 const map=['#########','#.......#','#.##..#.#','#.......#','#..#....#','#.......#','#.###...#','#.......#','#########'];
 const before=map.slice(),exit={x:7,z:7};
 const a=plan(map,1,exit),same=plan(map,1,exit),later=plan(map,2,exit);
 assert.deepEqual(a,same,'identical real geometry and floor make identical finish');
 assert.deepEqual(map,before,'planner never alters the authority grid');
 assert.equal(a.size,map.length);
 assert.equal(a.tiles.length,map.length**2);
 let count=0,minimum=1;
 for(let z=0;z<map.length;z++)for(let x=0;x<map.length;x++){
  const tile=a.tiles[z*map.length+x];
  if(map[z][x]!=='#'){
   count++;assert.equal(tile.x,x);assert.equal(tile.z,z);
   assert.ok(['traffic','damp','soot','dry'].includes(tile.wear));
   for(const color of [tile.r,tile.g,tile.b]){
    assert.ok(color>=.65&&color<=1.08,'walkable stone retains readable value');
    minimum=Math.min(minimum,color);
   }
   assert.ok(Object.isFrozen(tile));
  }else assert.equal(tile,null,'no finish over solid collision cells');
 }
 assert.equal(a.metrics.tiles,count);
 assert.equal(a.metrics.instanceColorBytes,count*12);
 assert.equal(a.metrics.bleedIntoWalls,0);
 assert.ok(a.metrics.damp+a.metrics.soot>0,'visible wear must not be uniform');
 assert.ok(minimum>=.65);
 assert.notDeepEqual(a.tiles,later.tiles,'different floors age differently');
 assert.equal(a.metrics.exitLit,true);
 assert.ok(Object.isFrozen(a.tiles)&&Object.isFrozen(a.metrics));
});
test('environment light presets change direction and physical bounce, never add lights',async()=>{
 const {planEnvironmentLightPreset:plan}=await load();
 const keys=new Set(),sky=new Set();
 for(let i=1;i<=4;i++){
  const p=plan(i);
  assert.equal(p.keyDirection.length,3);
  assert.ok(p.keyDirection.every(Number.isFinite));
  assert.ok(p.keyDirection[1]>=12&&p.keyDirection[1]<=25);
  assert.match(p.hemisphereSky,/^#[a-f0-9]{6}$/i);
  assert.match(p.hemisphereGround,/^#[a-f0-9]{6}$/i);
  keys.add(p.keyDirection.join('/'));sky.add(p.hemisphereSky);
  assert.ok(Object.isFrozen(p.keyDirection));
 }
 assert.ok(keys.size>=3&&sky.size>=3);
});
test('surface-weathering hooks target only existing floor instances and their original cladding',()=>{
 const app=read('app.js'),environment=read('environment.js');
 assert.match(app,/planEnvironmentSurfaceWear\(s\.map,s\.floor,s\.exit\)/);
 assert.match(app,/world\.userData\.floorSurfaceWear=/);
 assert.match(environment,/batched\(world,box,floorSurface,floorDetails,\{variation:true,floor,wear/);
 assert.doesNotMatch(app,/\.bossHP\s*=/);
});


test('original aged metal, timber and cloth detail is bounded and opt-out on software WebGL',async()=>{
 const {ENVIRONMENT_SETPIECE_DETAIL_BUDGET:budget,makeEnvironmentDetailPixels:make}=await load();
 assert.equal(budget.size,128);
 assert.equal(budget.textureCount,7);
 assert.equal(budget.rawBytes,7*128*128*4);
 assert.ok(budget.maxMipmappedBytes<=620000);
 assert.deepEqual(budget.roles,['timber','agedMetal','hangingCloth']);
 for(const role of budget.roles){
  const a=make(role,1),b=make(role,1);
  assert.deepEqual(a.albedoPixels,b.albedoPixels,'stable procedural material '+role);
  assert.ok(new Set(a.albedoPixels.filter((_,i)=>i%4===0)).size>=20);
 }
 const source=read('dungeon-setpieces.js');
 const atmosphere=read('biome-atmosphere.js');
 const app=read('app.js');
 assert.match(source,/if\(surfaceDetailEnabled&&placements\.length\)\{/);
 assert.match(source,/materialDetailMaps/);
 assert.match(source,/for\(const texture of detailTextures\)texture\.dispose\(\)/);
 assert.match(atmosphere,/createDungeonSetpieces\(root,map,floor,exit,\{surfaceDetailEnabled\}\)/);
 assert.match(app,/createBiomeAtmosphere\(world,s\.map,s\.floor,s\.exit,\{surfaceDetailEnabled:!softwareWebGL\}\)/);
});


test('original facade albedo and height relief share the same mortar geometry and seeded wear',async()=>{
 const {makeFacadeMasonryPixels:color,makeFacadeMasonryReliefPixels:relief}=await load();
 const palette={mortar:'#292721',stone:'#776a59',edge:'#af977a'};
 const wall=color(1,'wall',256,palette),floor=color(1,'floor',256,palette);
 const height=relief(1,256);
 for(const arr of [wall,floor,height]){
  assert.equal(arr.length,256*256*4);
  for(let i=3;i<arr.length;i+=4)assert.equal(arr[i],255,'opaque environmental surface');
 }
 assert.deepEqual(wall,color(1,'wall',256,palette));
 assert.deepEqual(height,relief(1,256));
 assert.notDeepEqual(wall,floor,'floor and wall need distinct mineral wear');
 assert.notDeepEqual(wall,color(2,'wall',256,palette),'floors age differently');
 const at=(arr,x,y,channel=0)=>arr[(y*256+x)*4+channel];
 for(const arr of [wall,floor]){
  assert.ok(at(arr,0,0)<at(arr,16,15),'mortar is physically darker than open stone face');
 }
 assert.ok(at(height,0,0)<at(height,16,15),'the visible mortar is recessed in the SAME atlas grid');
 const distinct=new Set(wall.filter((_,i)=>i%4===0)).size;
 assert.ok(distinct>50,'weathered stone contains real albedo range, not flat coloured rectangles');
 assert.throws(()=>color(1,'wall',2048,palette),RangeError);
 assert.throws(()=>color(1,'metal',256,palette),RangeError);
 assert.throws(()=>relief(0,256),RangeError);
});
test('original facade maps are produced once per floor with existing CanvasTexture ownership',()=>{
 const env=read('environment.js');
 assert.match(env,/makeFacadeMasonryPixels\(floor,kind,256,biome\)/);
 assert.match(env,/makeFacadeMasonryReliefPixels\(floor,256\)/);
 assert.match(env,/const reliefTex=new THREE\.CanvasTexture\(relief\)/);
 assert.match(env,/textures\.push\(floorTex,wallTex\)/);
 assert.match(env,/textures\.push\(reliefTex\)/);
});
