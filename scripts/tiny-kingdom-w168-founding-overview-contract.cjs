'use strict';
// W168: source-bound founding-view renderer contract; NOT a hardware FPS claim.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const a=html.indexOf('<script>'),b=html.indexOf('</script>',a);
assert(a>=0&&b>a,'actual complete playable Javascript');
new vm.Script(html.slice(a+8,b),{filename:'original-playable-tiny-kingdom.js'});
// Extract the REAL preceding founding optics policy together with its
// caller; earlier isolated tests omitted this required production function.
const first=html.indexOf('function foundingScreenScaleDetailPolicy(');
const last=html.indexOf('// W24 Living Valley camera:',first);
assert(first>0&&last>first);
const original=html.slice(first,last);
function scenario(count,zoom,opts={}){
 const people=Array.from({length:count},(_,i)=>({
  name:'Citizen '+i,job:i%3?'farmer':'courier',
  delivery:false,work:i===9||i===10}));
 const deps={people,streetWalk:Boolean(opts.streetWalk),streetEncounterName:'',
  follow:Boolean(opts.follow),liveWorkday:Boolean(opts.liveWorkday),
  zoom,selectedCitizen:0,citizenDetailCameraFrame:()=>({
   lens:{viewportWidth:opts.width||390,viewportHeight:844,verticalDegrees:64,horizontalDegrees:35},
   tanVertical:.6,tanHorizontal:.4,eye:[0,4,20],forward:[0,0,-1],
   right:[1,0,0],up:[0,1,0]}),
  projectRealCitizenDetail:p=>({
   visible:true,heightFraction:p.work?.12:.10,screenX:0,screenY:0}),
  isMarketUnloading:()=>false,isWorkingAtSite:p=>p.work,
  // The real selection policy evaluates paused-orbit hysteresis.
  // Source-executed mocks must provide the actual camera-mode dependencies.
  frozen:false,city:[],focusPoint:[0,0],yaw:0,pitch:0,
  presentationEpoch:0,state:{t:24},citizenProjectionCache:null,
  citizenProjectionHits:0,citizenProjectionBuilds:0,citizenProjectionActorsLast:0};
 return new Function(...Object.keys(deps),original+
  ';return selectVisibleCitizenDetail();')(...Object.values(deps));
}
for(const [name,plan,expected,founding] of [
 ['founders 1024px wide',scenario(12,43,{width:1024}),5,true],
 ['founders 390px wide',scenario(12,43,{width:390}),5,true],
 ['founders wider',scenario(12,80),5,true],
 ['founders workday close',scenario(12,23),12,false],
 ['founders follow',scenario(12,43,{follow:true}),12,false],
 ['founders live documentary',scenario(12,43,{liveWorkday:true}),12,false],
 ['original tiny village',scenario(5,43),5,false],
 ['real 28-person grown town',scenario(28,43),3,false]]){
 assert.equal(plan.indices.size,expected,name+' actual detailed rig count');
 assert.equal(plan.budget,expected,name+' fixed source budget');
 assert.equal(plan.audit.foundingOverviewLod,founding,name+' view mode');
 assert.equal(plan.audit.population,plan.audit.fullDetailCount+plan.audit.compactCount,
  name+' no humans omitted');
 assert(plan.indices.has(0),name+' selected original person protected');
 assert.equal(plan.audit.offscreenFullDetail,0);
 if(founding){
  assert(plan.indices.has(9)&&plan.indices.has(10),
   name+' real visible work contacts protected');
  assert(plan.audit.compactCount>0,name+' original articulated compact GPU path');
 }
}
console.log('W168 PASS: full JS syntax; founding wide/close, 390px, workday, follow, Day-120 population preserved. Real browser and measured speedup NOT PROVEN.');
