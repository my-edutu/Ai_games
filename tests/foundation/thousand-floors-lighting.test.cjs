'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {pathToFileURL}=require('node:url');
const base=path.resolve(__dirname,'../../public/ai-vs-1000-floors');
async function lighting(){assert.ok(fs.existsSync(path.join(base,'lighting.js')),'bounded district reflection lighting is missing');return import(pathToFileURL(path.join(base,'lighting.js')).href);}
test('district reflection maps are finite deterministic HDR fields with bounded size',async()=>{
 const {createDistrictRadiance}=await lighting();const THREE=await import('three');
 const a=createDistrictRadiance(0),b=createDistrictRadiance(0),c=createDistrictRadiance(4);
 try{
  assert.equal(a.mapping,THREE.EquirectangularReflectionMapping);
  assert.equal(a.type,THREE.FloatType);assert.equal(a.image.width,128);assert.equal(a.image.height,64);
  assert.deepEqual(a.image.data,b.image.data);assert.notDeepEqual(a.image.data,c.image.data);
  for(const v of a.image.data)assert.ok(Number.isFinite(v)&&v>=0&&v<=6);
  const rgb=Array.from(a.image.data).filter((_,i)=>i%4!==3);assert.ok(Math.max(...rgb)>1);assert.ok(Math.min(...rgb)<.2);
  assert.equal(a.colorSpace,THREE.LinearSRGBColorSpace);
 }finally{for(const t of [a,b,c])t.dispose();}
});
test('reflection rig supplies safe district fallback and actual scene lifecycle hooks',async()=>{
 const {createDistrictRadiance}=await lighting();const a=createDistrictRadiance(-1),b=createDistrictRadiance(0);
 try{assert.deepEqual(a.image.data,b.image.data);}finally{a.dispose();b.dispose();}
 const scene=fs.readFileSync(path.join(base,'scene.js'),'utf8');
 assert.match(scene,/scene\.environment\s*=\s*radianceTexture/);assert.match(scene,/radianceTexture\?\.dispose\(\)/);
 const {resolveAsset}=require('../../scripts/serve-thousand-floors.cjs');assert.equal(resolveAsset('/floors/lighting.js'),path.join(base,'lighting.js'));
});
