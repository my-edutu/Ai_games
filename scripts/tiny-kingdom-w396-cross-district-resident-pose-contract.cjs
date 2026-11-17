'use strict';
// W343: rendering-spine regression for an authentic worker followed across
// farm, roadside, market and occupied-home cameras. No staged humans or props.
const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=html.indexOf('function retainForegroundPoseWindow(');
const stop=html.indexOf('function prepareForegroundResidents(',start);
assert(start>=0&&stop>start,'W343 requires bounded cross-view original-pose residency');
const src=html.slice(start,stop);
const retain=new Function('FOREGROUND_RESIDENT_MAX','FOREGROUND_RESIDENT_FLOAT_BUDGET',
 src+';return retainForegroundPoseWindow;')(8,760000);
const source=html.slice(stop,html.indexOf('function drawForegroundResidentMesh(',stop));
assert(source.includes('foregroundResidentCache=retainForegroundPoseWindow(foregroundResidentCache,selected)'),
 'visible originals must keep a bounded warm-pose window across camera changes');
assert(!/if\(!gpuAvailable\|\|!rows.length\)\{\s*foregroundResidentCache.clear\(\)/.test(source),
 'camera with no eligible citizens must not discard intact, authoritative pose geometry');
const actor=(id,floats=30000)=>({mesh:new Float32Array(floats),key:'real:'+id,revision:id});
const original=Array.from({length:8},(_,i)=>({i,entry:actor(i)}));
let cache=retain(new Map(),original);
assert.equal(cache.size,8);
const prior=cache.get(3);
cache=retain(cache,[]);
assert.strictEqual(cache.get(3),prior,'overview -> market gap retains original villager geometry');
cache=retain(cache,[{i:8,entry:actor(8)},{i:9,entry:actor(9)}]);
assert.deepEqual([...cache.keys()],[2,3,4,5,6,7,8,9],
 'genuine new workers evict oldest, not current original camera actors');
cache=retain(cache,[{i:3,entry:prior}]);
assert.strictEqual(cache.get(3),prior,'returning to the same genuine actor reuses full original mesh');
assert.equal([...cache.keys()].at(-1),3,'reentered actor becomes most recent');
const oversized=retain(new Map(),[0,1,2,3].map(i=>({i,entry:actor(i,90000)})),8,200000);
assert.deepEqual([...oversized.keys()],[2,3],
 'warm pose cache must enforce an explicit float byte budget independent of count');
assert.equal(retain(cache,[],0).size,0,'disable policy must release dormant originals');
assert(html.includes('if(!foregroundIndices.has(i))villager(people[i]);'),
 'every nonadmitted authentic villager retains live CPU rendering');
console.log('W343 PASS: original full-body pose LRU survives workday camera changes, bounded floats, no missing fallback actor; running FPS NOT PROVEN');

 
// W396: reuse the SAME original warm mesh policy across all original jobs.
const section=(start,end)=>{
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'Missing playable actor residency source: '+start);
 return html.slice(a,b);
};
for(const [label,method,end,cache,limit,budget] of [
 ['resting','prepareRestingActorMesh','drawRestingActorMesh','restingActorCache','RESTING_ACTOR_MAX','RESTING_ACTOR_FLOAT_BUDGET'],
 ['commuter','prepareResidentCommuters','drawResidentCommuters','commuterResidentCache','COMMUTER_RESIDENT_MAX','COMMUTER_RESIDENT_FLOAT_BUDGET'],
 ['worker','prepareWorkingResidents','drawWorkingResidentMesh','workingResidentCache','WORKING_RESIDENT_MAX','WORKING_RESIDENT_FLOAT_BUDGET']
]){
 const src=section('function '+method+'(', 'function '+end+'(');
 const normalize=src.replace(/\s+/g,' ');
 assert(normalize.includes(cache+'=retainForegroundPoseWindow('+cache+',selected, '+limit+','+budget+')'),
  label+' must bound genuine original actor pose bytes through camera district return');
  // The real renderer uses braces for worker/commuter fallbacks; previously
 // this assertion required the obsolete one-line form and failed green code.
 const gpuUnsupported=new RegExp('if\\s*\\(\\s*!gpuAvailable\\s*\\)\\s*\\{[\\s\\S]{0,160}?'+cache+'\\.clear\\(\\)');
 assert(gpuUnsupported.test(src),
  label+' must release stale GPU pose geometry on renderer-mode fallback');
 assert(!src.includes('if(!gpuAvailable||!rows.length){\n  '+cache+'.clear()'),
  label+' must not delete exact genuine pose when no camera actor is admitted');
}
assert(html.includes('if(!restingIndices.has(i)&&!commuterIndices.has(i)&&!workingIndices.has(i))compactVillager(people[i]);'),
 'no authentic villager may be hidden by resident budget decisions');
// Assert each entry point independently. They now clear the shared GPU-sector
// ring before the per-profession caches; relying on identical first-call text
// would incorrectly reject this safer, explicit reset order.
const gameStart=html.slice(html.indexOf('function start(){'));
const gameRestore=html.slice(html.indexOf('function restoreSnapshot(snapshot){'));
for(const [label,body] of [['new game',gameStart],['save restore',gameRestore]]){
 assert(/resetResidentCommuters\(\);resetWorkingResidents\(\);resetForegroundResidents\(\);/.test(body.slice(0,700)),
  label+' must clear every old citizen GPU pose before reusing identities');
 assert(body.slice(0,700).includes('resetActorGpuSnapshots();'),
  label+' must invalidate cross-sector alternate GPU buffers');
 assert(body.slice(0,700).includes('clearRestingActorIdentityCache();'),
  label+' must clear original dormant resting citizen identity cache');
}
console.log('W396 PASS: real camera district returns reuse bounded resting / moving / working pose geometry and retain true live/fallback actors; hardware FPS NOT PROVEN');
