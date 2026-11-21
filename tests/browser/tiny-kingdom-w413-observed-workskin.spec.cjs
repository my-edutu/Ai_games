'use strict';
// W413: only a genuinely active, visibly watched original citizen may enter
// the complete detailed 13-joint GPU skin; authentic freight and meals stay live.
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
function extract(a,b){const start=html.indexOf(a),end=html.indexOf(b,start+a.length);
 assert.ok(start>=0&&end>start,'real original game anchor: '+a);
 return html.slice(start,end);
}
test('W413 genuine selected worksite hero admits full-detail 13-bone resident, never a fake transaction',()=>{
 const policy=extract('function isObservedWorksiteSkinCandidate(', 'function isForegroundWorksiteCandidate(');
 assert.match(policy,/workingSkinCapable/);
 assert.match(policy,/isWorkingAtSite\(p\)/);
 assert.match(policy,/i===selectedCitizen/);
 assert.match(policy,/follow\|\|liveWorkday/);
 assert.match(policy,/!p\.delivery/);
 assert.match(policy,/isMarketUnloading\(p\)/);
 assert.match(policy,/verifiedHouseholdMealEvidence/);
 assert.doesNotMatch(policy,/state\.\w+\s*=|people\.(?:push|splice)|Math\.random/);
 const roster=extract('const foregroundRows=residentRows', 'const foregroundReady=');
 assert.match(roster,/isObservedWorksiteSkinCandidate\(p,i,nearPeople\)/);
 const rank=extract('const ranked=rows.map(', 'ranked.sort(');
 assert.match(rank,/isObservedWorksiteSkinCandidate\(row.p,row.i,nearPeople\)/);
 const skin=extract('function prepareForegroundResidents(', 'function drawForegroundResidentMesh(');
 assert.match(skin,/villager\(p\)/);
 assert.match(skin,/workSkinTags\(mesh.length\/10,labels\)/);
 const draw=extract('function drawForegroundResidentMesh(', '// A\/B toggle changes presentation');
 assert.match(draw,/workSkinDetailedMatrices\(entry,p\)/);
});
test('W413 observed worksite shader admission requires original authority and exact safety exclusions',()=>{
 const body=extract('function isObservedWorksiteSkinCandidate(', 'function isForegroundWorksiteCandidate(');
 const start=body.indexOf('{'),end=body.lastIndexOf('}');
 const functionOnly=body.slice(0,end+1);
 // Parsed against V8: the original explicit logical gates are exercised as
 // real JS with stubbed render-only inputs, not only inspected as regex text.
 const context={workingSkinCapable:true,gpuAvailable:true,foregroundResidentEnabled:true,
  follow:true,liveWorkday:true,selectedCitizen:3,
  isWorkingAtSite:p=>p.activity==='Harvesting grain',
  isMarketUnloading:p=>Boolean(p.unloading),
  verifiedHouseholdMealEvidence:p=>Boolean(p.meal)};
 vm.createContext(context);
 vm.runInContext(functionOnly,context,{timeout:1000});
 const farmer={name:'real-farmer',job:'farmer',activity:'Harvesting grain',
  x:18,z:1,phase:1,workTimer:1,delivery:null,unloading:false,meal:false};
 const near=new Set([3]);
 assert.equal(context.isObservedWorksiteSkinCandidate(farmer,3,near),true);
 for(const variant of [
  [3,{...farmer,delivery:{id:'real-cargo'}}],
  [3,{...farmer,unloading:true}],
  [3,{...farmer,meal:true}],
  [3,{...farmer,activity:'Traveling to farm'}],
  [2,farmer]
 ])assert.equal(context.isObservedWorksiteSkinCandidate(variant[1],variant[0],near),false);
 context.follow=false;context.liveWorkday=false;
 assert.equal(context.isObservedWorksiteSkinCandidate(farmer,3,near),false);
});
