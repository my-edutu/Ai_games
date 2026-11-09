'use strict';
// W154 — full original cottage/civic/market foreground, real moving courier.
// Run with: node scripts/tiny-kingdom-w154-physical-camera-residency-contract.cjs
// Source-level regression only: never call this a WebGL or hardware FPS proof.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('let cameraArchitectureResidentKey=null');
const camera=html.indexOf('function followCameraRoofs(){',start);
const end=html.indexOf('function cameraOcclusionModel(){',camera);
assert(start>=0&&camera>start&&end>camera,'true physical camera architecture is present');
const declaration=html.slice(start,camera);
const candidate=html.slice(camera,end);
assert.match(declaration,/boundedEntries:1/);
assert.match(candidate,/realCourierCartCameraVolumes\(\)/);
assert.match(candidate,/cameraArchitectureResidentVolumes=roofs\.slice\(\)/);
const storyStart=html.indexOf('function observedWorkdayCameraPlan(');
const storyEnd=html.indexOf('function getCourierDocumentaryCameraAudit(',storyStart);
assert(storyStart>=0&&storyEnd>storyStart);
const story=html.slice(storyStart,storyEnd);
assert.match(story,/cache\.cityTopology===cameraArchitectureTopologyKey\(\)/,
 'restore must invalidate the physical camera plan, not just renderer cache');
assert.match(story,/cityTopology:cameraArchitectureTopologyKey\(\)/);
const original=candidate
 .replace(/ const topology=cameraArchitectureTopologyKey\(\);[\s\S]*? const detailed=detailedHomeSet\(\);/,
  ' const detailed=detailedHomeSet();')
 .replace(/[\s\S]*?\/\/ Real G096 video/, 'function oldRoofs(){\n // Real G096 video')
 .replace(/ if\(cameraArchitectureResidentKey!==null\)cameraArchitectureInvalidations\+\+;[\s\S]*? cameraArchitectureBuilds\+\+;\n /,' ');
const fixtures=`
let city=[[1,2,1],[5,6,0]],people=[{name:'Courier',x:2,z:3,delivery:{id:'real'},path:[[4,6]]}],detailedCalls=0;
const CRAFT_DISTRICT={x:12,z:-8,width:5,depth:7},FARMSTEAD={granary:[29,-7.6]},
MARKET_STALLS=[{x:-2,z:5},{x:4,z:5}],MARKET_ENTRY_ARCH={x:0,z:8,postOffset:2,beamWidth:5,beamHeight:3};
function detailedHomeSet(){detailedCalls++;return new Set(city.map((_,i)=>i))}
function houseVisualProfile(){return {height:1.9,pitch:1.25}}
function terrain(x,z){return Math.sin(x*.21+z*.13)}
function physicalTradeCorridorCameraVolumes(){return [{x:4,z:10,rx:1,rz:.5,bottom:1,top:2,kind:'receiving-hall-roof'}]}
function realCourierCartCameraVolumes(){return people.filter(p=>p.delivery).map(p=>({x:p.x,z:p.z,rx:1,rz:1,bottom:0,top:1,kind:'courier-cart',deliveryId:p.delivery.id}))}
`;
const previous=new Function(fixtures+original+'return {view:oldRoofs,edit:f=>f(city,people),calls:()=>detailedCalls};')();
const current=new Function(fixtures+declaration+candidate+
 'return {view:followCameraRoofs,edit:f=>f(city,people),calls:()=>detailedCalls,audit:getCameraArchitectureResidencyAudit};')();
const check=(stage)=>assert.deepStrictEqual(current.view(),previous.view(),stage);
check('two authentic houses');check('same camera repeat');check('repeated survey');
assert.equal(previous.calls(),3);assert.equal(current.calls(),1);
assert.equal(current.audit().builds,1);
assert.equal(current.audit().reuses,2);
const changes=[
 ['real moving cargo',(lots,people)=>{people[0].x+=3;people[0].z-=1},1],
 ['new occupied home',lots=>lots.push([20,14,2]),2],
 ['same-count save restore',lots=>lots.splice(1,1,[6,7,0]),3],
 ['changed real roof variant',lots=>lots[0][2]=3,4]
];
for(const [stage,edit,builds] of changes){
 previous.edit(edit);current.edit(edit);
 check(stage);
 assert.equal(current.audit().builds,builds);
}
assert.equal(current.audit().realHomes,3);
assert.equal(current.audit().cachedBuildings,17);
assert.equal(current.audit().authorityChanged,false);
console.log('W154 physical camera parity, topology restore, real courier overlay: PASS (isolated source fixtures; no actual browser/FPS claim)');
