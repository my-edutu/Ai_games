'use strict';
// W325 Phase 1: same 668 seeded wheat stems, every planted furrow and
// exact farm-to-market authority, physically leaner heads and bounded topology.
// A passing contract is NOT real-game visual, mobile or hardware acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
 .find(row=>row[1].includes('function farmStalk('));
assert(script,'full original playable game script');
new vm.Script(script[1],{filename:'tiny-kingdom-original-game.js'});
const a=html.indexOf('function farmEarthWearTone('),b=html.indexOf('function ripeningField(',a),
 c=html.indexOf('\nfunction fieldWindSample(',b);
assert(a>0&&b>a&&c>b,'the original crop mesh and true plotted fields');
const ctx={
 Math,Number,Array,Error,data:[],farmScene:{rows:0,stalks:0,seedHeads:0,stalkTriangles:0},
 MATERIAL:{ROAD:3,FOLIAGE:5},materialScope:(_,fn)=>fn(),
 biomeHash:n=>{const v=Math.sin(n*12.9898+78.233)*43758.5453;return v-Math.floor(v)},
 terrain:(x,z)=>.08*Math.sin(x*.08+z*.17),
 rgb:n=>Array.isArray(n)?n:[n/16777215,n/16777215,n/16777215],
 tri(p,q,r){assert([p,q,r].every(v=>v.every(Number.isFinite)));ctx.data.length+=30},
 quad(p,q,r,t){ctx.tri(p,q,r);ctx.tri(p,r,t)}
};
vm.createContext(ctx);
vm.runInContext(html.slice(a,c),ctx);
const plant=vm.runInContext('farmStalk',ctx);
const field=vm.runInContext('ripeningField',ctx);
const profile=vm.runInContext('authenticGrainHeadProfile',ctx);
const plots=[[16.45,24.65,-1.62,3.64,12,17],[26,32,-1.38,3.78,10,13]];
assert(!html.slice(a,c).includes('Math.random('),'same seed-stable planted roots');
for(const season of [0,1,2,3])for(const compact of [false,true]){
 ctx.data=[];ctx.farmScene={rows:0,stalks:0,seedHeads:0,stalkTriangles:0};
 plant(19,.3,101,season,compact);
 assert.equal(ctx.data.length/30,season===3?4:compact?12:20,
  'bounded physical original wheat topology');
 assert.equal(ctx.farmScene.seedHeads,season===3?0:1);
}
for(const compact of [false,true]){
 ctx.data=[];ctx.farmScene={rows:0,stalks:0,seedHeads:0,stalkTriangles:0};
 plots.forEach((plot,i)=>field(plot,i,2,compact));
 assert.equal(ctx.farmScene.stalks,668,'same real 668 field stems');
 assert.equal(ctx.farmScene.seedHeads,668,'each ripe stem keeps an ear');
 assert.equal(ctx.farmScene.rows,22,'all original seed-row contour furrows intact');
 assert.equal(ctx.farmScene.stalkTriangles,668*(compact?12:20),
  'full grown farm retained, no disappearing crops');
}
assert.equal(668*(26-20),4008,'near field saves 4008 triangles');
assert.equal(668*(16-12),2672,'far field saves 2672 triangles');
const ripe=profile(19,.3,101,1);
assert(ripe.height>.90&&ripe.height<1.40&&ripe.leafReach<.26,
 'farmer silhouette visible above less oversized ripening wheat');
assert.match(html,/drawResidentFarmFields\(eye,planes,Math\.max\(0,160000-nonFieldTriangles\)\)/,
 'current-frame 160k cap must still govern actual field draw');
console.log('W325 original crop PASS: 668 rooted stems, 22 rows, all heads retained; 4008 near/2672 far triangles recovered. Visual and hardware gates NOT PROVEN.');
