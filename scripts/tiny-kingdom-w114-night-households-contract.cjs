'use strict';
// W114: actual-source resident nighttime households. This is a CPU/WebGL-stub
// behavior contract, not a claim of hardware FPS or running-browser footage.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const inline=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline,'Playable inline game JS exists');
new vm.Script(inline,{filename:'tiny-kingdom.js'});
const a=html.indexOf('const NIGHT_HOMES_RESIDENT_MAX_FLOATS=');
const b=html.indexOf('// W57:',a);
assert.ok(a>=0&&b>a,'W114 implementation must live with real household renderers');
for(const marker of ['function prepareNightHomesResidentMesh()',
 'function drawNightHomesResidentMesh()','getNightHomesResidencyAudit',
 'if(!prepareNightHomesResidentMesh()){renderOccupiedHearths();renderHouseholdThresholds();}',
 '(nightHomesActive?nightHomesMesh?.length||0:0)',
 'disposeNightHomesResidentMesh();clearHomeClusterCache()'])
 assert.ok(html.includes(marker),marker);
const env={
 state:{t:24},data:[],currentMaterial:7,gpuAvailable:true,swiftGpu:false,
 city:[[1,2,0],[4,5,1]],full:new Set([0]),daylight:.2,
 homes:[{homeIndex:0,lot:[1,2,0],residents:['Ada']},
  {homeIndex:1,lot:[4,5,1],residents:['Kofi']}],
 atDoor:true,
 occupiedHearths:0,householdLightAudit:{litHomes:0,litWindows:0,litCitizens:0,triangles:0},
 householdThresholdRenderStats:{homes:0,triangles:0},
 gl:{ARRAY_BUFFER:1,DYNAMIC_DRAW:2,TRIANGLES:4,uploads:0,deletes:0,draws:0,
  createBuffer(){return {buffer:1}},deleteBuffer(){this.deletes++},
  bufferData(){},bufferSubData(){this.uploads++},
  drawArrays(_,__,n){this.draws=n}},
 // Mirror real renderer GPU lifecycle in isolated cleanup stub.
 releaseGeometryBuffer(target){if(target)env.gl.deleteBuffer(target)},
 bindGeometry(){},
 skyConditions(){return {daylight:env.daylight}},
 climateAt(){return {season:2}},
 detailedHomeSet(){return env.full},
 compactHouseArchetype(){return 0},
 occupiedHouseholds(){return env.homes},
 getHouseholdThresholdAudit(){
  return {entries:env.homes.map(h=>({
   homeIndex:h.homeIndex,lot:h.lot,door:[h.lot[0]+.3,h.lot[1]],
   atDoor:env.atDoor,nearCottage:true}))};
 },
 renderOccupiedHearths(){
  env.occupiedHearths=env.homes.length;
  env.householdLightAudit.litHomes=env.homes.length;
  env.householdLightAudit.litWindows=env.homes.length*16;
  for(const h of env.homes)env.data.push(...Array(30).fill(h.homeIndex+1));
  env.householdLightAudit.triangles=env.homes.length;
 },
 renderHouseholdThresholds(){
  env.householdThresholdRenderStats.homes=env.atDoor?env.homes.length:0;
  env.householdThresholdRenderStats.triangles=env.atDoor?env.homes.length:0;
  if(env.atDoor)for(const h of env.homes)
   env.data.push(...Array(30).fill(h.homeIndex+2));
 }
};
const api=Function('env','with(env){'+html.slice(a,b)+
 'return {prepareNightHomesResidentMesh,drawNightHomesResidentMesh,'+
 'disposeNightHomesResidentMesh,getNightHomesResidencyAudit,'+
 'setNightHomesResidencyForTesting};}')(env);
assert.equal(api.prepareNightHomesResidentMesh(),true);
let audit=api.getNightHomesResidencyAudit();
assert.equal(audit.homes,2);
assert.equal(audit.buffers,1);
assert.equal(audit.meshFloats,120);
assert.equal(env.gl.uploads,1);
assert.equal(env.data.length,0,'One offscreen CPU scratch must not leak into moving actors');
assert.equal(env.currentMaterial,7);
assert.equal(api.prepareNightHomesResidentMesh(),true);
assert.equal(env.gl.uploads,1,'Unchanged genuine residents must not reupload');
assert.ok(api.getNightHomesResidencyAudit().reuses>0);
api.drawNightHomesResidentMesh();
assert.equal(env.gl.draws,12);
env.full=new Set([1]);
assert.equal(api.prepareNightHomesResidentMesh(),true,'camera quality moves real window heights');
assert.equal(env.gl.uploads,2);
env.atDoor=false;
assert.equal(api.prepareNightHomesResidentMesh(),true,'arrival/leave changes actual threshold');
assert.equal(env.gl.uploads,3);
assert.equal(api.getNightHomesResidencyAudit().thresholds,0);
env.daylight=.95;
assert.equal(api.prepareNightHomesResidentMesh(),true);
assert.equal(api.getNightHomesResidencyAudit().active,false,'daylight removes night mesh');
assert.equal(env.householdLightAudit.litHomes,0,'daylight audit is not stale');
env.daylight=.2;
assert.equal(api.prepareNightHomesResidentMesh(),true);
assert.equal(env.gl.uploads,3,'matching real night reuses bounded VBO');
env.homes=[env.homes[0]];
assert.equal(api.prepareNightHomesResidentMesh(),true,'occupancy invalidates cached home lights');
assert.equal(api.getNightHomesResidencyAudit().homes,1);
assert.equal(env.gl.uploads,4);
api.disposeNightHomesResidentMesh();
assert.equal(api.getNightHomesResidencyAudit().buffers,0);
assert.equal(env.gl.deletes,1,'resident buffer released on reset/restore');
api.setNightHomesResidencyForTesting(false);
assert.equal(api.prepareNightHomesResidentMesh(),false,'original dynamic fallback remains');
console.log('W114 nightly genuine-residency WebGL-stub source contract PASS; real browser/performance NOT MEASURED');
