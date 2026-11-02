'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const modulePath=path.join(root,'public/ai-dungeon/wall-masonry-plan.js');
async function load(){
 const source=fs.readFileSync(modulePath,'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
test('original wall masonry albedo is bounded, opaque, non-flat and reproducible for each biome',async()=>{
 const {makeWallMasonryPixels}=await load();
 for(let floor=1;floor<=8;floor++){
  const pixels=makeWallMasonryPixels(floor,128);
  assert.equal(pixels.length,128*128*4);
  assert.deepEqual(Buffer.from(pixels),Buffer.from(makeWallMasonryPixels(floor,128)));
  const rgb=new Set();
  for(let i=0;i<pixels.length;i+=4){
   for(let c=0;c<3;c++)assert.ok(Number.isFinite(pixels[i+c])&&pixels[i+c]>=0&&pixels[i+c]<=255);
   assert.equal(pixels[i+3],255,'no transparent pixels or overdraw');
   rgb.add(pixels[i]+','+pixels[i+1]+','+pixels[i+2]);
  }
  assert.ok(rgb.size>=15,'stone courses, pores and chipped mortar must be visible');
  const grout=pixels[0]+pixels[1]+pixels[2];
  const stoneOffset=(15*128+15)*4;
  const stone=pixels[stoneOffset]+pixels[stoneOffset+1]+pixels[stoneOffset+2];
  assert.ok(stone>grout+50,'base wall no longer reads as a flat black rectangle');
 }
 assert.notDeepEqual(Buffer.from(makeWallMasonryPixels(1)),Buffer.from(makeWallMasonryPixels(2)));
});
test('wall material has no uncontrolled dimensions, malformed floor or random source',async()=>{
 const {makeWallMasonryPixels}=await load();
 for(const floor of [NaN,Infinity,-1,0,1.2,'1',null,10001])
  assert.equal(makeWallMasonryPixels(floor).length,0);
 for(const size of [0,31,257,Infinity,NaN,'128',1.5])
  assert.equal(makeWallMasonryPixels(1,size).length,0);
 assert.equal(makeWallMasonryPixels(1,32).length,32*32*4);
 assert.equal(makeWallMasonryPixels(1,256).length,256*256*4);
 const source=fs.readFileSync(modulePath,'utf8');
 assert.doesNotMatch(source,/Math\.random|Date\.|performance\.|fetch\(|DungeonRuntime|requestAnimationFrame/);
});
test('actual base walls use the original albedo and low bump depth through one instanced 3D material',()=>{
 const scene=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.ok(scene.includes("from '/dungeon/wall-masonry-plan.js'"));
 assert.match(scene,/makeWallMasonryPixels\(s\.floor,128\)/);
 assert.match(scene,/stone\.map=wallMasonryTexture/);
 assert.match(scene,/stone\.bumpMap=wallMasonryTexture/);
 assert.match(scene,/stone\.bumpScale=\.04/);
 assert.match(scene,/wallMasonryTexture\?\.dispose\(\)/);
 assert.match(scene,/wallMasonry:\{/);
 assert.match(scene,/instance\(fracturedWall,stone,walls/,'the sculpted wall surface must retain the same bounded original masonry albedo and bump map');
 assert.ok(server.includes("['/dungeon/wall-masonry-plan.js','wall-masonry-plan.js']"));
});

test('sunken crypt stone albedo is warm weathered limestone rather than monochrome blue slate',async()=>{
 const {makeWallMasonryPixels}=await load();
 const sample=(floor,x=17,y=16)=>{
  const pixels=makeWallMasonryPixels(floor,128),i=(y*128+x)*4;
  return [...pixels.slice(i,i+3)];
 };
 const crypt=sample(1),ember=sample(2),obsidian=sample(3),hollow=sample(4);
 assert.ok(crypt[0]-crypt[1]>=12&&crypt[1]-crypt[2]>=12,
  'crypt masonry must retain an earthy warm-red > green > blue color separation');
 assert.ok(crypt[0]-crypt[2]>=30,'crypt wall highlight must not read as cobalt/teal');
 assert.ok(ember[0]>ember[2]+18,'ember retains a distinct fired sandstone palette');
 assert.ok(obsidian[2]>obsidian[0]+20,'obsidian deliberately remains blue for biome contrast');
 assert.ok(hollow[2]>hollow[1]+20,'hollow retains violet rather than sharing crypt palette');
 assert.notDeepEqual(crypt,ember);
 const scene=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(scene,/stone\.color\.set\(theme\.wallTint\)/);
 assert.match(scene,/floorMat\.color\.set\(theme\.floorTint\)/);
 assert.match(scene,/stoneEdge\.color\.set\(theme\.trimTint\)/);
 assert.match(scene,/stoneGrade:\{/,'the real WebGL scene must expose actual applied materials for browser proof');
});
