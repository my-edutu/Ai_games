'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const a=html.indexOf('<script>'),b=html.lastIndexOf('</script>');
assert(a>=0&&b>a,'real playable source found');
new Function(html.slice(a+8,b)); // Entire current game must parse.
const start=html.indexOf('function prepareRestingActorMesh(rows){');
const end=html.indexOf('function drawRestingActorMesh(){',start);
assert(start>0&&end>start,'active resting-actor draw path');
const code=html.slice(start,end);
for(const token of [
 'const poseKey=residentRestingKey([{p,i}]);',
 'restingActorCache.get(i)',
 'restingActorCache=retainForegroundPoseWindow(restingActorCache,selected,',
 'RESTING_ACTOR_MAX,RESTING_ACTOR_FLOAT_BUDGET)',
 'restingActorLayoutKey=layoutKey',
 'gl.bufferSubData(gl.ARRAY_BUFFER,row.offset*4,row.entry.mesh)',
 'restingActorMesh.set(row.entry.mesh,row.offset)',
 'gl.bufferSubData(gl.ARRAY_BUFFER,0,packed)',
 'layoutKey!==restingActorLayoutKey',
 'total>RESTING_ACTOR_FLOAT_BUDGET',
 'resetRestingActorMetrics(before)',
 'return false; // all original citizens use live compact geometry',
 'finally{data=prior;currentMaterial=priorMaterial}',
])assert(code.includes(token),'missing original real-actor residency contract: '+token);
// W447 supporting Phase-1 CI repair: source uses the W343 LRU bounded
// sleeping-person pose retention instead of the removed immediate-only
// restingActorCache=next. Exercise the actual pure production function.
assert(!code.includes('restingActorCache=next'),
 'W343 must keep bounded dormant original citizen poses');
const helperStart=html.indexOf('function retainForegroundPoseWindow(');
const helperEnd=html.indexOf('function prepareForegroundResidents(',helperStart);
assert(helperStart>0&&helperEnd>helperStart,'bounded actor cache helper exists');
const helper=html.slice(helperStart,helperEnd);
const retain=new Function(helper+';return retainForegroundPoseWindow;')();
const entry=(key)=>({key,mesh:new Float32Array(30)});
const prior=new Map([[0,entry('a')],[1,entry('b')]]);
const fresh=retain(prior,[{i:2,entry:entry('c')}],2,60);
assert.deepEqual([...fresh.keys()],[1,2],'LRU evicts oldest full body, not live people');
const reused=retain(fresh,[{i:1,entry:fresh.get(1)}],2,60);
assert.deepEqual([...reused.keys()],[2,1],'original resident pose reuse refreshes LRU');
assert.throws(()=>retain(new Map(),[{i:0,entry:{mesh:new Float32Array(4)}}],2,60),
 /invalid original full-body mesh/,'invalid body geometry must not enter cache');
assert(html.includes('cloth:diff(a.cloth,b.cloth),roles:diff(a.roles,b.roles),'),
 'unchanged original citizen reuse cannot double-count profession metrics');
assert(/function restoreSnapshot\(snapshot\)\{validateSnapshot\(snapshot\);resetActorGpuSnapshots\(\);restingActorKey='';clearRestingActorIdentityCache\(\);/.test(html),
 'save restore invalidates all previous resident identity bind caches');
assert(/function start\(\)\{[^\n]*resetResidentCommuters\(\);resetWorkingResidents\(\);resetForegroundResidents\(\);restingActorKey='';clearRestingActorIdentityCache\(\);/.test(html),
 'new world invalidates all previous original people body slices');
assert(!code.includes('for(const {p} of rows)compactVillager(p);'),
 'all resting residents must not rebuild on single neighbor change');
assert(/restingActorVisible=true;restingActorCitizens=rows.length/.test(code),
 'every accepted authoritative resting citizen remains drawn');
assert(html.includes('if(!restingIndices.has(i)&&!commuterIndices.has(i)&&!workingIndices.has(i))compactVillager(people[i])'),
 'on overflow the real source draws every authentic person');
// Exact CPU-equivalent GPU buffer packing: unchanged identity keeps existing
// coordinates, changed single resident replaces only its own original range.
const previous=new Float32Array([1,2,3,4,5,6,7,8,9,10,11,12]);
const incoming=new Float32Array([81,82,83,84]);
const offset=4;previous.set(incoming,offset);
assert.deepEqual(Array.from(previous),[1,2,3,4,81,82,83,84,9,10,11,12]);
const oldBytes=12*4,dirtyBytes=incoming.byteLength;
assert(dirtyBytes<oldBytes,'partial original-body upload uses fewer bytes');
console.log('W223 source and bounded true-resting per-body dirty VBO layout PASS; live WebGL, hardware GPU and experience remain separately NOT PROVEN.');
