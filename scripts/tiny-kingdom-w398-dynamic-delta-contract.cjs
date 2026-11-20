'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
for(const tag of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))
 if(tag[1].trim())new vm.Script(tag[1]);
const section=(start,end)=>{
 const a=html.indexOf(start),b=html.indexOf(end,a);
 assert(a>0&&b>a,'missing authentic rendering contract: '+start);
 return html.slice(a,b);
};
const env={Float32Array};
vm.runInNewContext(
 'const CAMERA_DYNAMIC_FLOAT_BUDGET=960000;\n'+
 section('const DYNAMIC_WORLD_DELTA_MAX_FLOATS=','function planDynamicWorldDelta(')+
 section('function planResidentVertexUpload(','function getResidentDeltaUploadAudit(')+
 section('function planDynamicWorldDelta(','function getDynamicWorldDeltaAudit(')+
 '\nglobalThis.plan=planDynamicWorldDelta;',env);
const {plan}=env;
const old=new Float32Array(240000),next=old.slice();
next[201*30]=3;next[6500*30+2]=4; // original geometric triangles, NOT fictional actors
const dirty=plan(old,next,240000);
assert.ok(dirty,'two real local regions should avoid a whole 0.96MB frame');
assert.equal(dirty.ranges.length,2);
const gpu=old.slice();
for(const region of dirty.ranges)
 gpu.set(next.subarray(region.firstFloat,region.lastFloat),region.firstFloat);
assert.deepEqual(Array.from(gpu),Array.from(next),'exact source-order GPU bytes');
assert.equal(plan(old,old,old.length).dirtyFloats,0,'unchanged farm props need no upload');
assert.equal(plan(old,next,230000),null,'new GPU allocation must reject delta');
assert.equal(plan(old,new Float32Array(30),240000),null,'topology changes require full upload');
const allDirty=old.slice();allDirty.fill(1);
assert.equal(plan(old,allDirty,240000),null,'no speculative savings on all-dirty scene');
const aboveCap=new Float32Array(960030);
assert.equal(plan(aboveCap,aboveCap.slice(),aboveCap.length),null,'strict 960k memory ceiling');
const originalDay1=new Float32Array(868410),advanced=originalDay1.slice();
advanced[300*30]=1.3;advanced[26000*30+8]=2.4;
const actualSize=plan(originalDay1,advanced,917504);
assert.ok(actualSize&&actualSize.ranges.length===2,'real 868410-float worker frame stays eligible');
const reconstructed=originalDay1.slice();
for(const r of actualSize.ranges)
 reconstructed.set(advanced.subarray(r.firstFloat,r.lastFloat),r.firstFloat);
assert.deepEqual([...reconstructed.slice(8980,9030)],[...advanced.slice(8980,9030)]);
assert.deepEqual([...reconstructed.slice(779990,780030)],[...advanced.slice(779990,780030)]);
for(const phrase of ['const resized=data.length>dynamicFrameStorage[dynamicFrameActive]',
 'dynamicWorldGpuSnapshots[dynamicFrameActive]=null',
 'current.subarray(region.firstFloat,region.lastFloat)',
 'dynamicWorldGpuSnapshots[dynamicFrameActive]=!swiftGpu',
 'getDynamicGpuRingAudit,getDynamicWorldDeltaAudit']){
 assert.ok(html.includes(phrase),'missing original VBO invalidation or audit: '+phrase);
}
const submit=section('const dynamicTransferStart=performance.now();',
 'dynamicPhaseTimes.gpuUpload=performance.now()-gpuUploadStart;');
assert.ok(submit.includes('!swiftGpu&&!resized&&oldGpu'));
assert.ok(submit.includes('gl.bufferSubData(gl.ARRAY_BUFFER,0,current)'));
assert.ok(html.includes('for(let i=0;i<people.length;i++)'));
console.log('W398 source and pure exact GPU triangle-delta tests PASS; real visual and physical GPU FPS NOT PROVEN');
