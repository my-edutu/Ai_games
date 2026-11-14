'use strict';
// W118 source-level safety floor; actual WebGL and physical FPS remain unmeasured.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const open=html.indexOf('<script>'),close=html.lastIndexOf('</script>');
assert(open>=0&&close>open,'playable inline game script exists');
new Function(html.slice(open+8,close));
function extract(begin,end){
 const start=html.indexOf(begin),stop=html.indexOf(end,start);
 assert(start>=0&&stop>start,'real source function exists: '+begin);
 return html.slice(start,stop);
}
const candidateSource=extract('function isResidentRestingCandidate(', 'function residentRestingKey(');
const keySource=extract('function residentRestingKey(', 'function restingActorCounters(');
const make=(enabled=true)=>new Function('gpuAvailable','isWorkingAtSite',
 'isMarketUnloading',candidateSource+'; return isResidentRestingCandidate;')(
 enabled,p=>Boolean(p.realWork),p=>Boolean(p.unloading));
const state={t:23.2};
const signature=new Function('state',keySource+'; return residentRestingKey;')(state);
const p={name:'Real villager',job:'farmer',activity:'Resting at home',
 x:4,z:7,target:[4,7],path:[],energy:73,hunger:30,delivery:null};
const far=new Set(),near=new Set([3]),ok=make();
assert(ok(p,3,far),'stationary original compact resting citizen eligible');
assert(!ok(p,3,near),'on-screen full-detail citizen remains live');
assert(!make(false)(p,3,far),'Canvas2D original actor path remains live');
for(const change of [
 {activity:'Harvesting fields'},{activity:'Traveling to the market'},
 {delivery:{id:'genuine-uncredited-consignment'}},{realWork:true},
 {unloading:true},{x:7},{path:[[4,8]]},
 {target:[4,9]},{path:undefined}
])assert(!ok({...p,...change},3,far),
 'actual moving/working/delivering actor must stay live: '+JSON.stringify(change));
const key=signature([{p,i:3}]);
assert.equal(key,signature([{p,i:3}]));
assert.notEqual(key,signature([{p:{...p,x:4.1},i:3}]),
 'real position change invalidates retained actor mesh');
assert.notEqual(key,signature([{p:{...p,job:'builder'},i:3}]),
 'real profession invalidates retained mesh');
assert.notEqual(key,signature([{p,i:4}]),
 'real population/LOD identity invalidates retained mesh');
state.t=23.7;assert.notEqual(key,signature([{p,i:3}]),
 'original clock refreshes resting mesh at bounded interval');
for(const required of [
 'const commuterReady=prepareResidentCommuters(commuterRows);',
 'if(!restingIndices.has(i)&&!commuterIndices.has(i)&&!workingIndices.has(i))compactVillager(people[i])',
 "function restoreSnapshot(snapshot){validateSnapshot(snapshot);restingActorKey='';",
 'drawRestingActorMesh();',
 'const residents=inspectMeshGeometry(restingActorMesh);',
 '(restingActorVisible?restingActorMesh.length:0)',
 'if(!restingIndices.has(i)&&!commuterIndices.has(i)&&!workingIndices.has(i))compactVillager(people[i])',
 'const commuterIndices=commuterReady?',
 'restingActorOverflowFallbacks++',
 'getRestingActorResidencyAudit,'
])assert(html.includes(required),'original render/integrity path: '+required);
console.log('W118 source contract: resting guard, invalidation, V8 game syntax and real render accounting PASS. Hardware GPU and live film NOT MEASURED.');
