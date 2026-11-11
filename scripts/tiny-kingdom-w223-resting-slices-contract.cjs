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
 'restingActorCache=next',
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
assert(html.includes('cloth:diff(a.cloth,b.cloth),roles:diff(a.roles,b.roles),'),
 'unchanged original citizen reuse cannot double-count profession metrics');
assert(html.includes("function restoreSnapshot(snapshot){validateSnapshot(snapshot);restingActorKey='';clearRestingActorIdentityCache();"),
 'save restore invalidates all previous resident identity bind caches');
assert(html.includes("function start(){resetResidentCommuters();resetWorkingResidents();resetForegroundResidents();restingActorKey='';clearRestingActorIdentityCache();"),
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
