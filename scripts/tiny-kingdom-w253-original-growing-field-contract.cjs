#!/usr/bin/env node
'use strict';
// Phase 1 W253: real existing fields, source-executed adult-scale grain,
// camera-cost-bounded triangles and persistent original-atlas soil.
// Behavioral and authority audits are distinct from running-game art acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const begin=html.indexOf('function authenticGrainHeadProfile(');
const end=html.indexOf('function ripeningField(',begin);
assert(begin>0&&end>begin,'Original W253 bent-grain presentation missing');
const fieldStart=html.indexOf('function paintOriginalFarmFieldGround(');
const fieldEnd=html.indexOf('function farmSoil(',fieldStart);
assert(fieldStart>0&&fieldEnd>fieldStart,'Permanent authentic field ground atlas missing');
const made=[],flat=[],ctx={
 Math,Number,Error,Array,data:[],terrain:(x,z)=>.1*Math.sin(x*.1+z*.4),
 biomeHash:i=>{const t=Math.sin(i*12.9898+78.233)*43758.5453;return t-Math.floor(t)},
 rgb:v=>v, farmScene:{seedHeads:0,stalks:0,stalkTriangles:0},
 tri:(a,b,c)=>{for(const v of [a,b,c]){assert(v.every(Number.isFinite));flat.push(...v)};made.push(1);ctx.data.length+=30},
 quad:(a,b,c,d)=>{ctx.tri(a,b,c);ctx.tri(a,c,d)},
 FARMSTEAD:{fields:[[16.45,24.65,-1.62,3.64,12,17],[26,32,-1.38,3.78,10,13]]}
};
vm.createContext(ctx);vm.runInContext(html.slice(begin,end)+
 '\nthis.grain=authenticGrainHeadProfile;this.plant=farmStalk;',ctx);
vm.runInContext(html.slice(fieldStart,fieldEnd)+
 '\nthis.paintFarm=paintOriginalFarmFieldGround;',ctx);
const plot=ctx.FARMSTEAD.fields;
const soil={fills:0,strokes:0,gradient:0};
const canvas={save(){},restore(){},fillRect(x,y,w,h){assert([x,y,w,h].every(Number.isFinite));soil.fills++},
 createLinearGradient(){soil.gradient++;return {addColorStop(){}}},
 beginPath(){},moveTo(x,y){assert([x,y].every(Number.isFinite))},
 lineTo(x,y){assert([x,y].every(Number.isFinite))},stroke(){soil.strokes++},
 set fillStyle(v){assert(v)},set strokeStyle(v){assert(v)},
 set lineWidth(v){assert(Number.isFinite(v)&&v>0)}};
const ground=ctx.paintFarm(canvas,v=>(v+92)*512/184,512,184);
assert.equal(ground.originalPlots,plot.length);
assert.equal(ground.originalRows,22);
assert.equal(ground.extraTriangles,0);
assert.equal(soil.fills,2,'Each true seeded field must keep its soil mass');
assert(soil.strokes>=22,'Every existing planted row needs matching terrain wear');
for(const season of [0,1,2,3])for(const compact of [false,true]){
 ctx.data=[];ctx.farmScene={seedHeads:0,stalks:0,stalkTriangles:0};
 const p=ctx.grain(19,.3,41,season);
 assert(p.height>.15&&p.height<1.8&&Number.isFinite(p.headBend));
 assert.equal(p.livingSeason,season!==3);
 const start=made.length;
 ctx.plant(19,.3,41,season,compact);
 const triangles=made.length-start;
 assert(triangles>0&&triangles<=(compact?18:26),
  'Preserve the real near/far field geometry budget, not fake culled crops');
 assert.equal(ctx.farmScene.stalks,1);
 assert.equal(ctx.farmScene.seedHeads,season===3?0:1);
 assert.equal(ctx.farmScene.stalkTriangles,triangles);
}
const a=ctx.grain(19,.3,41,2),b=ctx.grain(19,.3,41,2);
assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
assert.notEqual(ctx.grain(19,.3,42,2).headBend,a.headBend);
assert.doesNotMatch(html.slice(begin,end)+html.slice(fieldStart,fieldEnd),
 /Math\.random\(|people\.push\(|city\.push\(|state\.food\s*[+\-=]/);
console.log('W253 original field grain and real atlas ground source contract PASS; rendering experience requires uncut WebGL and independent A/B');
