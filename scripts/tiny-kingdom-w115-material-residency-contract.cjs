'use strict';
/* W115: original W113 shader-animated smoke/pennant source IDs are valid,
 * but unrelated fractional/corrupt material IDs must still fail. This test
 * executes the *actual game source functions*, not a hand-copied predicate.
 * Source contract ≠ real WebGL, deterministic long soak or physical FPS. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const material=html.match(/const MATERIAL=Object\.freeze\(\{[^;]+\}\);/);
assert(material,'Actual MATERIAL palette must exist');
const start=html.indexOf('function validMaterialTag(material){');
const end=html.indexOf('function geometryAudit(){',start);
assert(start>=0&&end>start,'Actual resident material/mesh audit functions must exist');
const context={Float32Array};
vm.runInNewContext(material[0]+'\n'+html.slice(start,end)+
 '\nthis.valid=validMaterialTag;this.audit=inspectMeshGeometry;',context,{timeout:3000});
const floats=[0,1,4,7,9,10,13];
const historicShutters=Array.from({length:8},(_,i)=>14+(i+1)/32);
const smoke=Array.from({length:4},(_,i)=>17+(i+.5)/16);
const flags=Array.from({length:4},(_,i)=>18+(i+.5)/16);
for(const tag of [...floats,...historicShutters,...smoke,...flags]){
 const gpuTag=Math.fround(tag);
 assert.equal(context.valid(gpuTag),true,'Expected valid real shader tag '+tag);
 // One valid triangle is 3 vertices x 10 floats, not three triangles.
 const vertices=new Float32Array(30);
 for(let i=0;i<3;i++){
  vertices[i*10+4]=1;
  vertices[i*10+6]=.5;vertices[i*10+7]=.5;vertices[i*10+8]=.5;
  vertices[i*10+9]=gpuTag;
 }
 const check=context.audit(vertices);
 assert.equal(check.aligned,true);
 for(const name of ['invalidComponents','invalidNormals','invalidColors','outOfBounds'])
  assert.equal(check[name],0,tag+' '+name);
}
for(const tag of [-1,13.01,14,14.016,14.28125,14.5,16,17,17.125,
 17.28125,17.5,18,18.125,18.28125,18.5,19,NaN,Infinity]){
 assert.equal(context.valid(tag),false,'Malformed tag should be rejected: '+tag);
}
console.log('W115 PASS: exact-source legacy material, eight shutters, four smoke puffs, four original flags, and strict malformed-tag rejection');
