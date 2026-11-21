'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=html.indexOf('function sameOriginalSoftwareWorldBits(');
assert(start>=0,'RED: original software VBO previously fully uploaded each changed tick');
let at=html.indexOf('{',start),depth=0,end=-1;
for(let i=at;i<html.length;i++){if(html[i]==='{')depth++;else if(html[i]==='}'&&--depth===0){end=i;break;}}
assert(end>start);
const same=new Function('const SOFTWARE_SPLIT_WORLD_SNAPSHOT_MAX_FLOATS=65536;\n'+html.slice(start,end+1)+'\nreturn sameOriginalSoftwareWorldBits;')();
const a=new Float32Array(30),b=a.slice();
assert.equal(same(a,b),true);
b[5]=12.5;assert.equal(same(a,b),false,'real props changed, upload');
b[5]=0;assert.equal(same(a,b),true);
b[1]=-0;assert.equal(same(a,b),false,'-0 differs from +0 as vertex bits');
const wa=new Uint32Array(a.buffer),wb=new Uint32Array(b.buffer);
wa[1]=0x7fc00001;wb[1]=0x7fc00002;assert.equal(same(a,b),false,'NaN payloads not equal');
assert.equal(same(a,a),false,'mutable CPU staging may never become its own snapshot');
assert.equal(same(a,new Float32Array(60)),false);
assert.equal(same(a,new Float32Array(0)),false);
assert.equal(same(new Float32Array(65550),new Float32Array(65550)),false,'capacity bound');
const last=new Float32Array(65520);assert.equal(same(last,last.slice()),true);
assert.match(html,/if\(softwareUnchanged\)\{\s*softwareSplitWorldUnchanged\+\+;/);
assert.match(html,/softwareSplitWorldUploadBytesAvoided\+=current\.byteLength/);
assert.match(html,/softwareTrack\?\(softwareUnchanged\?oldGpu:/);
assert.match(html,/dynamicWorldGpuSnapshots\[0\]=null;/);
new vm.Script([...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
 .find(x=>x[1].includes('function render(now)'))[1]);
console.log('W506 exact-bit original split-world VBO retention and bounded fallback PASS');
