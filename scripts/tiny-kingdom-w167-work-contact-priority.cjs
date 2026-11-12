'use strict';
// W167: real camera-prioritized human work; isolated policy test (not GPU FPS).
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const a=html.indexOf('<script>'),b=html.indexOf('</script>',a);
assert(a>=0&&b>a,'the actual complete playable script');
new vm.Script(html.slice(a+8,b),{filename:'tiny-kingdom.js'});
const start=html.indexOf('function selectVisibleCitizenDetail(');
const end=html.indexOf('// W24 Living Valley camera:',start);
assert(start>0&&end>start);
const policyStart=html.indexOf('function foundingScreenScaleDetailPolicy(');
assert(policyStart>0&&policyStart<start,'real W209 founding LOD must be captured');
const originalFunction=html.slice(policyStart,end);
assert(originalFunction.includes('visibleWorkContacts'));
assert(html.includes('limited.sort((a,b)=>a.i-b.i)'));
function simulate(working,pinned=false){
 const people=Array.from({length:18},(_,i)=>({
  name:'Citizen '+i,score:i===0?0:i===10?.11:i===11?.105:.2-i*.006,
  working:working&&i===10,unloading:working&&i===11
 }));
 const frame={lens:{viewportWidth:390,viewportHeight:844,
  verticalDegrees:64,horizontalDegrees:35},tanVertical:.6,tanHorizontal:.38,
  eye:[0,4,10],forward:[0,0,-1],right:[1,0,0],up:[0,1,0]};
 const deps={people,streetWalk:false,streetEncounterName:'',follow:pinned,liveWorkday:false,zoom:12,
  selectedCitizen:0,citizenDetailCameraFrame:()=>frame,
  projectRealCitizenDetail:p=>({visible:p.score>0,heightFraction:p.score,screenX:0,screenY:0}),
  isMarketUnloading:p=>p.unloading,isWorkingAtSite:p=>p.working,
  citizenProjectionCache:null,citizenProjectionHits:0,
  citizenProjectionBuilds:0,citizenProjectionActorsLast:0,
  presentationEpoch:0,state:{t:123},
  // W271 genuine paused-orbit policy dependencies; isolated harness must
  // provide the real renderer's default state, not silently skip this code.
  frozen:false,city:Array.from({length:17},()=>[0,0]),
  focusPoint:[0,0],yaw:0,pitch:.5,
  citizenOrbitDetailHold:null,citizenOrbitDetailHolds:0,
  citizenOrbitDetailReplans:0,citizenOrbitDetailLastWasHeld:false,
  canKeepOrbitDetail:()=>false};
 return new Function(...Object.keys(deps),originalFunction+';return selectVisibleCitizenDetail();')
  (...Object.values(deps));
}
const worked=simulate(true),idle=simulate(false);
assert.equal(worked.budget,5);
assert.equal(worked.indices.size,5,'no increased triangles or detailed-rig budget');
assert(worked.indices.has(10),'real in-view farmer gets detailed contact');
assert(worked.indices.has(11),'real in-view unloader gets detailed parcel contact');
assert.equal(worked.audit.visibleWorkContacts,2);
assert.equal(worked.audit.detailedWorkContacts,2);
assert(!worked.indices.has(0),'offscreen unpinned subject leaves full-detail budget for visible labor');
const pinned=simulate(true,true);
assert(pinned.indices.has(0),'real following retains its selected person');
assert(pinned.indices.has(10)&&pinned.indices.has(11),'real harvest and unload stay prioritized');
assert(worked.indices.has(1),'largest physical on-screen body protected');
assert(!idle.indices.has(10)&&!idle.indices.has(11),'no fabricated work priority');
assert.equal(worked.audit.population,18);
assert.equal(worked.audit.compactCount,13,'every other citizen remains physically rendered');
console.log('W167 source-bound policy PASS: authentic contacts prioritized inside unchanged budget. Real running-world A/B/hardware NOT PROVEN.');
