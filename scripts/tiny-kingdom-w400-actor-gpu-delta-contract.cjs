'use strict';
// W400 authentic citizen GPU upload safety. Phase 1 rendering only.
// Source tests cannot certify real hardware FPS or commercial visual quality.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
for(const tag of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))
 if(tag[1].trim())new vm.Script(tag[1]);
const section=(start,end)=>{
 const a=html.indexOf(start),b=html.indexOf(end,a);
 assert(a>=0&&b>a,'missing genuine citizen GPU contract: '+start);
 return html.slice(a,b);
};
const scope={Float32Array,gpuAvailable:true,swiftGpu:false,actorStreamSplitEnabled:true};
vm.runInNewContext(
 'const CAMERA_DYNAMIC_FLOAT_BUDGET=960000;const ACTOR_GPU_RING_SLOTS=3;\n'+
 section('const DYNAMIC_WORLD_DELTA_MAX_FLOATS=','function planDynamicWorldDelta(')+
 section('function planResidentVertexUpload(','function getResidentDeltaUploadAudit(')+
 section('function planDynamicWorldDelta(','function getDynamicWorldDeltaAudit(')+
 section('const ACTOR_GPU_SNAPSHOT_MAX_FLOATS=320000;',
  '// W69: one reusable WebGL numeric vertex stream for the entire REAL moving')+
 section('function canRetainIndependentDynamicStreams(','let dynamicVertexScratch=')+
 '\nglobalThis.actors={plan:planDynamicWorldDelta,retain:retainActorGpuSnapshot,'+
 'reset:resetActorGpuSnapshots,snapshots:actorGpuSnapshots,audit:getActorGpuDeltaAudit,split:canRetainIndependentDynamicStreams};',
 scope,{timeout:3000});
const {plan,retain,reset,snapshots,audit,split}=scope.actors;
assert.equal(split(868410,190000),true,'two separately bounded worker and world streams survive old 960k combined cutoff');
assert.equal(split(960000,320000),true,'independent maximum is precisely bounded');
assert.equal(split(960030,1000),false,'world VBO cannot exceed its own cap');
assert.equal(split(900000,320001),false,'citizen VBO cannot exceed its own cap');
assert.equal(split(900000.5,20),false,'invalid sizes must not enter GPU ring');
assert.equal(split(-1,20),false);
assert.equal(split(800000,0),true,'source-only world remains admissible');
scope.actorStreamSplitEnabled=false;
assert.equal(split(868410,190000),false,'no false split residency in fallback mode');
scope.actorStreamSplitEnabled=true;
const original=new Float32Array(240000),changed=original.slice();
changed[300*30]=12;changed[5500*30+1]=7;
const gpu=retain(null,original,null);
assert.notStrictEqual(gpu,original,'slot must not alias changing staging memory');
const delta=plan(gpu,changed,240000);
assert.ok(delta&&delta.ranges.length===2,'two separate actual source ranges');
assert.strictEqual(retain(gpu,changed,delta),gpu,'retention is in-place');
assert.deepEqual([...gpu],[...changed],'GPU snapshot exact source bytes, no dropped actor');
const noChange=plan(gpu,changed,changed.length);
assert.equal(noChange.dirtyFloats,0,'unchanged citizen stream needs no GPU transfer');
const more=changed.slice();more.fill(2);
assert.equal(plan(changed,more,changed.length),null,'all-moving actors full upload');
assert.equal(plan(changed,new Float32Array(30),changed.length),null,'roster change full upload');
assert.equal(plan(changed,changed,100),null,'GPU reallocation full upload');
assert.equal(retain(null,new Float32Array(330000),null),null,'strict memory ceiling');
snapshots[0]=gpu;reset();
assert.equal(snapshots.every(x=>x===null),true,'reset/restore releases all old snapshots');
const observed=audit();
assert.equal(observed.maxRetainedBytes,3840000,'exact three bounded slots');
for(const phrase of [
 'const resized=required>actorFrameStorage[slot]',
 'actorGpuSnapshots[slot]=null; // a GPU reallocation erased the old pose',
 'const priorActor=actorGpuSnapshots[slot]',
 'currentActor.subarray(region.firstFloat,region.lastFloat)',
 'gl.drawArrays(gl.TRIANGLES,0,actorFrameData.length/10)',
 // The actual game now cancels a pending provenance observation before reset.
 // Check a bounded segment of the real start entrypoint, not stale adjacency.
 'function restoreSnapshot(snapshot){validateSnapshot(snapshot);resetActorGpuSnapshots();',
 'getActorResidencyAudit,getActorGpuDeltaAudit,setActorStreamSplitForTesting,'
])assert(html.includes(phrase),'critical original actor residency: '+phrase);
assert.match(html,/function start\(\)\{[\s\S]{0,240}resetActorGpuSnapshots\(\);/,
 'real start still clears original actor GPU snapshots before gameplay resumes');
console.log('W400 real actor GPU source-order, bounded memory, reset and fallback contracts PASS. Physical hardware/visual difference NOT PROVEN.');
