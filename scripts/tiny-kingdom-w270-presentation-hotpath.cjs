'use strict';
// W270: source-executed, actual-game presentation cache equivalence contracts.
// Real playable browser footage is captured by the adjoining W125 workflow.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
function extract(begin,end){
 const start=html.indexOf(begin),finish=html.indexOf(end,start);
 assert.ok(start>=0&&finish>start,'missing actual production code '+begin);
 return html.slice(start,finish);
}
// Audit the full playable code, not a copied project fixture.
const script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new Function(script);
const people=Array.from({length:12},(_,i)=>({
 name:'Worker '+i,job:'farmer',activity:i===11?'Resting at home':'Traveling to market',
 x:i,z:10+i,phase:i,workTimer:.2
}));
const events=people.map((p,i)=>({
 id:'earned-'+i,citizen:p.name,job:p.job,time:1,
 delta:{food:i+.25,wood:0,gold:0}
}));
const sourcePeople=JSON.stringify(people),sourceEvents=JSON.stringify(events);
const env=vm.createContext({people,workdayEvents:events,state:{t:2},
 presentationEpoch:0,STREET_CARGO_WINDOW_HOURS:6.5});
vm.runInContext(extract('// W270: original bounded six authentic credited-production witnesses.',
 '// W34 Living Valley:'),env);
const list=vm.runInContext('streetCargoWitnesses()',env);
assert.equal(list.length,6,'only the original first-six genuine producers get cargo');
assert.deepEqual(Array.from(list,w=>w.citizen),people.slice(0,6).map(p=>p.name));
assert.deepEqual(Array.from(list,w=>w.amount),events.slice(0,6).map(e=>e.delta.food));
assert.equal(vm.runInContext('streetCargoWitness(people[9])',env),null,
 'an eighth eligible producer must not invent extra screen cargo');
const initial=vm.runInContext('getStreetCargoProjectionAudit()',env);
for(let i=0;i<people.length*4;i++)
 vm.runInContext('streetCargoWitness(people['+(i%people.length)+'])',env);
const reused=vm.runInContext('getStreetCargoProjectionAudit()',env);
assert.equal(reused.builds,initial.builds,'no duplicate all-people scan per actor');
assert.equal(reused.eventChecks,initial.eventChecks,'no duplicate ledger lookups');
assert.ok(reused.hits>=people.length*4);
env.presentationEpoch++;env.state.t=9;
assert.equal(vm.runInContext('streetCargoWitnesses().length',env),0,
 'cargo presentation must expire at the original authentic event clock');
assert.equal(vm.runInContext('getStreetCargoProjectionAudit().builds',env),2);
assert.equal(JSON.stringify(people),sourcePeople,'projection cannot alter citizens');
assert.equal(JSON.stringify(events),sourceEvents,'projection cannot invent or alter receipts');
const posePeople=[{name:'Real worker',phase:1.2}];let calculationCount=0;
const poseEnv=vm.createContext({people:posePeople,presentationEpoch:1,
 rawOccupationalPerformance:p=>{calculationCount++;return {phase:p.phase,name:p.name};}});
vm.runInContext(extract('const WORK_INTENT_MEMO_MAX=96;',
 '// G125: real citizen joints contact the occupation'),poseEnv);
assert.equal(vm.runInContext('occupationalPerformance(people[0]).phase',poseEnv),1.2);
assert.equal(vm.runInContext('occupationalPerformance(people[0]).phase',poseEnv),1.2);
assert.equal(calculationCount,1,'one real occupational pose for repeated rig consumers');
posePeople[0].phase=3;poseEnv.presentationEpoch++;
assert.equal(vm.runInContext('occupationalPerformance(people[0]).phase',poseEnv),3);
assert.equal(calculationCount,2,'new authoritative tick invalidates worker joints');
const testClone={name:'External clone',phase:4};
poseEnv.testClone=testClone;
vm.runInContext('occupationalPerformance(testClone);occupationalPerformance(testClone)',poseEnv);
assert.equal(calculationCount,4,'unregistered external actor clones are never cached');
const jobs=[{citizen:'Real worker',x:0,z:1},{citizen:'Worker B',x:2,z:1},
 {citizen:'Worker C',x:30,z:30}];let jobScans=0;
const siteEnv=vm.createContext({people:[{name:'Real worker'}],
 selectedCitizen:0,presentationEpoch:1,focusPoint:[0,0],
 getActiveWorksites:()=>{jobScans++;return jobs.slice();}});
vm.runInContext(extract('let realWorksiteViewKey=', '/* W75 same real farm-to-market'),
 siteEnv);
const initialJobs=Array.from(vm.runInContext('visibleActualWorksites()',siteEnv),x=>x.citizen);
assert.deepEqual(initialJobs,['Real worker','Worker B']);
vm.runInContext('visibleActualWorksites()',siteEnv);
assert.equal(jobScans,1,'fixed camera and authority use one real worksite collection');
siteEnv.focusPoint=[30,30];
const nextJobs=Array.from(vm.runInContext('visibleActualWorksites()',siteEnv),x=>x.citizen);
assert.deepEqual(nextJobs,['Worker C','Real worker'],
 'moving the actual camera changes the visible and followed original workers');
assert.equal(jobScans,2);
siteEnv.presentationEpoch++;
vm.runInContext('visibleActualWorksites()',siteEnv);
assert.equal(jobScans,3,'real fixed-step advance must re-evaluate worksite membership');
assert.equal(vm.runInContext('getRealWorksiteFrameAudit().maxVisible',siteEnv),8);
assert.ok(html.includes('if(!cargo)return;'));
assert.ok(html.includes('function renderMarketReceiptInventory()'));
assert.ok(html.includes('function villager(p)'));
console.log('W270 PASS: genuine six-worker credited cargo, camera job selection, live 13-joint work intent, unchanged source authority');
