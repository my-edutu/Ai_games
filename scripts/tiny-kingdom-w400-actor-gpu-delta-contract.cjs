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
 'const DYNAMIC_WORLD_DELTA_MAX_FLOATS=320000;const ACTOR_GPU_RING_SLOTS=3;\n'+
 section('function planResidentVertexUpload(','function getResidentDeltaUploadAudit(')+
 section('function planDynamicWorldDelta(','function getDynamicWorldDeltaAudit(')+
 section('const ACTOR_GPU_SNAPSHOT_MAX_FLOATS=320000;',
  '// W69: one reusable WebGL numeric vertex stream for the entire REAL moving')+
 '\nglobalThis.actors={plan:planDynamicWorldDelta,retain:retainActorGpuSnapshot,'+
 'reset:resetActorGpuSnapshots,snapshots:actorGpuSnapshots,audit:getActorGpuDeltaAudit};',
 scope,{timeout:3000});
const {plan,retain,reset,snapshots,audit}=scope.actors;
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
 'function start(){resetActorGpuSnapshots();',
 'function restoreSnapshot(snapshot){validateSnapshot(snapshot);resetActorGpuSnapshots();',
 'getActorResidencyAudit,getActorGpuDeltaAudit,setActorStreamSplitForTesting,'
])assert(html.includes(phrase),'critical original actor residency: '+phrase);
console.log('W400 real actor GPU source-order, bounded memory, reset and fallback contracts PASS. Physical hardware/visual difference NOT PROVEN.');
