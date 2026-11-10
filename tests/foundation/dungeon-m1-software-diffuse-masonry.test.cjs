'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
async function load(){const src=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/postfx-budget.js'),'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'))}
const original=()=>({isMeshStandardMaterial:true,color:{hex:1},map:{name:'albedo'},emissive:{hex:2},emissiveMap:{name:'emissive'},
 emissiveIntensity:.3,side:2,fog:true,transparent:false,opacity:1,alphaTest:0,depthWrite:true,depthTest:true});
test('software stone retains authored texture/tint/light, depth and transparency without mutating source',async()=>{
 const {createSoftwareDiffuseMasonry:adapt}=await load();
 class Lambert{constructor(props){Object.assign(this,props);this.isMeshLambertMaterial=true}}
 const src=original(),tier=adapt({MeshLambertMaterial:Lambert},src,{software:true});
 assert.equal(tier.isMeshLambertMaterial,true);
 for(const key of ['map','color','emissive','emissiveMap','emissiveIntensity','fog','side','opacity','depthWrite','depthTest'])
  assert.strictEqual(tier[key],src[key],key);
 assert.equal(src.isMeshStandardMaterial,true);
});
test('hardware material remains original PBR by identity; invalid conversion is rejected',async()=>{
 const {createSoftwareDiffuseMasonry:adapt}=await load(),src=original();
 assert.strictEqual(adapt({},src,{software:false}),src);
 assert.throws(()=>adapt({},{}),/Only original/);
 assert.throws(()=>adapt({},src,{software:true}),/Lambert/);
});
test('real world owns diffuse tier only for masonry while combat and boss retain original materials',()=>{
 const app=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/app.js'),'utf8');
 const env=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/environment.js'),'utf8');
 for(const name of ['authoredStone','authoredFloor'])
  assert.ok(app.includes('createSoftwareDiffuseMasonry(THREE,'+name+','));
 for(const name of ['authoredFloorSurface','authoredWallSurface'])
  assert.ok(env.includes('createSoftwareDiffuseMasonry(THREE,'+name+','));
 assert.ok(app.includes('stone.bumpMap=softwareWebGL?null:wallMasonryTexture'));
 assert.ok(app.includes('const oathPlate=new THREE.Mesh('));
 assert.ok(app.includes('new THREE.MeshStandardMaterial({color:\'#53aebc\''));
});
