#!/usr/bin/env node
'use strict';
// W353: real complete field silhouette + authoritative contact clearance.
// Structural RED/GREEN test. Source topology is never a visual acceptance vote.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const a=html.indexOf('function authenticGrainHeadProfile(');
const b=html.indexOf('// W64 read-only CPU witness',a);
assert(a>0&&b>a,'Original actual planted field missing');
const source=html.slice(a,b);
assert.match(source,/W353 human-scale planted field and harvest clearance/);
assert.match(source,/leafReach:\.174\+d\*\.074/);
assert.doesNotMatch(source,/Math\.random\(|people\.push\(|city\.push\(|state\.food\s*[+\-=]/);
const shader=html.slice(html.indexOf('const vs=\`'),html.indexOf('const fs=\`'));
assert(shader.includes('W353 actual farmer-visible cutting corridor'));
assert(shader.includes('world.xz+=fromWorker*opening*stalk*work*.78;'));
assert(shader.includes('smoothstep(.22,1.75,reach)'));
assert(shader.includes('harvestContact.z>.001'));
assert(shader.includes('completedHarvestA'));
const fields=[[16.45,24.65,-1.62,3.64,12,17],[26,32,-1.38,3.78,10,13]];
const ctx={Math,Number,Error,Array,data:[],farmScene:{rows:0,seedHeads:0,stalks:0,stalkTriangles:0},
 FARMSTEAD:{fields},MATERIAL:{FOLIAGE:4},materialScope:(_,fn)=>fn(),
 terrain:(x,z)=>.15*Math.sin(x*.1+z*.4),
 biomeHash:i=>{const y=Math.sin(i*12.9898+78.233)*43758.5453;return y-Math.floor(y)},
 rgb:n=>n,farmSoil(){},
 tri(a,b,c){for(const p of [a,b,c])assert(p.every(Number.isFinite));ctx.data.length+=30},
 quad(a,b,c,d){ctx.tri(a,b,c);ctx.tri(a,c,d)}
};
vm.createContext(ctx);
vm.runInContext(source+'\nthis.profile=authenticGrainHeadProfile;this.plant=ripeningField;',ctx);
for(const season of [0,1,2,3])for(const compact of [true,false]){
 ctx.data=[];ctx.farmScene={rows:0,seedHeads:0,stalks:0,stalkTriangles:0};
 for(let plot=0;plot<2;plot++)ctx.plant(fields[plot],plot,season,compact);
 const count=668;
 assert.equal(ctx.farmScene.stalks,count,'never hide a seeded field root');
 assert.equal(ctx.farmScene.seedHeads,season===3?0:count);
 assert.equal(ctx.data.length/30,
   count*(season===3?4:compact?12:20),
   'complete existing 4/12/20 geometry, no extra raster cost');
 assert.equal(ctx.farmScene.stalkTriangles,ctx.data.length/30);
}
for(let i=0;i<100;i++){
 const p=ctx.profile(19,.2,i,1);
 assert(p.height>.5&&p.height<1.8&&p.leafReach>=.174&&p.leafReach<.249,
  'W375 curved seed-rooted leaves must match exact production reach bounds');
 assert.equal(p.authorityModified,false);
}
assert.equal(ctx.profile(19,.2,12,1).height,ctx.profile(19,.2,12,1).height);
console.log('W353 source geometry and farmer-contact contract PASS (actual gameplay/blind review/hardware still NOT PROVEN)');
