'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=html.indexOf('const FARM_FIELD_MESH_FLOAT_LIMIT=');
const end=html.indexOf('function drawResidentFarmFields(',start);
assert(start>0&&end>start,'Real crop functions must exist');
const crop=html.slice(start,end);
assert.match(crop,/function getOrBuildFarmSeasonMeshes\(season\)/);
assert.match(crop,/farmFieldSeasonCache=new Map\(\)/);
assert.match(crop,/farmFieldGpuCapacities=\[0,0\]/);
assert.match(crop,/gl\.bufferSubData\(gl\.ARRAY_BUFFER,0,meshes\[i\]\)/);
const prepare=crop.slice(crop.indexOf('function prepareResidentFarmFields('));
assert.doesNotMatch(prepare,/disposeResidentFarmFields\(\);/);
const buildStart=crop.indexOf('function buildOriginalCropMesh(');
const buildEnd=crop.indexOf('// W182:',buildStart);
assert(buildStart>=0&&buildEnd>buildStart);
const fragment=crop.slice(0,buildStart)+crop.slice(buildEnd);
let made=0,released=0,uploads=0,reallocs=0;
const builds=[];
const context=vm.createContext({
 navigator:{deviceMemory:8},gpuAvailable:true,
 farmScene:{rows:0,stalks:0,seedHeads:0},
 FARMSTEAD:{fields:[[0,4,0,4,2,2]]},
 gl:{ARRAY_BUFFER:34962,DYNAMIC_DRAW:35048,
  createBuffer(){return {serial:++made}},
  bufferData(_type,bytes){assert(bytes>0);reallocs++},
  bufferSubData(_type,offset,mesh){
   assert.equal(offset,0);assert(mesh.length>0);uploads++;
  }},
 bindGeometry(buffer){assert(buffer?.serial>0)},
 releaseGeometryBuffer(buffer){assert(buffer?.serial>0);released++},
 buildOriginalCropMesh(season,compact){
  builds.push({season,compact});
  const mesh=new Float32Array(compact?30:60);
  mesh.plotRanges=[{plot:0,first:0,count:mesh.length/10,stems:8}];
  for(let i=0;i<mesh.length;i++)mesh[i]=season+1+i/1000;
  context.farmScene.rows=100+season;
  context.farmScene.stalks=1000+season;
  return mesh;
 }});
vm.runInContext(fragment,context,{timeout:1500});
const run=expression=>vm.runInContext(expression,context,{timeout:1500});
for(const season of [0,1,2,3,0,1]){
 assert.equal(run('prepareResidentFarmFields('+season+')'),true);
 assert.equal(run('farmFieldResidentSeason'),season);
 assert.equal(context.farmScene.rows,100+season);
 assert.equal(context.farmScene.stalks,1000+season);
}
assert.equal(made,2,'Two complete original field GPU handles');
assert.equal(released,0,'No seasonal WebGL handle churn');
assert.equal(reallocs,2,'Retained field GPU allocations');
assert.equal(uploads,12,'Both full crop tiers still uploaded');
assert.equal(builds.length,8,'Original mesh generation avoided on 2 warm returns');
assert.equal(run('farmFieldSeasonHits'),2);
assert.equal(run('farmFieldSeasonMisses'),4);
assert.equal(run('farmFieldSeasonCache.size'),4);
assert.equal(run('farmFieldSeasonCachedFloats'),360);
assert.equal(run('farmFieldGpuHandleReuses'),10);
assert.equal(run('farmFieldResidentDisabled'),false);
assert.equal(run('farmFieldNear.ranges.length+farmFieldFar.ranges.length'),2);
assert.equal(run('farmFieldNear.mesh.length+farmFieldFar.mesh.length'),90);
context.farmScene.rows=0;context.farmScene.stalks=0;
assert.equal(run('prepareResidentFarmFields(1)'),true);
assert.equal(context.farmScene.rows,101,'Cached original stats survive farmstand reset');
assert.equal(context.farmScene.stalks,1001);
assert.equal(builds.length,8,'No false work when same season remains resident');
assert.match(html,/seasonCacheBudgetFloats:FARM_FIELD_SEASON_CPU_FLOAT_BUDGET/);
assert.match(html,/allOriginalPlotsPreserved:true/);
run('disposeResidentFarmFields()');
assert.equal(released,2,'Both GPU handles have an explicit cleanup');
assert.equal(run('farmFieldResidentSeason'),-1);
let syntacticallyValid=false;
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)){
 if(!match[1].includes('function prepareResidentFarmFields('))continue;
 new vm.Script(match[1]);syntacticallyValid=true;
}
assert(syntacticallyValid,'Compile full actual original inline playable game');
console.log('W182 farm season cache contract PASS: four original seasons, 2 warm recalls, 2 WebGL handles, full near/far, fixed-step economy untouched. No FPS claim.');
