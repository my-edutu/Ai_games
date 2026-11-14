'use strict';
// W317 RED/GREEN: actual original civic farm/market GPU residency must survive
// changed real household/freight roads without a complete civic reupload.
// The software/Canvas path must retain complete geometry exactly.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'live playable renderer must exist');
new Function(script);
const start=script.indexOf('const CIVIC_CORE_MAX_ENTRIES=');
const end=script.indexOf('let civicGrowthRefreshes=',start);
assert.ok(start>=0&&end>start,'must execute production original core');
const original=script.slice(start,end);
function exercise(hardware){
 const gpuCalls={created:0,uploads:0,deletes:0};
 let data=Array.from({length:300},(_,i)=>i/10);
 const env={
  data,
  navigator:{deviceMemory:8},Float32Array,Map,Math,Number,
  civicGpuResidencyEnabled:hardware,gpuAvailable:hardware,
  gl:{ARRAY_BUFFER:34962,STATIC_DRAW:35044,
   createBuffer:()=>({id:++gpuCalls.created}),
   bufferData:(target,array)=>{assert.ok(array instanceof Float32Array);gpuCalls.uploads++;},
  },
  bindGeometry:()=>{},
  packLinearResidentScenery:mesh=>({vertices:mesh,ranges:[{
   first:0,count:mesh.length/10,minX:-1,minY:-1,minZ:-1,
   maxX:1,maxY:1,maxZ:1}]}),
  packSpatialScenery:()=>{throw Error('should reuse linear packed original geometry')},
  releaseGeometryBuffer:()=>{gpuCalls.deletes++},
  stationaryFounders:()=> 'founders-stable',
  appendCivicCachedVertices:mesh=>env.data.push(...mesh),
  climateAt:()=>({season:0}),
  prepareResidentFarmFields:()=>true,
  farmFieldResidentSeason:0,farmFieldResidentDisabled:true,
  state:{t:7},
  guildhallVisualStats:{roof:1},farmScene:{grain:1},
  craftCounters:{forge:1},marketQuarterStats:{stalls:4},
  currentMaterial:7,
 };
 vm.runInNewContext(original,env,{timeout:2500});
 const evalCore=s=>vm.runInNewContext(s,env,{timeout:2500});
 assert.equal(evalCore('rememberCivicCore("spring",0)'),true);
 assert.equal(gpuCalls.created,hardware?1:0);
 env.data=[];
 assert.equal(evalCore('recallCivicCore("spring")'),true);
 assert.equal(env.data.length,hardware?0:300,
  'hardware must draw original stored core VBO; software must append every float');
 assert.equal(evalCore('recallCivicCore("spring")'),true);
 assert.equal(gpuCalls.uploads,hardware?1:0,
  'near-road changed streets must NOT reupload original market/farm core');
 const audit=evalCore('getCivicCoreResidencyAudit()');
 assert.equal(audit.fullOriginalGeometryPreserved,true);
 if(hardware){
  assert.equal(audit.gpuResident,true);
  assert.equal(audit.gpuUploads,1);
  assert.equal(audit.gpuTriangles,10);
 }
 // A new climate must retain a separately, genuinely seasonal GPU source.
 env.data=Array.from({length:300},(_,i)=>i/8);
 assert.equal(evalCore('rememberCivicCore("autumn",0)'),true);
 assert.equal(gpuCalls.uploads,hardware?2:0);
 evalCore('clearCivicCoreCache()');
 assert.equal(gpuCalls.deletes,hardware?2:0,
  'every GPU core must be released on save restore/world reset');
 assert.equal(evalCore('getCivicCoreResidencyAudit().cachedFloats'),0);
 return gpuCalls;
}
const hardware=exercise(true),software=exercise(false);
assert.match(script,/scenicVisibilityStats\.civicCore\s*=\s*drawVisibleStaticChunks/,
 'real playable WebGL must issue the genuine complete original core draw');
assert.match(script,/activeCivicCoreMesh\(\)\.length/,
 'Day-120 triangle guard must include split real civic core');
console.log('W317 PASS: genuine core GPU mesh drawn separately from dirty streets, no repeated original core upload on near-road construction; software full-geometry fallback, season and reset bounded. Hardware FPS NOT MEASURED.',hardware,software);
