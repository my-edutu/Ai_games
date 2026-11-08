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
for(const original of ['if(!commuterIndices.has(i)&&!workingIndices.has(i))',
 'drawResidentCommuters();','drawWorkingResidentMesh();','drawForegroundResidentMesh();',
 'getSceneTriangleReconciliation','getFrameProfile'])
 assert(html.includes(original),'authentic citizen/geometry audit removed '+original);
console.log('W125 runtime/performance source contract PASS; hardware FPS is NOT asserted');
