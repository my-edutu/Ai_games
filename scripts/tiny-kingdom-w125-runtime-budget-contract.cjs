'use strict';
// W125: truthful fixed-step debt, bounded GPU uploads and retained authentic
// facial topology. Source contracts complement (never replace) real WebGL CI.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=html.indexOf('<script>'),end=html.lastIndexOf('</script>');
assert(start>=0&&end>start,'real playable game is available');
new Function(html.slice(start+8,end));
function named(name){
 const at=html.indexOf('function '+name+'(');
 assert(at>=0,'missing function '+name);
 const open=html.indexOf('{',at);
 let depth=0,pos=open;
 do {if(html[pos]==='{')depth++;else if(html[pos]==='}')depth--;pos++}
 while(depth&&pos<html.length);
 assert.equal(depth,0,'complete function '+name);
 return html.slice(at,pos);
}
assert(!html.includes('if(ticks>=64)accumulator=0'),
 'fixed-step time debt may not be silently discarded at 16x speed');
const drain=vm.runInNewContext(named('drainRenderTickBacklog')+
 ';drainRenderTickBacklog',{FIXED_STEP:1/30});
let authenticTicks=0;
const one=drain(100.4/30,()=>{authenticTicks++},64);
assert.equal(one.executed,64,'bounded per-frame work must stay at 64');
assert.equal(one.pendingTicks,36,'remaining real ticks must survive this frame');
const two=drain(one.remaining,()=>{authenticTicks++},64);
assert.equal(two.executed,36,'deferred ticks must execute in-order next frame');
assert.equal(two.pendingTicks,0);
assert.equal(authenticTicks,100,'no authoritative tick fabricated or skipped');
assert(Math.abs(two.remaining-.4/30)<1e-9);
assert.throws(()=>drain(Infinity,()=>{},64),/debt/i);
assert.throws(()=>drain(1,()=>{},0),/budget/i);
const commuter=named('prepareResidentCommuters');
for(const marker of ['row.fresh','commuterResidentLayoutKey',
 'commuterResidentPartialUploads++','commuterResidentFullUploads++',
 'gl.bufferSubData(gl.ARRAY_BUFFER,row.offset*40,row.entry.mesh)',
 'commuterResidentMesh.set(row.entry.mesh,row.offset*10)',
 'if(!row.fresh)continue','resetRestingActorMetrics(beforeAll)',
 'commuterResidentFallbacks++'])
 assert(commuter.includes(marker),'no safe commuter dirty upload: '+marker);
const face=named('sculptedFace'),field=named('faceNormalField');
for(const marker of ['faceVertexRows','faceVertexRows[j][i]','faceVertexRows[j][(i+1)%n]',
 'faceNormalField(profile)'])
 assert(face.includes(marker),'face must reuse original accurate ring vertices: '+marker);
for(const marker of ['faceNormalCache','FACE_NORMAL_CACHE_MAX'])
 assert(field.includes(marker),'face normals must be bounded by actual identity profile');
assert(html.includes('getFaceTopologyCacheAudit'),'normal cache is not observable');
assert(html.includes('getSimulationTickDebtAudit'),'real sim backlog is not observable');
for(const original of ['!commuterIndices.has(i)&&!workingIndices.has(i)',
 'drawResidentCommuters();','drawWorkingResidentMesh();','drawForegroundResidentMesh();',
 'getSceneTriangleReconciliation','getFrameProfile'])
 assert(html.includes(original),'authentic citizen/geometry audit removed '+original);

// Execute the actual authoritative commuter VBO packer against an instrumented
// GL facade: a single changed citizen may NOT upload its neighbours again.
const writes=[],allocations=[];
const gl={ARRAY_BUFFER:34962,DYNAMIC_DRAW:35048,
 createBuffer:()=>({id:1}),bufferData:(_,bytes)=>allocations.push(bytes),
 bufferSubData:(_,offset,bytes)=>writes.push({offset,bytes:bytes.byteLength})};
const state={
 gpuAvailable:true,COMMUTER_RESIDENT_MAX:32,COMMUTER_RESIDENT_FLOAT_BUDGET:900000,
 commuterResidentCache:new Map(),commuterResidentVisible:[],commuterResidentBuffer:null,
 commuterResidentCapacity:0,commuterResidentMesh:new Float32Array(0),
 commuterResidentKey:'',commuterResidentLayoutKey:'',
 commuterResidentBuilds:0,commuterResidentReuses:0,commuterResidentUploads:0,
 commuterResidentFullUploads:0,commuterResidentPartialUploads:0,
 commuterResidentUploadBytes:0,commuterResidentRebuilds:0,commuterResidentFallbacks:0,
 data:[],gl,terrain:()=>0,bindGeometry:()=>{},
 realCommuterFacing:()=>0,
 commuterPoseStale:(entry,p)=>!entry||entry.phase!==p.phase,
 compactVillager:p=>{state.data.push(...new Array(p.floats).fill(p.phase))},
 restingActorCounters:()=>({roles:{}}),
 restingActorDifference:()=>({roles:{}}),
 applyRestingActorMetrics:()=>{},resetRestingActorMetrics:()=>{}
};
const batchUploads=vm.runInNewContext(named('shouldCoalesceResidentGpuUploads')+
 ';shouldCoalesceResidentGpuUploads');
