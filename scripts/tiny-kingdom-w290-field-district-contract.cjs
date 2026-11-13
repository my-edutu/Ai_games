'use strict';
// W290 Phase 1 original seeded field-geometry/terrain-massing safety floor.
// Running-game aesthetic/performance acceptance is separate, NOT PROVEN here.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const a=html.indexOf('function farmSoil(');
const b=html.indexOf('function ripeningField(',a);
assert(a>0&&b>a,'live original farm district exists');
const source=html.slice(a,b);
assert(source.includes('W290: the complete ORIGINAL wheat'),'new original coherent grain field massing must be present');
assert(source.includes('raised earth furrow'),'original continuous soil ridge must be present');
assert.doesNotMatch(source,/Math\.random\(|people\.push\(|city\.push\(|state\.food\s*[+\-=]/);
const ctx={Math,Number,Error,Array,data:[],farmScene:{rows:0,stalks:0,seedHeads:0,stalkTriangles:0},
 terrain:(x,z)=>.1*Math.sin(x*.1+z*.4),
 biomeHash:i=>{const v=Math.sin(i*12.9898+78.233)*43758.5453;return v-Math.floor(v)},
 rgb:v=>Array.isArray(v)?v:[v/16777215,v/16777215,v/16777215],
 MATERIAL:{ROAD:3},materialScope:(_,fn)=>fn(),
 tri(a,b,c){for(const p of [a,b,c])assert(p.every(Number.isFinite));ctx.data.length+=30},
 quad(a,b,c,d){ctx.tri(a,b,c);ctx.tri(a,c,d)}
};
vm.createContext(ctx);vm.runInContext(source+'\nthis.plant=farmStalk;this.soil=farmSoil;this.profile=authenticGrainHeadProfile;',ctx);
let triangles=0;
for(const season of [0,1,2,3])for(const compact of [true,false]){
 ctx.data=[];ctx.farmScene={rows:0,stalks:0,seedHeads:0,stalkTriangles:0};
 ctx.plant(19.1,.2,101,season,compact);
 triangles=ctx.data.length/30;
 assert.equal(triangles,season===3?4:compact?16:26,
  'all original visible genuine stems have identical bounded triangle contracts');
 assert.equal(ctx.farmScene.stalkTriangles,triangles);
 assert.equal(ctx.farmScene.stalks,1);
 assert.equal(ctx.farmScene.seedHeads,season===3?0:1);
 const p=ctx.profile(19.1,.2,101,season);
 assert(p.height>.16&&p.height<1.8&&p.rootedAt[0]===19.1);
}
ctx.data=[];ctx.farmScene.rows=0;
ctx.soil(16.45,24.65,0,.31,2);
assert.equal(ctx.farmScene.rows,1);
assert.equal(ctx.data.length/30,Math.ceil((24.65-16.45)/.70)*6+
 Math.ceil(Math.ceil((24.65-16.45)/.70)/3)*2,
 'continuous earth furrow preserves its bounded original geometry topology');
console.log('W290 original field massing source PASS: real roots, 4/16/26 triangles per stem, contiguous terrain-following furrow, no invented grain. Running game remains independently gated.');
