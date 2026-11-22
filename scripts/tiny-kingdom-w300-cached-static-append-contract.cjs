'use strict';
// Real source-executed W300 vertex copying test, not a browser FPS claim.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {performance}=require('node:perf_hooks');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const game=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert(game,'real game script missing');
new Function(game);
const start=html.indexOf('let cachedStaticAppendCalls=');
const end=html.indexOf('function restoreCivicStats(',start);
assert(start>0&&end>start,'actual renderer static copy source exists');
const original=html.slice(start,end);
assert(original.includes('function appendCivicCachedVertices('));
assert(original.includes('function copyStaticVertexRange('));
assert(!original.includes('.slice('),'remove costly intermediary JS slices');
assert(!original.includes('data.push('),'remove vararg push for complete scenes');
const impl=new Function('let data=[];\n'+original+
 '\nreturn {set(v){data=v;},get(){return data;},'+
 'append:appendCivicCachedVertices,copy:copyStaticVertexRange,'+
 'audit(){return {cachedStaticAppendCalls,cachedStaticAppendFloats,'+
 'cachedTypedRangeCopies,cachedTypedRangeFloats}}};')();
const same=(a,b)=>{assert.equal(a.length,b.length);
 for(let i=0;i<b.length;i++)assert.equal(a[i],b[i],'vertex '+i)};
const source=Float32Array.from({length:180123},(_,i)=>Math.sin(i*.013)*(i%29));
const prior=[11.3,2.7,3.14159],second=[12.25,-18.5,0,0,1,0,.42,.37,.6,7];
impl.set(prior.slice());impl.append(source);impl.append(second);
impl.append(new Float32Array(0));
const baseline=prior.slice();
for(let i=0;i<source.length;i+=8192)baseline.push(...source.slice(i,i+8192));
baseline.push(...second);
same(impl.get(),baseline);
assert.equal(Object.keys(impl.get()).length,baseline.length,'no array holes');
for(const n of [0,1,17,180098,impl.get().length]){
 same(impl.copy(n),new Float32Array(baseline.slice(n)));
}
for(const n of [-1,impl.get().length+1,.5])assert.throws(()=>impl.copy(n),/start/);
assert.equal(impl.audit().cachedStaticAppendCalls,2);
assert.equal(impl.audit().cachedTypedRangeCopies,5);
const oldCopy=(src)=>{const dest=[2,3];
 for(let i=0;i<src.length;i+=8192)dest.push(...src.slice(i,i+8192));
 return dest;};
const large=Float32Array.from({length:200000},(_,i)=>i/89);
for(let i=0;i<3;i++){oldCopy(large);impl.set([2,3]);impl.append(large);}
let t=performance.now();const originalResult=oldCopy(large),oldMs=performance.now()-t;
impl.set([2,3]);t=performance.now();impl.append(large);
const newMs=performance.now()-t;
same(impl.get(),originalResult);
assert(html.includes('const vertices=copyStaticVertexRange(first);'));
assert.equal(html.split('const vertices=copyStaticVertexRange(first);').length-1,2,
 'actual house and solar shadow both use single typed copy');
console.log('W300 SOURCE PASS: original full game parses, 180123+ copy parity, typed range integrity, unchanged home/solar streams. Warm Node-only 200k float old/new ms:',
 oldMs.toFixed(2),newMs.toFixed(2),'NOT real FPS/quality evidence.');
