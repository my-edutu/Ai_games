'use strict';
// Phase-1 original settlement + live workers: test exact production staging,
// never call this a gameplay, GPU or independent visual-quality acceptance.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
const startMarker='// W543 PHASE-1 ORIGINAL SOFTWARE WORLD STREAM';
const endMarker='// END W543 ORIGINAL SOFTWARE WORLD STREAM';
const start=html.indexOf(startMarker),end=html.indexOf(endMarker,start);
function load(source){
 assert.ok(start>=0&&end>start,'RED: no retained source-plus-motion staging in the playable game');
 const real=html.slice(start,end);
 return new Function('source',
  'let scenicMeshCache=source;'+real+
  ';return {acquireSoftwareWorldStream,stageSoftwareWorldStream,'+
  'audit:getSoftwareWorldStagingAudit,setSource:s=>{scenicMeshCache=s}};')(source);
}
test('real software stream retains original static prefix but refreshes genuine motion',()=>{
 const staticSource=Array.from({length:180},(_,i)=>Math.sin(i)*.5);
 const w=load(staticSource);
 const first=w.acquireSoftwareWorldStream();
 assert.deepEqual(first,staticSource);
 first.push(11,12,13);
 const a=w.stageSoftwareWorldStream(first);
 assert.deepEqual([...a],[...staticSource,11,12,13].map(Math.fround));
 const later=w.acquireSoftwareWorldStream();
 assert.equal(later,first,'no new whole-city JavaScript allocation on a warm frame');
 assert.equal(later.length,staticSource.length);
 later.push(21,22,23);
 const b=w.stageSoftwareWorldStream(later);
 assert.deepEqual([...b],[...staticSource,21,22,23].map(Math.fround));
 assert.deepEqual(staticSource,Array.from({length:180},(_,i)=>Math.sin(i)*.5),
  'authoritative/source scene never mutated');
 assert.ok(w.audit().warmFrames>=1);
 assert.ok(w.audit().staticPrefixCopies<=1);
 assert.ok(w.audit().changedAuthority===false);
});
test('real scene revision, growth and smaller save restore never reuse stale geometry',()=>{
 const source=[1,2,3,4,5,6],w=load(source);
 let frame=w.acquireSoftwareWorldStream();frame.push(7,8);
 w.stageSoftwareWorldStream(frame);
 const revision=Array.from({length:260},(_,i)=>i*.07);
 w.setSource(revision);
 frame=w.acquireSoftwareWorldStream();
 frame.push(-15,-17,-19);
 assert.deepEqual([...w.stageSoftwareWorldStream(frame)],
  [...revision,-15,-17,-19].map(Math.fround));
 w.setSource([31,32,33]);
 frame=w.acquireSoftwareWorldStream();frame.push(99);
 assert.deepEqual([...w.stageSoftwareWorldStream(frame)],[31,32,33,99]);
 const a=w.audit();
 assert.equal(a.staticPrefixCopies,3);
 assert.ok(a.capacityFloats>=263);
 assert.ok(a.capacityFloats<263+65536,'bounded retained high-water staging');
 assert.equal(a.fullSceneRevisions,3);
});
test('original camera/source path uses the retained renderer, no hidden work',()=>{
 assert.match(html,/data=gpuAvailable\?acquireDynamicVertexStream\(\):acquireSoftwareWorldStream\(\)/);
 assert.match(html,/stageSoftwareWorldStream\(data\)/);
 assert.match(html,/softwareWorldStaging:getSoftwareWorldStagingAudit\(\)/);
 assert.ok(html.includes('staticClip.limit/30'));
 assert.ok(html.includes('rasterRange(staticCount,count)'));
});
