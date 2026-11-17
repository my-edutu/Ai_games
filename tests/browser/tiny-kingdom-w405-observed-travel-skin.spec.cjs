'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
function sourceBetween(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a);
 assert.ok(a>=0&&b>a,'Original playable source contains '+start);
 return html.slice(a,b);
}
function eligible(p,overrides={}){
 const context={
  workingSkinCapable:true,gpuAvailable:true,follow:true,liveWorkday:true,
  selectedCitizen:3,Math,Number,Map,
  document:{body:{dataset:{citizenInspect:'off'}}},
  isMarketUnloading:q=>Boolean(q.unloading),
  isWorkingAtSite:q=>Boolean(q.working),
  verifiedHouseholdMealEvidence:q=>Boolean(q.eating),
  projectRealCitizenDetail:q=>({visible:q.visible!==false,
   heightFraction:q.heightFraction??.17}),
  foregroundResidentCache:new Map(),
  physicallySmallWalkingSkinWindow:(height,held)=>
   Number.isFinite(height)&&height>=0&&height<(held?.45:.39),
  ...overrides
 };
 vm.createContext(context);
 vm.runInContext(sourceBetween('function isForegroundWalkingSkinCandidate(',
  'function realForegroundPoseKey('),context,{timeout:1000});
 return context.isForegroundWalkingSkinCandidate(p,3,{camera:'real'});
}
const genuine={name:'Mira',job:'farmer',activity:'Traveling to farm',
 x:11,z:4,phase:.12,heightFraction:.17,provisions:0};
test('W405 genuine followed small unloaded traveler keeps original live 13-joint GPU rig',()=>{
 assert.equal(eligible(genuine),true,'real on-screen followed traveler should be eligible');
 assert.equal(eligible({...genuine,activity:'Traveling to market'}),true);
 assert.equal(eligible({...genuine,heightFraction:.27}),false,
  'large portrait hero must retain original CPU contact/face animation');
 assert.equal(eligible({...genuine,visible:false}),false,
  'do not allocate a hidden followed actor');
});
test('W405 real cargo, unloading, work contacts and meals never enter shader-only travel',()=>{
 for(const changes of [
  {delivery:{id:'legit-escrow',stage:'loaded',amount:5}},
  {unloading:true},{working:true},{eating:true},
  {activity:'Returning home at dusk',provisions:3},
  {activity:'Resting at home'},{activity:'Building house'},
  {activity:'Traveling to market',x:NaN}
 ])assert.equal(eligible({...genuine,...changes}),false,JSON.stringify(changes));
 assert.equal(eligible(genuine,{document:{body:{dataset:{citizenInspect:'on'}}}}),false,
  'explicit up-close player inspection keeps original CPU body');
 assert.equal(eligible(genuine,{workingSkinCapable:false}),false,
  'unsupported GPU joints must never remove citizen');
});
test('W405 nearby non-hero work and real registered source geometry remain',()=>{
 const render=sourceBetween('const foregroundRows=gpuAvailable?', 'dynamicPhaseTimes.residentActorManagement=');
 assert.match(render,/isForegroundResidentCandidate\(p,i,nearPeople\)/);
 assert.match(render,/isForegroundWorksiteCandidate\(p,i,nearPeople,commuterFrame\)/);
 assert.match(render,/isForegroundWalkingSkinCandidate\(p,i,commuterFrame\)/,
  'real selected traveler must be added to original foreground stream');
 const sculpt=sourceBetween('function prepareForegroundResidents(', 'function drawForegroundResidentMesh(');
 assert.match(sculpt,/villager\(p\)/,'preserve original full citizen geometry');
 assert.match(sculpt,/workSkinTags/,'preserve real 13-joint GPU skin');
 assert.match(sculpt,/foregroundResidentBudgetAdmits/,'bounded GPU memory fallback');
 const renderActors=sourceBetween('const liveActorGeometryStart=performance.now()',
  'householdCarriedSackStats.carriers=0');
 assert.match(renderActors,/if\(!foregroundIndices.has\(i\)\)villager\(people\[i\]\)/,
  'every rejected hero remains rendered in original CPU path');
});
