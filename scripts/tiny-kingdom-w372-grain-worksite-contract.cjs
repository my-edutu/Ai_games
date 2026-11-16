#!/usr/bin/env node
'use strict';
// W372 original-field re-sculpt: read and execute the REAL production crop,
// not screenshot fakes. No claim of visual milestone or hardware performance.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=html.indexOf('function farmEarthWearTone(');
const end=html.indexOf('function ripeningField(',start);
assert(start>0&&end>start,'W372 original field geom and wear should exist');
const source=html.slice(start,end);
assert.match(source,/function rootedLanceolateGrainBlade\(/);
assert.match(source,/function farmEarthWearTone\(/);
assert.doesNotMatch(source,/Math\.random\(|people\.push\(|city\.push\(|state\.food\s*[+\-=]/);
const allScripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
new vm.Script(allScripts.find(x=>x[1].includes('function farmStalk('))[1]);
const ctx={Math,Number,Array,Error,data:[],farmScene:{rows:0,seedHeads:0,stalks:0,stalkTriangles:0},
 MATERIAL:{ROAD:3,FOLIAGE:4},materialScope:(_,fn)=>fn(),
 terrain:(x,z)=>.11*Math.sin(x*.1+z*.3),
 biomeHash:i=>{const n=Math.sin(i*12.9898+78.233)*43758.5453;return n-Math.floor(n)},
 rgb:n=>[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255],
 triangles:[],colors:[]};
ctx.tri=(a,b,c,col)=>{for(const v of [a,b,c]){assert(v.every(Number.isFinite));ctx.data.push(...v,0,1,0,...(col||[.4,.4,.4]),0);}ctx.triangles.push([a,b,c]);ctx.colors.push(JSON.stringify(col))};
ctx.quad=(a,b,c,d,col)=>{ctx.tri(a,b,c,col);ctx.tri(a,c,d,col)};
vm.createContext(ctx);vm.runInContext(source+ '\nthis.testSoil=farmSoil;this.testStem=farmStalk;this.testHead=authenticGrainHeadProfile;',ctx);
for(const season of [0,1,2,3])for(const compact of [false,true]){
 ctx.data=[];ctx.triangles=[];ctx.colors=[];ctx.farmScene={rows:0,seedHeads:0,stalks:0,stalkTriangles:0};
 ctx.testStem(19,.3,101,season,compact);
 const expected=season===3?4:compact?12:20;
 assert.equal(ctx.triangles.length,expected,'4/12/20 original physical crop triangle budget');
 assert.equal(ctx.farmScene.stalks,1);
 assert.equal(ctx.farmScene.seedHeads,season===3?0:1);
 assert.equal(ctx.farmScene.stalkTriangles,expected);
 const vertices=JSON.stringify(ctx.data);
 ctx.data=[];ctx.triangles=[];ctx.colors=[];
 ctx.testStem(19,.3,101,season,compact);
 assert.equal(JSON.stringify(ctx.data),vertices,'seeded repeat geometry deterministic');
 const p=ctx.testHead(19,.3,101,season);
 assert.equal(p.authorityModified,false);
 assert.deepEqual(Array.from(p.rootedAt),[19,.3]);
}
ctx.data=[];ctx.triangles=[];ctx.colors=[];
ctx.testSoil(16.45,24.65,0,.31,2);
const sections=Math.ceil((24.65-16.45)/.70);
assert.equal(ctx.triangles.length,sections*6+Math.ceil(sections/3)*2);
assert.equal(ctx.farmScene.rows,1);
assert(new Set(ctx.colors).size>sections,'weathered earth must break continuous material bands');
const vertices=JSON.stringify(ctx.data);
ctx.data=[];ctx.triangles=[];ctx.colors=[];
ctx.testSoil(16.45,24.65,0,.31,2);
assert.equal(JSON.stringify(ctx.data),vertices);
assert(html.includes('Math.max(0,160000-nonFieldTriangles)'),
 'original real-view triangle budget must remain attached');
console.log('W372 grounded crop + weathered earth production geometry PASS; real gameplay A/B and native GPU still NOT PROVEN.');
