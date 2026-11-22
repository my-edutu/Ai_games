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
