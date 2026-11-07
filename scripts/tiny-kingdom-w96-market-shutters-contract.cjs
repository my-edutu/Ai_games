'use strict';
// W96 test-first contract: eight EXISTING, authentic trading-booth shutters
// share ONE resident GPU mesh. World clock remains source of truth.
// Do not use this synthetic arithmetic test as evidence of frame quality.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert(match,'Missing real Tiny Kingdom inline app');
const game=match[1];new vm.Script(game,{filename:'tiny-kingdom.js'});
for(const essential of [
 'function marketOperatingAudit(time=state.t)',
 'function renderMarketOperatingShutters(openingOverride=null,tagForResident=false)',
 'function prepareResidentMarketShutters()',
 'function drawResidentMarketShutters()',
 'function getMarketShutterResidencyAudit()',
 'function completeActualDelivery(',
 'queueMicrotask(start);const mat4multiply='
])assert(game.includes(essential),'Missing real source: '+essential);
assert(game.includes('marketShutterResidentActive?marketShutterResidentMesh?.length||0:0'),
 'Must count resident geometry in original triangle budget');
assert(game.includes('marketShutterResidentMesh.length/30'),
 'Original eight door leaves must be audited');
assert(game.includes('const shutters=inspectMeshGeometry(marketShutterResidentMesh)'),
 'Resident market door geometry must be included in complete mesh integrity audit');
assert(game.includes('if(materialId>14.0&&materialId<14.5)'),
 'Real GLSL market shutters must rotate in vertex shader');
assert(game.includes('surfaceMaterial=6.0'),
 'Shutter must retain original wooden material');
assert(game.includes('const leafTag=14+(stallIndex*2+(side===1?1:0)+1)/32'),
 'Every original market leaf must have unique encoded hinge');
const stalls=[
 {x:-5.4,z:2.25,face:1},{x:4.45,z:2.95,face:1},
 {x:4.30,z:8.50,face:-1},{x:-5.75,z:8.70,face:-1}
];
const openAt=t=>{
 const hour=((t%24)+24)%24;
 return Math.round(Math.max(0,Math.min(1,
  (hour-5.75)/1.25,(21.75-hour)/1.25))*1000)/1000;
};
for(let stallIndex=0;stallIndex<stalls.length;stallIndex++)
 for(const side of [-1,1]){
 const leaf=stallIndex*2+(side===1?1:0);
 const tag=Math.fround(14+(leaf+1)/32);
 const decoded=Math.floor(((tag%1)*32)+.5)-1;
 assert.equal(decoded,leaf,'Shader tag decode must be lossless');
 const s=stalls[stallIndex],pivot=[s.x+side*1.21,s.z+s.face*.96];
 for(const time of [0,5.75,6.03,6.43,7,9,12,18,21.31,21.75,23.1,120*24+6.22]){
  const hour=((time%24)+24)%24;
  const gpuOpen=Math.floor(Math.max(0,Math.min(1,
   (hour-5.75)/1.25,(21.75-hour)/1.25))*1000+.5)/1000;
  assert(Math.abs(gpuOpen-openAt(time))<.000001);
  const angle=-side*s.face*gpuOpen*1.48;
  for(const delta of [[.0,.0],[.62,.27],[-.48,-.14]]){
   const cs=Math.cos(angle),sn=Math.sin(angle);
   const x=pivot[0]+delta[0],z=pivot[1]+delta[1];
   const cpu=[pivot[0]+cs*(x-pivot[0])-sn*(z-pivot[1]),
    pivot[1]+sn*(x-pivot[0])+cs*(z-pivot[1])];
   const gpu=[pivot[0]+cs*delta[0]-sn*delta[1],
    pivot[1]+sn*delta[0]+cs*delta[1]];
   assert(Math.hypot(cpu[0]-gpu[0],cpu[1]-gpu[1])<1e-9,
    'Resident original leaf must preserve physical hinge');
  }
 }
}
console.log('W96 source + 8-leaf original shutter clock/hinge parity PASS (NOT browser or hardware proof)');
