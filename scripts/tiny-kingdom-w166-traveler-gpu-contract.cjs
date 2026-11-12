'use strict';
// W166: production helper + real bind-key contract, not a rendered-FPS claim.
// Test-first RED on pre-W166 source: missing isForegroundWalkingSkinCandidate.
const assert=require('node:assert/strict'),fs=require('node:fs'),
 path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const scriptStart=source.indexOf('<script>'),scriptEnd=source.indexOf('</script>',scriptStart);
assert(scriptStart>=0&&scriptEnd>scriptStart,'complete original playable game script');
new vm.Script(source.slice(scriptStart+8,scriptEnd),{filename:'tiny-kingdom-original-game.js'});
function extract(a,b){
 const start=source.indexOf(a),end=source.indexOf(b,start+a.length);
 assert(start>=0&&end>start,'original GPU actor contract: '+a);
 return source.slice(start,end);
}
const walk=extract('function isForegroundWalkingSkinCandidate(','function realForegroundPoseKey(');
const key=extract('function realForegroundPoseKey(','function realForegroundPoseStale(');
const stale=extract('function realForegroundPoseStale(','function prepareForegroundResidents(');
assert.match(source,/const walkingSkin=isForegroundWalkingSkinCandidate\(p,i,frame\)/);
assert.match(source,/const foregroundReady=prepareForegroundResidents\(foregroundRows,commuterFrame\)/);
assert.match(source,/const skinned=workingSkinCapable&&\(isWorkingAtSite\(p\)\|\|walkingSkin\)/);
assert.match(source,/physicallySkinnedCommuters:/);
assert.match(source,/workSkinDetailedMatrices\(entry,p\)/);
assert.match(source,/gl\.uniformMatrix4fv\(uniforms\.workBone,false,workSkinDetailedMatrices\(entry,p\)\)/);
const state={t:12};
const deps={workingSkinCapable:true,gpuAvailable:true,follow:false,
 liveWorkday:false,selectedCitizen:0,FOREGROUND_ROOT_METERS:.045,
 FOREGROUND_ROOT_RADIANS:.035,projectRealCitizenDetail:()=>({visible:true,heightFraction:.08}),
 isMarketUnloading:()=>false,isWorkingAtSite:()=>false,
 carryingCommuterLantern:p=>p.activity==='Returning home at dusk'&&state.t>=19,
 citizenRigPose:()=>({acting:{action:'walking'}}),climateAt:()=>({season:0}),state};
const make=d=>new Function(...Object.keys(d),walk+'\n'+key+'\n'+stale+
 '\nreturn {candidate:isForegroundWalkingSkinCandidate,key:realForegroundPoseKey,stale:realForegroundPoseStale};'
 )(...Object.values(d));
const p={name:'Original Citizen',job:'builder',activity:'Traveling to a worksite',
 x:1,z:2,phase:.21,target:[4,5],trait:'careful',friend:'Mira',energy:90,hunger:12};
const before=JSON.stringify(p),t=make(deps);
assert(t.candidate(p,1,{lens:'real-390px-or-desktop'}),'small genuine commuter retains 13-bone WebGL rig');
assert(!t.candidate({...p,delivery:{id:'real-consignment'}},1,{}),'real escrowed freight is always live');
assert(t.candidate({...p,activity:'Resting at home'},1,{}),
 'a genuine non-eating resting resident can retain its actual stationary GPU body');
assert(!make({...deps,verifiedHouseholdMealEvidence:()=>true})
 .candidate({...p,activity:'Resting at home'},1,{}),
 'a verified real meal must keep live CPU hands and food contact');
assert(!t.candidate({...p,phase:Infinity},1,{}),'no invalid vertex/pose input');
assert(!make({...deps,follow:true,selectedCitizen:1}).candidate(p,1,{}),'selected followed human must keep live hands');
assert(!make({...deps,liveWorkday:true,selectedCitizen:1}).candidate(p,1,{}),'filmed citizen stays full CPU contact');
assert(!make({...deps,isWorkingAtSite:()=>true}).candidate(p,1,{}),'active workers use existing contact skin policy');
assert(!make({...deps,projectRealCitizenDetail:()=>({visible:true,heightFraction:.16})}).candidate(p,1,{}),'large near actor stays live');
assert(make({...deps,projectRealCitizenDetail:()=>({visible:false,heightFraction:0})}).candidate(p,1,{}),'frustum actor retained, not omitted');
assert(!make({...deps,workingSkinCapable:false}).candidate(p,1,{}),'unsupported GPU uses original CPU');
const bind=t.key(p,1,true),cpu=t.key(p,1,false);
assert.notEqual(bind,cpu,'travel skin and CPU keys must never alias');
const fresh={key:bind,skinned:true,x:1,z:2,angle:0};
p.phase+=.45;p.x+=.32;p.z+=.13;
assert.equal(t.key(p,1,true),bind,'real feet/wrists update via GPU palette, no full mesh re-bake per stride');
state.t+=4;
assert.equal(t.key(p,1,true),bind,
 'an unchanged skinned adult must not rebuild complete geometry on a clock bucket');
assert.equal(t.stale(fresh,p,bind,0),false,'unchanged original skin binding retained with true root motion');
assert.notEqual(t.key(p,1,false),cpu,'ungrouped detailed CPU actor stays fresh');
assert.equal(t.stale({...fresh,skinned:false},p,bind,0),true,'non-skinned actor cannot masquerade as GPU gait');
assert.notEqual(t.key({...p,activity:'Returning home at dusk'},1,true),bind,'real life stage invalidates bind');
const lanternCommuter={...p,activity:'Returning home at dusk'};
state.t=17;
const commuterBeforeDusk=t.key(lanternCommuter,1,true);
state.t=23;
assert.notEqual(t.key(lanternCommuter,1,true),commuterBeforeDusk,
 'true dusk equips physical commuter lantern and invalidates GPU bind once');
assert.equal(before,JSON.stringify({...p,phase:.21,x:1,z:2}),'presentation-only tests alter no authoritative seed data');
console.log('W166 PASS: original citizen body, authentic route-driven GPU gait; real freight, large/selected actors stay CPU-live. Source/pose contract only, hardware and visual quality NOT PROVEN.');