assert.equal(batchUploads(600,1,500),false,
 'one genuine pose must never trigger unrelated uploads');
assert.equal(batchUploads(600,3,400),true,
 'three dense dirty actors should combine into one driver submission');
assert.equal(batchUploads(6000,7,210),true,
 'many small disjoint edits should not flood GPU driver calls');
assert.equal(batchUploads(600,2,600),false,
 'tiny authentic worker groups may use two exact dirty writes');
state.shouldCoalesceResidentGpuUploads=batchUploads;
for(const name of ['prepareWorkingResidents','prepareForegroundResidents'])
 assert(named(name).includes('shouldCoalesceResidentGpuUploads('),
  name+' must share driver-bounded dense original poses');
const prepare=vm.runInNewContext(named('prepareResidentCommuters')+
 ';prepareResidentCommuters',state);
const a={name:'Real A',job:'farmer',activity:'Traveling to work',
 phase:1,x:0,z:0,energy:80,hunger:5,floats:30};
const b={...a,name:'Real B',x:3};
assert.equal(prepare([{p:a,i:0},{p:b,i:1}]),true);
assert.deepEqual(writes,[{offset:0,bytes:240}]);
assert.equal(state.commuterResidentFullUploads,1);
assert.equal(prepare([{p:a,i:0},{p:b,i:1}]),true);
assert.equal(writes.length,1,'unchanged true citizen poses are never reuploaded');
a.phase=2;
assert.equal(prepare([{p:a,i:0},{p:b,i:1}]),true);
assert.deepEqual(writes[1],{offset:0,bytes:120},
 'only first changed commuter pose uploads');
assert.equal(state.commuterResidentPartialUploads,1);
b.phase=2;
assert.equal(prepare([{p:a,i:0},{p:b,i:1}]),true);
assert.deepEqual(writes[2],{offset:120,bytes:120},
 'only second changed commuter pose uploads');
assert.equal(state.commuterResidentPartialUploads,2);
assert.equal(state.commuterResidentUploadBytes,480);
assert.equal(prepare([{p:b,i:1}]),true);
assert.deepEqual(writes[3],{offset:0,bytes:120},
 'a real membership change repacks the compact grouped VBO');
assert.equal(state.commuterResidentFullUploads,2);
assert(allocations.length===1&&allocations[0]===65536*4,
 'the resident VBO retains one bounded capacity allocation');
const dense=Array.from({length:8},(_,i)=>({...a,name:'Real '+i,x:i+1,phase:3}));
assert.equal(prepare(dense.map((p,i)=>({p,i}))),true);
assert.equal(writes.at(-1).bytes,960,'true population membership repacks safely');
const beforeDense=writes.length;
for(const p of dense)p.phase=4;
assert.equal(prepare(dense.map((p,i)=>({p,i}))),true);
assert.equal(writes.length,beforeDense+1,
 'eight genuine refreshed poses use ONE complete GPU upload');
assert.equal(writes.at(-1).bytes,960,
 'dense coalescing preserves all original 8 citizens and mesh bytes');
assert.equal(state.commuterResidentFullUploads,4);
assert.equal(state.commuterResidentPartialUploads,2);
assert.equal(state.commuterResidentCache.size,8);
// The face cache must be keyed by genuine profile geometry, not mutable
// character indexes or changing animation time.
const faceCacheSrc=html.slice(html.indexOf('const FACE_NORMAL_CACHE_MAX='),
 html.indexOf('// G148: facial acting'));
const normals=vm.runInNewContext(faceCacheSrc+
 ';({faceNormalField,getFaceTopologyCacheAudit})');
const faceProfile={segments:12,rings:[
 {y:1.1,rx:.1,rz:.09,z:0},{y:1.4,rx:.16,rz:.17,z:.01},
 {y:1.7,rx:.12,rz:.12,z:-.01}]};
const n1=normals.faceNormalField(faceProfile);
const n2=normals.faceNormalField(faceProfile);
assert.strictEqual(n1,n2,'unchanged true original morphology reuses normals');
faceProfile.rings[1].rx+=.01;
const n3=normals.faceNormalField(faceProfile);
assert.notStrictEqual(n3,n2,'mutated morphology invalidates normals');
for(let i=0;i<30;i++){
 faceProfile.rings[1].rx=.10+i*.001;
 normals.faceNormalField(faceProfile);
}
const audit=normals.getFaceTopologyCacheAudit();
assert(audit.entries<=24&&audit.maxEntries===24&&audit.hits>=1);

console.log('W125 runtime/performance source contract PASS; hardware FPS is NOT asserted');
